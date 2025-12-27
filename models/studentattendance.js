module.exports = (sequelize, DataTypes) => {
  const StudentAttendance = sequelize.define(
    "StudentAttendance",
    {
      studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Students",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      attendanceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Attendances",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      present: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      createdAt: {
        type: DataTypes.DATE,
        field: "created_at",
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: "updated_at",
      },
    },
    {
      tableName: "StudentAttendances",
      timestamps: true,
      underscored: true,
      indexes: [
      {
        unique: true,
        fields: ["student_id", "attendance_id"]
      }
    ]
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
