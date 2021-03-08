module.exports = (sequelize, DataTypes) => {
    let User = sequelize.define(
        "match_user",
        {
            num: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
            },
            sortno: {
                type: DataTypes.INTEGER.UNSIGNED,
            },
            name: {
                type: DataTypes.STRING(10),
                // allowNull: false,
            },
        },
        {
            timestamps: true,
        }
    );
    return User;
};
