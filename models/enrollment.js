module.exports = (sequelize, DataTypes) => {
  const Enrollment = sequelize.define("Enrollment", {
    courseId: {
      type: DataTypes.INTEGER,
      references: { model: "Courses", key: "id" },
      allowNull: false,
      onDelete: "CASCADE",
    },
    studentId: {
      type: DataTypes.INTEGER,
      references: { model: "Students", key: "id" },
      allowNull: false,
      onDelete: "CASCADE",
    },
    enrolled_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: "Enrollments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  });

  Enrollment.associate = (models) => {
    Enrollment.belongsTo(models.Student, { as: "student", foreignKey: "studentId" });
    Enrollment.belongsTo(models.Course, { as: "course", foreignKey: "courseId" });
  };

  return Enrollment;
};
