/*********************************************************************************************************
*	postrequest.js : Handles service request submitted by the end user etc.
* Author: Constant Pagoui.
*	Date: 03-19-2023
*	Copyright: MosalaPro TM
*
**********************************************************************************************************/
const UserModel = require("../models/user");
const CategoryModel = require("../models/category");
const PostRequestModel = require("../models/postRequest");
const passport = require("passport");
const _ = require("lodash");
const JobApplication = require("./jobApplication");
const JobApplicationModel = require("../models/jobApplication");
const BookingModel = require("../models/booking");

const PostRequestService =  {
  
    postServiceRequest: async(req, res)=>{
        //TODO:Uncomment following if to enabled authentication layer
        const multer = require("multer");
        const fs = require("fs");
        if (req.isAuthenticated()) {
          try {
            const storage = multer.diskStorage({
              destination: function (req, file, cb) {
                const dir = "./postAttachments";
                if (!fs.existsSync(dir)) {
                  fs.mkdirSync(dir);
                }
      
                cb(null, dir); // Save files in the 'uploads' directory
              },
              filename: function (req, file, cb) {
                const uniquePrefix =
                  Date.now() + "-" + Math.round(Math.random() * 1e9);
                cb(null, uniquePrefix + "-" + file.originalname); // Set a unique filename for the uploaded file
              },
            });
      
            const upload = multer({
              storage: storage,
              limits: {
                fileSize: 1024 * 1024 * 100, // Limit the file size to 100MB
              },
              fileFilter: function (req, file, cb) {
                cb(null, true); // Allow any type of file
              },
            }).array("files", 10); // Allow up to 10 files to be uploaded in one request
      
            upload(req, res, async function (err) {
              if (err instanceof multer.MulterError) {
                // A Multer error occurred when uploading
                console.log(err);
                res.status(400).send({
                  responseCode: 400,
                  responseMessage: "Error uploading files",
                });
              } else if (err) {
                // An unknown error occurred when uploading
                console.log(err);
                res.status(400).send({
                  responseCode: 400,
                  responseMessage: "Error uploading files",
                });
              }
      
              // Everything went fine
              console.log("In the method postRequest.");
              console.log(req.files); // Contains information about the uploaded files
              const cat = await CategoryModel.findOne({name: req.body.requestCategory}).exec();
              //Storing in db
              const newRequest = new PostRequestModel({
                username: req.body.username,
                requestTitle: _.trim(_.capitalize(req.body.requestTitle)),
                requestDescription: req.body.requestDescription,
                requestCategory: _.trim(_.capitalize(cat.name)),
                requestCategoryIcon: cat.icon,
                budget: req.body.requestBudget,
                deadline: req.body.requestDeadline,
                status: "active",
                createdAt: new Date(),
                lastUpdate: new Date(),
                files: req.files.map((file) => file.filename),
              }).save().then(success =>{
                  console.log("Posted successfully!");
      
                  res.redirect("/")
              }).catch(err => {console.log("Error occured while saving into the db: "+err);});
             
            });
          } catch (e) {
            console.log(e);
            res.status(400).send({
              responseCode: 400,
              responseMessage: "Error posting service request: "+e,
            });
          }
        } 
      },

      updateServiceRequest: async(req, res)=>{
        try{
          const ret = await PostRequestModel.findByIdAndUpdate(req.body._id, {_id: req.body._id, lastUpdate:new Date(), ...req.body});
          if(!ret){
            res.status(401).send("An error occured (Service Request)");
            console.log("REQUEST SERVICE:: Error occured.");
          }
          else {
            res.status(200).send({message: "Ok", status:200});
            console.log("REQUEST SERVICE:: Request changes have been saved.");
          }
        
          return;
        }
        catch(error){
          console.log("REQUEST SERVICE:: Error occured: "+error);
          return;
        }
      },

      getActiveRequests: async(req, res)=>{
        result = [];
        const activeServiceRequets = await PostRequestModel.find({status: "active"}).exec();
        const jobsApplied = await JobApplicationModel.find({providerId: req.user._id}).exec();

        activeServiceRequets.forEach(asr => {
            applied = false;
            jobsApplied.forEach(ja=>{
              if(ja.jobId == asr._id){
                applied = true;
              }
            });

            if(!applied)
              result.push(asr);
        });
       
        return result;

      },

      getBookedPros: async (req, res)=>{
        const pRequests = await PostRequestModel.find({username:req.user.username}).exec();
        let pros = [];
        for(let i = 0; i < pRequests.length; i++){
          if(pRequests[i].status == 'in-progress' || pRequests[i].status=='completed'){
            const booking = await BookingModel.findOne({jobId: pRequests[i]._id}).exec();
            if(booking){
              const pro = await UserModel.findById(booking.providerId).exec();
              pros.push(pro.firstName +" "+pro.lastName);
            }else
              pros.push(" ");
            
          }
          else
            pros.push(" ");
        }

        return pros.reverse();
      },

      resubmitRequest: async (req, res)=>{
        const pRequest = await PostRequestModel.findByIdAndUpdate(req.body.jobId, {status: "active", lastUpdate: new Date()}).then(success=>{
          console.log("POST REQUEST:: request has been resubmitted successfully.");
          res.status(200).send({message: "Ok", status: 200});
          return;
        }).catch(err=>{
          console.log("POST REQUEST:: An error occured while resubmitting request: "+err);
          res.status(401).send({message: "Error", status: 401});
          return;
        });
        return;
      },

      cancelRequest: async (req, res)=>{
        const pRequest = await PostRequestModel.findByIdAndUpdate(req.body.jobId, {status: "cancelled", lastUpdate: new Date()}).then(success=>{
          console.log("POST REQUEST:: request has been cancelled successfully.");
          res.status(200).send({message: "Ok", status: 200});
          return;
        }).catch(err=>{
          console.log("POST REQUEST:: An error occured while cancelling request: "+err);
          res.status(401).send({message: "Error", status: 401});
          return;
        });
        return;
      },

      checkBookingsDeadline: async ()=>{
        const providers = await UserModel.find({accountType:"provider"}).exec();
        console.log("POST REQUEST:: Providers: "+providers.length);
        if(providers){
          let bookingsWithCloseDeadlines = [];
          for(let j = 0; j < providers.length; j++){
            try{
              const bookings = await BookingModel.find({providerId: providers[j]._id}).exec();
              console.log("POST REQUEST:: Bookings: "+bookings.length);
              if(bookings){
                const today = new Date();
                bookings.forEach(booking=>{
                  const deadline = new Date(booking.deadline);
                  const diffTime = deadline - today;
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  console.log("today: "+today+" - deadline: "+deadline+"; diff: "+diffDays);
                  if(diffDays <= 2 && (booking.status == "active" || booking.status == "in-progress") ){
                    bookingsWithCloseDeadlines.push(booking);
                  }
                });
              }
            }catch(error){
              console.log("POST REQUEST:: Error occured while retrieving bookings: "+error);
            }
          }
          return bookingsWithCloseDeadlines;
        }
        else{
          console.log("POST REQUEST:: No providers were returned.");
        }
      }

}

module.exports = PostRequestService;
