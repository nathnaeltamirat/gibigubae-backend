module.exports = (sequelize, DataTypes) => {
  const Attendance = sequelize.define("Attendance", {
    date: { type: DataTypes.DATE, allowNull: false },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    courseId: {
      type: DataTypes.INTEGER,
      references: { model: "Courses", key: "id" },
      allowNull: false,
      onDelete: "CASCADE",
    },
  }, {
    tableName: "Attendances",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  });

  Attendance.associate = (models) => {
    Attendance.belongsToMany(models.Student, {
      through: models.StudentAttendance,
      as: "students",
      foreignKey: "attendanceId",
    });

    Attendance.belongsTo(models.Course, {
      as: "course",
      foreignKey: "courseId",
    });
  };

  return Attendance;
};
