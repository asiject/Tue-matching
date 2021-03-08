const express = require("express");
const router = express.Router();
const models = require("../models");
const { Op, QueryTypes } = require("sequelize");

// let userList = ["강다은", "고우중", "김문주", "김상일", "김원진", "김현아", "박경원", "박유정", "변성우", "서의원", "서정한", "송충용", "양은선", "양요열", "오경수", "이가현", "이사무엘", "이은평", "이주헌", "이화선", "이효성", "정성진", "최진일", "한민구", "황미라", "황애리"];
let userList = [];
const User = models.match_user;
const Count = models.match_count;
const History = models.match_history;

router.post("/match/count", async (req, res) => {
    const { userList } = req.body;
    let groupList = [];
    let tmpList = "";
    if (userList.length > 0) {
        tmpList = "'" + userList.join("','") + "'";
    }
    for (let i = 0; i < userList.length; i++) {
        const name = userList[i];
        let isExists = false;
        let flatGroup = "";
        if (groupList.length > 0) {
            flatGroup = groupList.flat();
            isExists = flatGroup.includes(name);
        }
        if (isExists) {
            continue;
        }
        let mergeArr = "";
        if (flatGroup.length > 0) {
            mergeArr = "'" + flatGroup.join("','") + "'";
        }
        const notInA = mergeArr && `and name not in (${mergeArr})`;
        const notInB = mergeArr && `and bname not in (${mergeArr})`;
        const inA = tmpList && `and name in (${tmpList})`;
        const inB = tmpList && `and bname in (${tmpList})`;

        const records = await models.sequelize.query(
            `SELECT NAME, 0 COUNT, ifnull(usr.sortno,0) usr.num, updatedat
            FROM match_users usr
            WHERE name NOT in (
                SELECT bname
                FROM match_counts
                WHERE aname='${name}'
            )
            and usr.name !='${name}'
            ${inA}
            ${notInA}

            UNION 

            SELECT bname, COUNT , ifnull(usr.sortno,0) usr.num, cnt.updatedat
            FROM match_users usr, match_counts cnt
            WHERE aname = '${name}'
            AND usr.name = cnt.aname
            and bname !='${name}'
            ${inB}
            ${notInB}
            ORDER BY COUNT,num, updatedat asc`,
            {
                type: QueryTypes.SELECT,
            }
        );
        let grpLen = records.length - 2; //
        let group = [name];
        let random = Math.floor(Math.random() * grpLen) + 1;
        if (records[0]) {
            if (!group.includes(records[0].NAME)) group.push(records[0].NAME);
        }
        if (records[random]) {
            if (!group.includes(records[random].NAME)) group.push(records[random].NAME);
        }

        groupList.push(group);
    }
    const t = await models.sequelize.transaction();
    try {
        for (let i = 0; i < groupList.length; i++) {
            let grp = groupList[i];
            if (grp.length > 0) {
                await addGroupCount(grp, t);
                //await addGroupHistory(grp, t);
            }
        }
        await t.commit();
    } catch (err) {
        await t.rollback();
    }

    return res.json({ groupList: groupList });
});

router.get("/match/users", async (req, res) => {
    userList = [];
    await User.findAll({
        order: [
            ["sortno", "Asc"],
            ["name", "Asc"],
        ],
    }).then(resultSet => {
        resultSet.forEach(({ dataValues }) => {
            const user = dataValues;
            userList.push(user);
        });
    });
    return res.json({ userList: userList });
});

router.post("/match/user", async (req, res) => {
    const { name } = req.body;

    const user = await getFindUser(name);
    if (user) {
        return res.send({ status: 500, message: "dup id" });
    } else {
        //addUser
        const newUser = await models.sequelize.transaction(t => {
            return User.create(
                {
                    name: name,
                },
                { transaction: t }
            )
                .then(resultSet => {
                    return resultSet.dataValues;
                })
                .catch(e => {
                    console.log("e >>>", e);
                });
        });
        if (newUser) {
            userList.push(newUser);
        }
        return res.json({ status: 200, message: "ok", user: newUser });
    }
});

router.delete("/match/user", async (req, res) => {
    const { name } = req.query;
    console.log("delete:/match/user > ", name);
    const user = await getFindUser(name);
    if (user) {
        //delUser
        const t = await models.sequelize.transaction();
        try {
            await History.destroy({ where: { [Op.or]: [{ aname: name }, { bname: name }] } }, { transaction: t });
            await Count.destroy({ where: { [Op.or]: [{ aname: name }, { bname: name }] } }, { transaction: t });
            await User.destroy({ where: { name: name } }, { transaction: t });
            t.commit();
        } catch (err) {
            console.log("err >> ", err);
            t.rollback();
        }
        let index = -1;
        const len = userList.length;
        for (let idx = 0; idx < len; idx++) {
            const data = userList[idx];
            if (data.name == user.name) {
                index = idx;
                if (idx > 0) {
                    userList = [...userList.splice(0, idx), ...userList.splice(idx, len)];
                }
                break;
            }
        }
        return res.json({ status: 200, message: "ok", idx: index });
    } else {
        return res.json({ status: 500, message: "사용자가 없습니다." });
    }
});

/**
 * 단일 사용자 검색
 * @param {*} name
 * @returns
 */
const getFindUser = async name => {
    return await User.findAll({ where: { name: name } }).then(resultSet => {
        return resultSet.length > 0 && resultSet[0].dataValues;
    });
};

/**
 * groupCount 변경
 * @param {*} group
 * @param {*} t

 */
const addGroupCount = async (group, t) => {
    for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
            let aname = group[i];
            let bname = group[j];
            let count = 1;
            await Count.findAll({ where: { aname: aname, bname: bname } }).then(async resultSet => {
                if (resultSet.length > 0) {
                    count = Number(resultSet[0].dataValues.count);
                }
                if (resultSet.length > 0) {
                    await updateCount(aname, bname, count + 1, t);
                    await updateCount(bname, aname, count + 1, t);
                } else {
                    await createCount(aname, bname, 1, t);
                    await createCount(bname, aname, 1, t);
                }
            });
        }
    }
};

/**
 * GroupHistory 변경
 * @param {*} group
 * @param {*} t
 */
const addGroupHistory = async (group, t) => {
    for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
            let aname = group[i];
            let bname = group[j];

            await createHistory(aname, bname, t);
            await createHistory(bname, aname, t);
        }
    }
};

/**
 * match counts 데이터 수정
 * @param {*} aname
 * @param {*} bname
 * @param {*} count
 * @param {*} t
 * @returns
 */
const updateCount = (aname, bname, count, t) => {
    return Count.update(
        { count: count },
        {
            where: {
                aname: aname,
                bname: bname,
            },
            transaction: t,
        }
    );
};

/**
 * match counts 데이터 추가
 * @param {*} aname
 * @param {*} bname
 * @param {*} count
 * @param {*} t
 */
async function createCount(aname, bname, count, t) {
    return await Count.create(
        {
            aname: aname,
            bname: bname,
            count: count,
        },
        { transaction: t }
    );
}

/**
 * match_histories 데이터 추가
 * @param {*} aname
 * @param {*} bname
 * @param {*} t
 */
async function createHistory(aname, bname, t) {
    await History.create(
        {
            aname: aname,
            bname: bname,
        },
        { transaction: t }
    );
}

module.exports = router;
