'use strict';
const { Enrollment, Student, Course } = require('../models');

module.exports = {
  async up(queryInterface, Sequelize) {
    const students = await Student.findAll();
    const courses = await Course.findAll();

    await Enrollment.bulkCreate([
      { studentId: students[0].id, courseId: courses[0].id },
      { studentId: students[1].id, courseId: courses[1].id }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Enrollments', null, {});
  }
};
