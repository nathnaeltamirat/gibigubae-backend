'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('ConfessionFathers', [
      { name: 'Father John', phone_number: '0911000001', created_at: new Date(), updated_at: new Date() },
      { name: 'Father Michael', phone_number: '0911000002', created_at: new Date(), updated_at: new Date() }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ConfessionFathers', null, {});
  }
};
