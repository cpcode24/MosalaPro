const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name:{
      type: String,
      min:3
  },
  description:{
      type: String,
      required: true,
      min: 3,
      max: 45
  },
  icon:{
      type: String
  },
  createdAt:{
      type: Date,
  },
  lastUpdate:{
      type: Date,
  },

});

// categorySchema.plugin(require("passport-local-mongoose"));
// categorySchema.plugin(require("mongoose-findorcreate"));

const CategoryModel = mongoose.model("Category", categorySchema);
module.exports = CategoryModel;