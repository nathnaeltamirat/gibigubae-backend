'use strict';
const { ConfessionFather } = require('../models');

module.exports = {
  async up(queryInterface, Sequelize) {
    await ConfessionFather.bulkCreate([
      { name: "Father X", phone_number: "1234567890" },
      { name: "Father Y", phone_number: "0987654321" }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ConfessionFathers', null, {});
  }
};
