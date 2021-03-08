module.exports = (sequelize, DataTypes) => {
    let User = sequelize.define(
        "match_user",
        {
            num: {
                type: DataTypes.INTEGER.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
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
