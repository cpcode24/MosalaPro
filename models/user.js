const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  facebook_id:{
    type: String,
    unique: true
  },
  google_id: {
    type: String,
    unique: true
  },
  firstName: {
    type: String,
    required: true,
    min: 3,
    max: 45,
  },
  lastName: {
    type: String,
    min: 2,
    max: 45,
  },
  email: {
    type: String,
  },
  username: String,
  phone: {
    type: String,
    min: 7,
    max: 15,
  },
  verifiedContact: String,
  address: {
    type: String,
    required: false,
  },
  country: String,
  city: String,
  createdAt: {
    type: Date,
    required: true,
  },
  lastUpdate: {
    type: Date,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  payments: {
    type: Array
  },
  description: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    default: "",
  },
  facebookProfileLink: String,
  linkedinProfileLink: String,
  countryCode: String,
  rate: {
    type: Number,
    default:"",
  },
  skills: {
    type: Array
  },
  favoriteProviders: {
    type: Array
  },
  accountType: {
    type: String,
    default: "user"
  },
  rating:{
    type: Number,
    default: 5
  },
  category: {
    type: String,
    default: "",
  },
  photo: {
    type: String,
    default: "default.png",
  },
  subscriptionPlan: {
    type: String,
    default: ""
  }
});

userSchema.plugin(require("passport-local-mongoose"));
userSchema.plugin(require("mongoose-findorcreate"));

const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;
