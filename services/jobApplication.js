/*********************************************************************************************************
*	jobApplication.js : Handles job application operations performed by providers.
*   Author: Constant Pagoui.
*	Date: 04-13-2023
*	Copyright: MosalaPro TM
*
**********************************************************************************************************/

const JobApplicationModel = require("../models/jobApplication");
const PostRequestModel = require("../models/postRequest");
const UserModel = require("../models/user");
const NotificationModel = require("../models/notification");


class JobApplication {
    async apply(req, res){
        console.log("Req info: "+req.body.username+" - "+req.user._id+" - "+req.body.jobId);
        const user = await UserModel.findOne({username: req.body.username}).exec();
        const newJobApplication = await new JobApplicationModel({
            userId: user._id,
            providerId:  req.user._id,
            jobId: req.body.jobId,
            status: "applied",
            createdAt: new Date(),
            lastUpdate: new Date()
        }).save( async function (err) {
            if (err) {
                console.log("JOBAPPLICATION:: Error occured while saving application: "+err);
                res.status(401).send({error:"Error occured while sending message", status: 300} );
                return;
            }else{
                console.log("JOBAPPLICATION:: Application has been sent successfully.");
                //PostRequestModel.updateOne({_id: req.body.jobId}, {$set: {providerId: req.user._id}} ).exec();
                const notification = new NotificationModel({
                    causedByUserId: req.user._id,
                    causedByItem: req.body.jobId,
                    receiverId: user._id,
                    icon:"fa-tasks",
                    title: "A service provider has applied for your service request.",
                    content: "Servive provider "+req.user.firstName+" "+req.user.lastName+" has applied for your service request. Check service provider's profile and hire.",
                    createdAt: new Date(),
                    lastUpdate: new Date()
                }).save(async function (err) {
                    if (err) {console.log("JOBAPPLICATION:: Error occured while creating notification.");}
                    else console.log("JOBAPPLICATION:: Notification has been successfuly saved"); });

                res.status(200).send({message:"JOBAPPLICATION:: Application sent successfully!", status:200} );
                return;
            }
        });
        return;
    }

    async applyWithQuotation(req, res){
        console.log("Req info:  "+req.body.jobId);
        const job = await PostRequestModel.findById(req.body.jobId).exec();
        const endUser = await UserModel.findOne({username:job.username}).exec();
        if(user && job){
            const newJobApplication = await new JobApplicationModel({
                userId: endUser._id,
                providerId:  req.user._id,
                jobId: req.body.jobId,
                status: "applied",
                createdAt: new Date(),
                lastUpdate: new Date()
            }).save( async function (err) {
                if (err) {
                    console.log("JOBAPPLICATION:: Error occured while saving application: "+err);
                    return;
                }else{
                    console.log("JOBAPPLICATION:: Application with quotation has been sent successfully.");
                    PostRequestModel.updateOne({_id: req.body.jobId}, {$set: {providerId: req.user._id}} ).exec();
                    const notification = new NotificationModel({
                        causedByUserId: req.user._id,
                        causedByItem: req.body.jobId,
                        icon:"fa-tasks",
                        receiverId: endUser._id,
                        title: "A service provider submitted a quotation for your service request.",
                        content: "Servive provider "+req.user.firstName+" "+req.user.lastName+" has applied for your service request with a quotation. Check service provider's profile and hire.",
                        createdAt: new Date(),
                        lastUpdate: new Date()
                    }).save(async function (err) {
                        if (err) {console.log("JOBAPPLICATION:: Error occured while creating notification.");}
                        else console.log("JOBAPPLICATION:: Notification has been successfuly saved"); });
                    return;
                }
            });
        }else{
            console.log("JOBAPPLICATION:: User and job not found.");
            return;
        }
        
        return;
    }

    async cancelApplication(req, res){
        const jobApplication = await JobApplicationModel.findOneAndUpdate({jobId: req.body.jobId}, {status: "cancelled"}).then(success=>{
            res.status(200).send({status: 200, message: "Application cancelled successfully."});
            return;
        }).catch(err=>{
            console.log("JOB APPLICATION:: Error occured while cancelling application");
            res.status(401).send({status: 401, message: "Error occured"});
            return;
        });
       
    }

    async getAppliedJobs(req, res){
        let appliedJobs = [];
        const ja = await JobApplicationModel.find({providerId: req.user._id}).exec();
            for(let i = 0; i < ja.length; i++){
                const sr = await PostRequestModel.findOne({_id:ja[i].jobId}).exec();
                sr.createdAt = ja[i].createdAt;
                sr.appStatus = ja[i].status;
                appliedJobs.push(sr);
            }
        
        return appliedJobs.reverse();
    }

    async getApplicants(jobId_){
        const applications = await JobApplicationModel.find({jobId: jobId_}).exec();

        let inPros = [];
        //for(let i = 0; i < applications.length; i++){
            const pro = await UserModel.findById(applications[0].providerId).exec();
            inPros.push(pro);
            const pro1 = await UserModel.findById(applications[1].providerId).exec();
            inPros.push(pro1);
        //}
        console.log(inPros);
        return inPros;
    }

}

module.exports = JobApplication;