'use strict';
const { Attendance, Course } = require('../models');

module.exports = {
  async up(queryInterface, Sequelize) {
    const courses = await Course.findAll();

    await Attendance.bulkCreate([
      { date: new Date(), code: "ATT001", courseId: courses[0].id },
      { date: new Date(), code: "ATT002", courseId: courses[1].id }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Attendances', null, {});
  }
};
