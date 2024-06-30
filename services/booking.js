/*********************************************************************************************************
*	booking.js : Handles booking submitted by the end user directly to provider.
* Author: Constant Pagoui.
*	Date: 05-14-2023
*	Copyright: MosalaPro TM
*
**********************************************************************************************************/
const UserModel = require("../models/user");
const CategoryModel = require("../models/category");
const BookingModel = require("../models/booking");
const passport = require("passport");
const JobApplication = require("./jobApplication");
const JobApplicationModel = require("../models/jobApplication");
const PostRequestModel = require("../models/postRequest");
const NotificationModel = require("../models/notification");

const BookingService =  {
  
    postBooking: async(req, res)=>{
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
            }).array("files", 10); // Allow up to 10 files to be uploaded in one booking
      
            upload(req, res, async function (err) {
              if (err instanceof multer.MulterError) {
                // A Multer error occurred when uploading
                logger.info(err);
                res.status(400).send({
                  responseCode: 400,
                  responseMessage: "Error uploading files",
                });
              } else if (err) {
                // An unknown error occurred when uploading
                logger.error(err);
                res.status(400).send({
                  responseCode: 400,
                  responseMessage: "Error uploading files",
                });
              }
      
              // Everything went fine
              logger.info("In the bookings.");
              const pro = await UserModel.findOne({_id:req.body.providerId}).exec();
              if(pro){
                logger.info("BOOKING:: Provider found.");
              }else{logger.error("BOOKING:: Error occured while retrieving provider. "); return;}
              const newRequest = await new PostRequestModel({
                username: req.body.username,
                requestTitle:  req.body.bookingTitle,
                requestDescription: req.body.bookingDescription,
                budget: req.body.bookingBudget,
                deadline: req.body.bookingDeadline,
                status: "booked",
                requestCategory: pro.category,
                files: req.files.map((file) => file.filename),
                createdAt: new Date(),
                lastUpdate: new Date(),
              }).save();
              if(newRequest){
                logger.info("BOOKING:: Job request saved successfully: "+ newRequest);
              }else{logger.error("BOOKING:: Error occured while saving jr into the db: "); return;};

              const newBooking = await new BookingModel({
                username: req.body.username,
                providerId: req.body.providerId,
                bookingTitle: req.body.bookingTitle,
                bookingDescription: req.body.bookingDescription,
                budget: req.body.bookingBudget,
                deadline: req.body.bookingDeadline,
                category: newRequest.requestCategory,
                jobId: newRequest._id,
                status: "active",
                createdAt: new Date(),
                lastUpdate: new Date(),
                files: req.files.map((file) => file.filename),
              }).save();
              if(newBooking){
                  const notification = await new NotificationModel({
                  causedByUserId: req.user._id,
                  causedByItem: newRequest._id,
                  receiverId: req.body.providerId,
                  icon: "fa-address-card",
                  title: "Your have been booked for a service.",
                  content: req.user.firstName+" "+req.user.lastName+" has booked you for the following service: "+req.body.bookingTitle+". Confirm the booking to start working on it.",
                  createdAt: new Date(),
                  lastUpdate: new Date()
                    }).save().then(success=>{
                      logger.info("BOOKING:: cancel booking notification- Notification sent to user.");
                  }).catch(err=>{
                    logger.error("BOOKING:: cancel booking notification - Error occured: "+err);
                  });
                  logger.info("Posted successfully!");
      
              }else{logger.error("Error occured while saving into the db: "+err);};
             
            });
          } catch (e) {
            logger.error(e);
            res.status(400).send({
              responseCode: 400,
              responseMessage: "Error posting service booking: "+e,
            });
          }
        } 
      },

      confirmBooking: async (req, res)=>{
          const booking = await BookingModel.findByIdAndUpdate(req.body.bookingId, {status:"in-progress", lastUpdate: new Date()}).exec();

          if(booking){
          const job = await PostRequestModel.findByIdAndUpdate(booking.jobId, {status: "in-progress", lastUpdate: new Date()}).exec();
          logger.info("BOOKING:: booking has been successfully confirmed");
          const customer = await UserModel.findOne({username: booking.username}).exec();
          const notification = await new NotificationModel({
            causedByUserId: req.user._id,
            causedByItem: job._id,
            icon: "fa-address-card",
            receiverId: customer._id,
            title: "Your booking has been confirmed.",
            content: "Servive provider "+req.user.firstName+" "+req.user.lastName+" has confirmed your service booking. Your service request is in progress.",
            createdAt: new Date(),
            lastUpdate: new Date()
              }).save().then(success=>{
                logger.info("BOOKING:: cancel booking notification- Notification sent to user.");
            }).catch(err=>{
              logger.error("BOOKING:: cancel booking notification - Error occured: "+err);
            });
          res.status(200).send({status: 200, message: "Ok"});
          return;
        }else{
          logger.error("BOOKING:: Error occured. Could not find booking.");
          res.status(401).send({status: 401, message: "Error"});
          return;
        }

        return;
      },

      cancelBookingByPro: async (req, res)=>{
        const booking = await BookingModel.findByIdAndUpdate(req.body.bookingId, {status:"cancelled", lastUpdate: new Date()}).exec();
        if(booking){
          const job = await PostRequestModel.findByIdAndUpdate(booking.jobId, {status: "active", lastUpdate: new Date()}).exec();
          logger.info("BOOKING:: booking has been successfully cancelled");
          const customer = await UserModel.findOne({username: booking.username}).exec();
          const notification = await new NotificationModel({
              causedByUserId: req.user._id,
              causedByItem: job._id,
              receiverId: customer._id,
              icon: "fa-address-card",
              title: "Your booking has been cancelled.",
              content: "Servive provider "+req.user.firstName+" "+req.user.lastName+" has cancelled your service booking. Your request has been listed for other providers to apply.",
              createdAt: new Date(),
              lastUpdate: new Date()
                }).save().then(success=>{
                  logger.info("BOOKING:: cancel booking notification- Notification sent to user.");
              }).catch(err=>{
                logger.error("BOOKING:: cancel booking notification - Error occured: "+err);
              });

          res.status(200).send({status: 200, message: "Ok"});
          return;
        }else {
          logger.error("BOOKING:: Error occured. Could not find booking.");
          res.status(401).send({status: 401, message: "Error"});
          return;
        };

        return;
      },

      cancelBookingByUser: async (req, res)=>{
        const booking = await BookingModel.findByIdAndUpdate(req.body.bookingId, {status:"cancelled", lastUpdate: new Date()}).exec();
        if(booking){
          const job = await PostRequestModel.findByIdAndUpdate(booking.jobId, {status: "active", lastUpdate: new Date()}).exec();
          logger.info("BOOKING:: booking has been successfully cancelled");
          const notification = await new NotificationModel({
              causedByUserId: req.user._id,
              causedByItem: job._id,
              receiverId: booking.providerId,
              icon: "fa-tasks",
              title: "Your booking has been cancelled.",
              content: req.user.firstName+" "+req.user.lastName+" has cancelled your service booking. The service request has been made available for other providers to apply.",
              createdAt: new Date(),
              lastUpdate: new Date()
                }).save().then(success=>{
                  logger.info("BOOKING:: cancel booking notification- Notification sent to user.");
              }).catch(err=>{
                logger.error("BOOKING:: cancel booking notification - Error occured: "+err);
              });

          res.status(200).send({status: 200, message: "Ok"});
          return;
        }else {
          logger.error("BOOKING:: Error occured. Could not find booking.");
          res.status(401).send({status: 401, message: "Error"});
          return;
        };

        return;
      },

      completeBooking: async (req, res)=>{
        logger.info("BOOKING:: Booking mf ID: "+req.body.bookingId);
        const booking = await BookingModel.findById(req.body.bookingId).exec();
        if(booking){
            const job = await PostRequestModel.findById(booking.jobId).exec();
            // If provider submitted completion files to customer
            try{
              const multer = require("multer");
              const fs = require("fs");
              let file_ = "";
              if(req.body.file || req.file){
                  const storage = multer.diskStorage({
                    destination: function (req, file, cb) {
                      const dir = "./postAttachments";
                      if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir);
                      }
                      cb(null, dir); 
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
                      fileSize: 1024 * 1024 * 500, // Limit the file size to 500MB
                    },
                    fileFilter: function (req, file, cb) {
                      cb(null, true); // Allow any type of file
                    },
                  }).array("files", 10); 
                  upload(req, res, async function (err) {
                    if (err instanceof multer.MulterError) {
                      logger.error(err);
                      res.status(400).send({ responseCode: 400, responseMessage: "Error uploading files",
                      });
                    } else if (err) {
                      logger.error(err);
                      res.status(400).send({  responseCode: 400, responseMessage: "Error uploading files",
                      });
                    }
                  });
                  logger.info("MF Files: "+req.body.file.name); // Contains information about the uploaded files
                  file_ = req.body.file.name;
                }

                job.status = "completed";
                job.lastUpdate = new Date();
                await job.save();

                booking.status = "completed";
                booking.lastUpdate = new Date();
                booking.providerFiles = file_;
                await booking.save();

                const user = await UserModel.findOne({username: booking.username}).exec();
                const notification = await new NotificationModel({
                  causedByUserId: req.user._id,
                  causedByItem: job._id,
                  receiverId: user._id,
                  title: "Your booking has been completed.",
                  icon: "fa-tasks",
                  content: req.user.firstName+" "+req.user.lastName+" has completed your service booking \'"+booking.bookingTitle
                          +"\'. Review the submission and evaluate the service provider accordingly.",
                  createdAt: new Date(),
                  providerComments: req.body.providerComments,
                  lastUpdate: new Date()
                    }).save().then(success=>{
                      logger.info("BOOKING:: booking completeion notification- Notification sent to user.");
                  }).catch(err=>{
                    logger.error("BOOKING:: booking completion notification - Error occured: "+err);
                  });
                  logger.info("BOOKING:: booking has been successfully completed");
                  res.status(200).send({status: 200, message: "Ok"});
                  return;
              }catch(err){ 
                logger.error("BOOKING:: Error occured while uploading submitted file: "+err);
                res.status(401).send({status: 401, message: "Error"});
                return;
          }
        }else {
          logger.error("BOOKING:: Error occured. Could not find booking.");
          res.status(401).send({status: 401, message: "Error"});
          return;
        };
        return;

      }

}

module.exports = BookingService;
