'use strict';
const bcrypt = require('bcryptjs');
const { Student, ConfessionFather } = require('../models');

module.exports = {
  async up(queryInterface, Sequelize) {
    const fathers = await ConfessionFather.findAll();

    await Student.bulkCreate([
      {
        first_name: "Alice",
        father_name: "Bob",
        grand_father_name: "Charles",
        id_number: "S001",
        email: "alice@example.com",
        password: await bcrypt.hash('12345678', 10),
        gender: "female",
        phone_number: "1111111111",
        id_card_image_path: "path/to/id1.jpg",
        confessionFatherId: fathers[0].id,
        department: "Software Engineering",
        year: 2,
        role: 'admin',
        dorm_block: 14,
        room_number: 101,
        is_verified: true,
        is_graduated: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        first_name: "David",
        father_name: "Edward",
        grand_father_name: "Frank",
        id_number: "S002",
        email: "david@example.com",
        password: await bcrypt.hash('password123', 10),
        gender: "male",
        phone_number: "2222222222",
        id_card_image_path: "path/to/id2.jpg",
        confessionFatherId: fathers[1].id,
        department: "Mechanical Engineering",
        year: 3,
        dorm_block: 14,
        room_number: 202,
        is_verified: true,
        is_graduated: false,
        created_at: new Date(),
        updated_at: new Date(),
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Students', null, {});
  }
};
