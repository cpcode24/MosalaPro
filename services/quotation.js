/*********************************************************************************************************
*	quotqtion.js : Handles quotations operations.
*   Author: Constant Pagoui.
*	Date: 06-06-2023
*	Copyright: MosalaPro TM
*
**********************************************************************************************************/

const BookingModel = require("../models/booking");
const PostRequestModel = require("../models/postRequest");
const QuotationModel = require("../models/quotation");
const Notification = require("../services/notification");
const NotificationObj = new Notification();
const JobApplication = require("../services/jobApplication");
const jobApplicationHander = new JobApplication();

class Quotation {

    async send(req, res){
        const job = await PostRequestModel.findById(req.body.jobId).exec();
        const booking = await BookingModel.findById(req.body.jobId).exec();
        if(job){
            const newQuotation = new QuotationModel({
                username: job.username,
                budget: req.body.budget,
                budgetType: req.body.quotationType,
                quotationDescription:req.body.quotationDesc,
                providerId: req.user._id,
                category: job.requestCategory, 
                jobId: job._id,
                initialBudget: job.budget,
                deadline: job.deadline,
                status: "sent",
                createdAt: new Date(),
                lastUpdate: new Date()
            }).save().then(async success => {
                await jobApplicationHander.applyWithQuotation(req, res);
                console.log("QUOTATION:: Quotation saved successfully!");
                res.status(200).send({message: "Ok", status: 200});
                return;
            }).catch(err=>{
                console.log("QUOTATION:: Error occured while saving quotation: "+err);
                res.status(401).send({message: "Error occured", status: 401});
                return;
            });
        }else if(booking){
            const newQuotation = new QuotationModel({
                username: booking.username,
                budget: req.body.budget,
                budgetType: req.body.quotationType,
                quotationDescription:req.body.quotationDesc,
                providerId: req.user._id,
                category: booking.category, 
                jobId: booking.jobId,
                initialBudget: booking.budget,
                deadline: booking.deadline,
                status: "sent",
                createdAt: new Date(),
                lastUpdate: new Date()
            }).save().then(async success => {
                await NotificationObj.notifyBookingQuotation(req, res);
                console.log("QUOTATION:: Quotation saved successfully!");
                res.status(200).send({message: "Ok", status: 200});
                return;
            }).catch(err=>{
                console.log("QUOTATION:: Error occured while saving quotation: "+err);
                res.status(401).send({message: "Error occured", status: 401});
                return;
            });

        }
        
        else{
            console.log("QUOTATION:: Error: Job not found!");
            res.status(401).send({message: "Error occured", status: 401});
            return;
        }
        
    }

    

}

module.exports = Quotation;