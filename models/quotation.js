const mongoose = require("mongoose");

// Service Request
const quotationSchema = new mongoose.Schema({
    username: { type: String, require:true },
    budget:{
        type: Number,
        required: true
    },
    budgetType: String,
    quotationDescription:{
        type: String,
        required: true
    },
    category: String, 
    providerId : String,
    jobId: {type: String,
            required: true},
    initialBudget: {
        type: Number,
        required: true
    },
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
    }
});
quotationSchema.plugin(require("mongoose-findorcreate"));

const QuotationModel = new mongoose.model("Quotation", quotationSchema);

module.exports = QuotationModel;