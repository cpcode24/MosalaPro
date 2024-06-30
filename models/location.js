const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  country: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
});
locationSchema.plugin(require("passport-local-mongoose"));
locationSchema.plugin(require("mongoose-findorcreate"));

module.exports = new mongoose.model("Location", locationSchema);
