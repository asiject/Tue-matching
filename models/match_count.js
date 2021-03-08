module.exports = (sequelize, DataTypes) => {
    const Count = sequelize.define(
        "match_count",
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
            count: {
                type: DataTypes.INTEGER.UNSIGNED,
            },
        },
        {
            timestamps: true,
        }
    );

    return Count;
};
