'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Courses', 'year_level', {
      type: Sequelize.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    });

    await queryInterface.addColumn('Courses', 'semester', {
      type: Sequelize.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 2,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Courses', 'year_level');
    await queryInterface.removeColumn('Courses', 'semester');
  },
};
