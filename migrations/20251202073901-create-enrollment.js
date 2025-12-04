'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Enrollments', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      studentId: {
        type: Sequelize.INTEGER,
        references: { model: "Students", key: "id" },
        allowNull: false,
        onDelete: "CASCADE",
      },
      courseId: {
        type: Sequelize.INTEGER,
        references: { model: "Courses", key: "id" },
        allowNull: false,
        onDelete: "CASCADE",
      },
      enrolled_at: { type: Sequelize.DATE, defaultValue: Sequelize.fn('NOW') },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Enrollments');
  }
};
