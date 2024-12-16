const mongoose = require("mongoose");

const UserDetailSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  idNumber: { type: String, required: true },
  birthday: { type: String, required: true },
  program: { type: String }, // For students
  department: { type: String }, // For faculty
  interests: [String], // List of interests (max 6)
  mbtiType: { type: String }, // MBTI result
}, {
  collection: "UserInfo", // Collection name in MongoDB
});

module.exports = mongoose.model("UserInfo", UserDetailSchema);
