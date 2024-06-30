const mongoose = require("mongoose");

// Service Request
const bookingSchema = new mongoose.Schema({
    username: { type: String, require:true },
    bookingTitle:{
        type: String,
        required: true
    },
    bookingDescription:{
        type: String,
        required: true
    },
    category: String, 
    providerId : String,
    jobId: String,
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
    }],
    providerComments: String,
    providerFiles:[{
        type: String
    }]
});
bookingSchema.plugin(require("mongoose-findorcreate"));

const BookingModel = new mongoose.model("Booking", bookingSchema);

module.exports = BookingModel;