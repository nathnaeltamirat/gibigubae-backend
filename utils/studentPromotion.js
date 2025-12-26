const { Student, Sequelize } = require("../models");

const promoteStudents = async () => {
  try {
    // Increment year for students with year < 5
    const [updatedCount] = await Student.update(
      { year: Sequelize.literal("year + 1") },
      {
        where: { year: { [Sequelize.Op.lt]: 5 } }, // only promote <5
      }
    );

    console.log(`Promoted ${updatedCount} students to the next year.`);
  } catch (err) {
    console.error("Error during student promotion:", err);
  }
};

module.exports = promoteStudents;
