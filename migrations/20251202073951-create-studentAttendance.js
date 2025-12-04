'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('StudentAttendances', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      student_id: {
        type: Sequelize.INTEGER,
        references: { model: "Students", key: "id" },
        allowNull: false,
        onDelete: "CASCADE",
      },
      attendance_id: {
        type: Sequelize.INTEGER,
        references: { model: "Attendances", key: "id" },
        allowNull: false,
        onDelete: "CASCADE",
      },
      present: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('StudentAttendances');
  }
};
