'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Students', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      first_name: { type: Sequelize.STRING, allowNull: false },
      father_name: { type: Sequelize.STRING, allowNull: false },
      grand_father_name: { type: Sequelize.STRING, allowNull: false },
      christian_name: { type: Sequelize.STRING, allowNull: true },
      id_number: { type: Sequelize.STRING, allowNull: false },       // add unique: true    since all id is unique
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: false },
      gender: { type: Sequelize.ENUM("male", "female"), allowNull: false },
      phone_number: { type: Sequelize.STRING(15), allowNull: false },
      id_card_image_path: { type: Sequelize.STRING, allowNull: false },
      role: { type: Sequelize.ENUM("student", "admin"), defaultValue: "student" },
      is_verified: { type: Sequelize.BOOLEAN, defaultValue: false },
      department: { 
        type: Sequelize.ENUM(
          "Electromechanical Engineering",
          "Chemical Engineering",
          "Software Engineering",
          "Mechanical Engineering",
          "Electrical and Computer Engineering",
          "Civil Engineering",
          "Architecture",
          "Applied Science",
          "Freshman Engineering",
          "Biotechnology",
          "Industrial Chemistry",
          "Mining",
          "Food Science",
          "Masters"
        ),
        allowNull: true
      },
      year: { type: Sequelize.INTEGER, allowNull: true },
      dorm_block: { type: Sequelize.INTEGER, allowNull: true },
      room_number: { type: Sequelize.INTEGER, allowNull: true },
      confessionFatherId: {
        type: Sequelize.INTEGER,
        references: { model: "ConfessionFathers", key: "id" },
        allowNull: true,
        onDelete: "SET NULL"
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Students');
  }
};
