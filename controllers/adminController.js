const promoteStudents = require("../utils/promoteStudents");

exports.manualPromotion = async (req, res) => {
  try {
    await promoteStudents();
    res.json({ success: true, message: "Student promotion completed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Promotion failed" });
  }
};