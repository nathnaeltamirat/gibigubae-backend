'use strict';
const { StudentAttendance, Student, Attendance } = require('../models');

module.exports = {
  async up(queryInterface, Sequelize) {
    const students = await Student.findAll();
    const attendances = await Attendance.findAll();

    await StudentAttendance.bulkCreate([
      { studentId: students[0].id, attendanceId: attendances[0].id, present: true },
      { studentId: students[1].id, attendanceId: attendances[1].id, present: false }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('StudentAttendances', null, {});
  }
};
