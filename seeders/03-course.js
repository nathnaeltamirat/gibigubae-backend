'use strict';
const { Course } = require('../models');

module.exports = {
  async up(queryInterface, Sequelize) {
    await Course.bulkCreate([
      {
        course_name: "Introduction to Programming",
        description: "Learn basic programming concepts.",
        start_date: new Date(),
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 3)),
        enrollment_start_date: new Date(),
        enrollment_deadline: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        year_level: 1,
        semester: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        course_name: "Mechanical Design",
        description: "Learn fundamentals of mechanical design.",
        start_date: new Date(),
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 3)),
        enrollment_start_date: new Date(),
        enrollment_deadline: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        year_level: 2,
        semester: 1,
        created_at: new Date(),
        updated_at: new Date(),
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Courses', null, {});
  }
};
