const mongoose = require("mongoose");

// Service Request
const invoiceSchema = new mongoose.Schema({
    customerId: { type: String, require:true },
    providerId: { type: String, require:true },
    jobId: String,
    invoiceTitle:{
        type: String,
        required: true
    },
    invoiceDescription:{
        type: String,
        required: true
    },
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
    paymentDate: Date
});
invoiceSchema.plugin(require("mongoose-findorcreate"));

const InvoiceModel = new mongoose.model("Invoice", invoiceSchema);

module.exports = InvoiceModel;