'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Hash the password (you should change this in real use!)
    const hashedPassword = await bcrypt.hash('12345678', 10);



    await queryInterface.bulkInsert('Students', [
      {
        first_name: 'Super',
        father_name: 'Admin',
        grand_father_name: 'User',
        christian_name: 'None',
        id_number: 'ADMIN001',
        email: 'admin@gmail.com',
        password: hashedPassword,
        gender: 'male', 
        phone_number: '0911111111',
        id_card_image_path: '/uploads/default-admin-id.jpg',
        role: 'admin', // or 'admin' depending on your enum
        is_verified: true,

        created_at: new Date(),
        updated_at: new Date(),
      }
    ]);

    console.log('Super Admin created successfully: admin@gibigubae.com / admin123');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Students', {
      email: 'admin@gmail.com'
    });
  }
};