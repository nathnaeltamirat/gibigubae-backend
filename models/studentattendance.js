module.exports = (sequelize, DataTypes) => {
  const StudentAttendance = sequelize.define(
    "StudentAttendance",
    {
      studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "student_id",
        references: { model: "Students", key: "id" },
      },
      attendanceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "attendance_id",
        references: { model: "Attendances", key: "id" },
      },
      present: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      tableName: "StudentAttendances",
      timestamps: true,
      underscored: true,
    }
  );

  StudentAttendance.associate = (models) => {
    StudentAttendance.belongsTo(models.Student, {
      foreignKey: "studentId",
      as: "student",
    });

    StudentAttendance.belongsTo(models.Attendance, {
      foreignKey: "attendanceId",
      as: "attendance",
    });
  };

  return StudentAttendance;
};
