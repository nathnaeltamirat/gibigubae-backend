'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Attendances', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      date: { type: Sequelize.DATE, allowNull: false },
      code: { type: Sequelize.STRING, allowNull: false, unique: true },
      courseId: {
        type: Sequelize.INTEGER,
        references: { model: "Courses", key: "id" },
        allowNull: false,
        onDelete: "CASCADE",
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Attendances');
  }
};
