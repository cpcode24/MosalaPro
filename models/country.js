const mongoose = require("mongoose");

const countrySchema = new mongoose.Schema({
  name: {
    type: String,
    min: 3,
  },
  phone_code: String,
  currency_name: String,
  currency_symbol: String,
  capital: String,
  region: String,
  subregion: String,
  latitude: Number,
  longitude: Number,
});
countrySchema.plugin(require("passport-local-mongoose"));
countrySchema.plugin(require("mongoose-findorcreate"));

const CountryModel = mongoose.model("Country", countrySchema);

module.exports = CountryModel;