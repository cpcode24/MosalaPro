const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
});

module.exports = new mongoose.model("Token", tokenSchema);