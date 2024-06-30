const mongoose = require("mongoose");

// Service Request
const jobApplicationSchema = new mongoose.Schema({
    userId: { type: String, required:true },
    providerId: { type: String, required:true },
    jobId:{type: String, required: true},
    status: {type: String, default: "active"},
    createdAt:{
        type: Date,
        required: true
    },
    lastUpdate:{
        type: Date,
        required: true
    }
});
jobApplicationSchema.plugin(require("mongoose-findorcreate"));

const JobApplicationModel = new mongoose.model("JobApplication", jobApplicationSchema);

module.exports = JobApplicationModel;