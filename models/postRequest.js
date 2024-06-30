const mongoose = require("mongoose");

// Service Request
const postRequestSchema = new mongoose.Schema({
    username: { type: String, require:true },
    requestTitle:{
        type: String,
        required: true
    },
    requestDescription:{
        type: String,
        required: true
    },
    requestCategory:{
        type: String,
        required: true
    },
    requestCategoryIcon:{
        type: String
    },
    providerId : String,
    budget: Number,
    deadline: String,
    status:{
        type: String,
        required: true
    },
    createdAt:{
        type: Date,
        required: true
    },
    lastUpdate:{
        type: Date,
        required: true
    },

    files: [{
        type: String
    }]
});
postRequestSchema.plugin(require("mongoose-findorcreate"));

const PostRequestModel = new mongoose.model("PostRequest", postRequestSchema);

module.exports = PostRequestModel;