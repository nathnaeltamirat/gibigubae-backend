"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Students", "confessionFatherId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "ConfessionFathers",
        key: "id",
      },
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Students", "confessionFatherId");
  },
};
