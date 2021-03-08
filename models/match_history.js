module.exports = (sequelize, DataTypes) => {
    const History = sequelize.define(
        "match_history",
        {
            num: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            aname: {
                type: DataTypes.STRING(10),
                // allowNull: false,
            },
            bname: {
                type: DataTypes.STRING(10),
                // allowNull: false,
            },
        },
        {
            timestamps: true,
        }
    );
    return History;
};
