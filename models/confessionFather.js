module.exports = (sequelize, DataTypes) => {
  const ConfessionFather = sequelize.define(
    "ConfessionFather",
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone_number: {
        type: DataTypes.STRING(15),
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "ConfessionFathers",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  ConfessionFather.associate = (models) => {
    // One ConfessionFather can have many students
    ConfessionFather.hasMany(models.Student, {
      as: "students",
      foreignKey: "confessionFatherId",
      onDelete: "SET NULL", // if father is deleted, student stays
    });
  };

  return ConfessionFather;
};
