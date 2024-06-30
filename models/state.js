const mongoose = require("mongoose");

const stateSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    min: 3,
  },
  state_code: {
    type: String,
    required: true,
  },
  country: String,
  latitude: Number,
  longitude: Number,
});
stateSchema.plugin(require("passport-local-mongoose"));
stateSchema.plugin(require("mongoose-findorcreate"));

module.exports = new mongoose.model("State", stateSchema);
