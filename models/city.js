const mongoose = require("mongoose");

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    min: 3,
  },
  country: String,
  latitude: Number,
  longitude: Number,
});
citySchema.plugin(require("passport-local-mongoose"));
citySchema.plugin(require("mongoose-findorcreate"));

const CityModel = mongoose.model("City", citySchema);
module.exports = CityModel;
