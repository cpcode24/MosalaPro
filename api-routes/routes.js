
/*********************************************************************************************************
*	Routes.js : Handles web app routing and url requests.
*   Author: Constant Pagoui.
*	Date: 03-22-2023
*	Copyright: MosalaPro TM
*
**********************************************************************************************************/

const CategoryModel = require("../models/category");
const CountryModel = require("../models/country");
const NotificationModel = require("../models/notification");
const Notification = require("../services/notification");
const Message = require("../services/message");
const messageHander = new Message();
const JobApplication = require("../services/jobApplication");
const jobApplicationHander = new JobApplication();
const UserService = require("../services/user");
const PostRequestModel = require("../models/postRequest");
const BookingModel = require("../models/booking");
const PostRequestService = require("../services/postrequest");
const stripe = require('stripe')(process.env.STRIPE_SEC_KEY);
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const _ = require("lodash");
const link = null;

const notificationObj = new Notification();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: function (req, file, callback) {
    crypto.randomBytes(16, function (err, buf) {
      if (err) return callback(err);
      const randomString = buf.toString("hex");
      const extension = path.extname(file.originalname);
      const filename = randomString + extension;
      callback(null, filename);
    });
  },
});

const upload = multer({ storage: storage });

categories = [];
const fs = require('fs');
const JobApplicationModel = require("../models/jobApplication");
const BookingService = require("../services/booking");
const QuotationService = require("../services/quotation");
const QuotationServiceObj = new QuotationService();
const NotificationObj = new Notification();
const UserModel = require("../models/user");
const e = require("express");

fs.readFile('./public/data/categories.json', 'utf8', (err, data) => {
  if (err) {
    logger.error('APP:: Error reading file from disk: '+err)
  } else {
    // parse JSON string to JSON object
    const cates = JSON.parse(data)

    // print all databases
    cates.forEach(kat => {
      //console.log(`${kat.name}: ${kat.icon}`);
      categories.push(kat);
    })
  }
});


countries = [];
fs.readFile('./public/data/countries.json', 'utf8', (err, data) => {
    if (err) {
      logger.error('APP:: Error reading file from disk: '+err)
    } else {
      // parse JSON string to JSON object
      const kountries = JSON.parse(data)
  
      // print all countries
      kountries.forEach(ctry => {
        countries.push(ctry);
      })
    }
  });

module.exports = function(app){
    require("dotenv").config();
    const root = require('path').resolve('./');
    
app.get("/", async function(req, res){

        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
            if(req.user.accountType=="provider"){
                const pRequests = await PostRequestModel.find({providerId:req.user._id}).exec();
                const ja = await jobApplicationHander.getAppliedJobs(req, res);
                res.render("providerDashboard", {usr: req.user, notifications: notifs, cats: categories, ja:ja, countries: countries, postRequests: pRequests.reverse()});
            }
            else  {
                const pRequests = await UserService.getUserRequests(req, res);
                const favPros = req.user.favoriteProviders;
                const requestProviders = await UserService.getProviders();
                let favProviders = [];
                if(favPros.length > 0){
                    for(let i = 0; i < favPros.length; i++){
                        const pro = await UserModel.findById(favPros[i]).exec();
                        favProviders.push(pro);
                    }
                }
                res.render("userDashboard", {usr: req.user, notifications: notifs.reverse(), 
                     favProviders: favProviders,
                     providers: requestProviders,
                     link: null, postRequests: pRequests.reverse(), 
                     cats: categories, 
                    countries: countries});
            }
        }
        else
            res.render("home", {usr: null, cats: categories, countries: countries });
    });

    app.get("/payment", async function(req, res) {
        res.render("payment");
    });
    

    app.get("/charge", async function(req, res) {
        res.send("charge");
    })

    app.post("/charge", async function(req, res) {
        if(req.isAuthenticated()) {
            const card = {
                number: req.body.cardNumber,
                exp_month: req.body.expiryMonth,
                exp_year: req.body.expiryYear,
                cvc: req.body.cvc
            };
            try{
                const token = await stripe.tokens.create({ card });

                let amount = 0;
                if(req.body.plan === "bronze") {
                    amount = 5000;
                } else if(req.body.plan === "gold") {
                    amount = 10000;
                } else if(req.body.plan === "platinum") {
                    amount = 25000;
                }
                stripe.charges.create({
                    amount,
                    currency: 'usd',
                    description: 'Subscription',
                    source: token.id,
                }, async function(err, charge) {
                    if (err) {
                        res.send('Payment failed');
                    } else {
                        await UserService.createSubscription(req.user._id, req.body.plan)
                        res.redirect('/');
                    }
                });
            }catch(err){
                logger.error("Card payment error: "+err);
                res.redirect('/');
            }

            
        } else {
            res.redirect('/');

        }
 
    })

    app.get("/notifications", async function(req, res){
        if (req.isAuthenticated()) {
            try{
                const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).exec();
                let loadNotifs_ = await NotificationModel.find({receiverId: req.user._id}).limit(4).exec();
                res.render("notifications", {
                usr: req.user,
                cats: categories,
                notifications: notifs.reverse(),
                countries: countries,
                loadNotifs: loadNotifs_.reverse(),
                link: null
                });
            }
            catch(error){
                logger.error("Error occured while loading notifications: "+error);
            }
          } else {
            res.redirect("/");
          }
    });
    app.post("/notifications", async function(req, res){
        if(req.isAuthenticated()){
            try{
                const notifs = await NotificationModel.find({receiverId: req.user._id, status:{$ne:"archived"}}).exec();
                let loadNotifs_ = await NotificationModel.find({receiverId: req.user._id,  status: req.body.status}).limit(req.body.lim).exec();
                ages_ = [];
                loadNotifs_.reverse().forEach(not =>{
                    ages_.push(Math.floor(Math.abs( new Date() - not.createdAt ) / (1000*3600*24)));
                });
                logger.info("Notifications loaded: "+notifs.length);
                res.status(200).send({message:"Ok", status:200, notifications:notifs.reverse(), loadNotifs: loadNotifs_, ages: ages_});
                return;
            }catch(error){
                logger.error("Error occured while loading notifications: "+error);
            }
        }else{
            res.redirect("/");
        }

    });

    app.get("/notification", async function(req, res){
        if(req.isAuthenticated()){
            try{
                if(req.user.accountType == "user") {
                    const postReqCompleted = await PostRequestModel.find({providerId: req.query?.p}).exec();
                    const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
                    const notifi = await NotificationModel.findOne({_id: req.query?.n});
                    const provider = await UserModel.findOne({_id: req.query?.p}).exec();
                    const job_ = await PostRequestModel.findOne({_id: notifi.causedByItem}).exec();
                    const checkBooking_ = await BookingModel.findOne({jobId: notifi.causedByItem}).exec();
                    logger.info("checkbooking: "+checkBooking_);
                    res.render("notificationDetails", {pro: provider, notifi: notifi, 
                        postRequestsCompleted: postReqCompleted.length,
                        job: job_, 
                        usr: req.user, notifications: notifs.reverse(), 
                        link: null, cats: categories, 
                        checkBooking: checkBooking_, 
                        countries: countries} );
                }
                else{

                }

            }catch(error){
                logger.error("Error occured while fetching notification: "+error);
            }
        }
        else{
            res.redirect("/");
        }
    });

    app.post("/read-notif", async function(req, res){

        if(req.isAuthenticated()){
            try{
                if(notificationObj.readNotification(req, res))
                    logger.info("Notification read with success!");
                else    
                    logger.error("Error occured while reading notification.");
            }catch(error){
                logger.error("Error occured while loading notifications: "+error);
            }
        }else{
            res.redirect("/");
        }

    });

    app.get("/applicant", async function(req, res){
        if(req.isAuthenticated()){
            try{
                const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
                const postReqCompleted = await PostRequestModel.find({providerId: req.query?.p}).exec();
                const provider = await UserModel.findById(req.query?.p).exec();
                const job_ = await PostRequestModel.findById(req.query?.j).exec();
                const checkBooking_ = await BookingModel.findOne({jobId: req.query?.j}).exec();
                res.render("applicantProfile", {pro: provider, 
                    job: job_, 
                    usr: req.user, notifications: notifs.reverse(),
                    postRequestsCompleted: postReqCompleted.length,
                    checkBooking: checkBooking_,
                    link: null, cats: categories, 
                    countries: countries} );

            }catch(error){logger.error("Error occured while loading notifications: "+error);
        }
        }else{
            res.redirect("/");
        }
    });

    app.get("/applications", async function(req, res){
        if(req.isAuthenticated() && req.user.accountType == "provider"){
            try{
                const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
                const allApplications = await jobApplicationHander.getAppliedJobs(req, res);
                let ja = [];
                allApplications.forEach(app=>{
                    if(app.appStatus == "applied");
                    ja.push(app);
                });
                
                res.render("manageJobApplications", {usr: req.user, notifications: notifs.reverse(), allApp: allApplications, ja: ja, link: null,  cats: categories});
                }catch(error){
                    logger.error("Error occured: "+error);
                    res.redirect("/");
                }
        }else{
            res.redirect("/")
        }
    });

    app.get("/get-applications", async function(req, res){
        if(req.isAuthenticated()){
            try{
                const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
                const allApplications = await jobApplicationHander.getAppliedJobs(req, res);
                let ja = [];
                if(req.query?.type == "all")
                    ja = allApplications
                else{
                    allApplications.forEach(app=>{
                        if(app.appStatus == req.query?.type)
                            ja.push(app);
                    });
                }
                res.send(ja);
            }catch(error) {
                logger.error("Error occured: "+error);
                res.redirect("/")
            };
        }else
            res.redirect("/");

    });

    app.post("/quotation", async function(req, res) {
        if(req.isAuthenticated()){
            try{
                await QuotationServiceObj.send(req, res);
            }
            catch(err){
                logger.error("Error occured: "+err);
            }
        }
    });

    app.post("/delete-notif", async function(req, res){
        if(req.isAuthenticated()){
            try{
                if(notificationObj.deleteNotification(req, res))
                    logger.info("Notification deleted with success!");
                else    
                    logger.error("Error occured while deleting notification.");
            }catch(error){
                logger.error("Error occured while loading notifications: "+error);
            }
        }
    });
    app.post("/hire-pro", async function(req, res) {
        if(req.isAuthenticated()){
            try{
                UserService.hireProvider(req, res);
            }
            catch(error){
                logger.error("Error occured hire-pro: "+error);
            }
        }else
            res.redirect("/");
    });
    app.post("/reject-pro", async function(req, res){
        if(req.isAuthenticated()){
            try{
                UserService.rejectApplication(req, res);
            }
            catch(error){
                logger.error("Error occured reject-pro: "+error);
            }
        }
    });

    app.get("/user", async function(req, res){
        logger.info(req.isAuthenticated());
        if (req.isAuthenticated()) {
            const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
            res.render("user", {
              usr: req.user,
              cats: categories,
              notifications: notifs.reverse(),
              countries: countries,
              link: null
            });
          } else {
            res.redirect("/");
        }
    });

    app.get("/user-edit", async function(req, res){
        if (req.isAuthenticated()) {
            const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
            res.render("userEdit", {
              usr: req.user,
              cats: categories,
              countries: countries,
              notifications: notifs.reverse(),
              link:null
            });
          } else {
            res.redirect("/");
          }
    });

    app.post("/user-edit", upload.single("photo"), async function (req, res) {
        if (req.isAuthenticated()) {
            const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
          if(req.file)
            req.body.photo = req.file.filename;
            req.body.accountType = "provider";
          if (UserService.update({ _id: req.user._id, ...req.body })) {
            res.redirect("/user");
          } else {
            res.redirect("/user-edit", { notifications: notifs.reverse(), link: null, cats: categories });
          }
        } else {
          res.redirect("/");
        }
      });

    app.post("/update-sr", async function(req, res){
        if(req.isAuthenticated()){
            //if(req.file)
            PostRequestService.updateServiceRequest(req, res);
        }
        else    
            res.redirect("/");
    })
    
    app.post("/register-user", async (req, res) => {
        UserService.register(req, res);
    });

    app.get("/register-user", function(req, res){
        res.render("emailVerification", {usr: null, link:null, cats: categories, userId: req.body.id,  form_action: "/verify-u-email", redirect_link:"/" });
    });

    app.get("/pass-recovery", function(req, res){
        res.render("passRecovery", {usr: null, link:null, cats: categories, userId: req.body.id, form_action: "/verify-u-email" });
    });
    app.post("/recover-pass", async (req, res) =>{
            UserService.sendVerificationCode(req, res);
    });
    app.get("/recover-pass/:userId", async (req, res) =>{
        const unverifiedUser = await UserModel.findById(req.params.userId).exec();
        let email = unverifiedUser.email.charAt(0);
        const atIndex = unverifiedUser.email.indexOf('@');
        for(let i = 0; i < atIndex; i++){
            email = email + "*";
        }
        email = email + unverifiedUser.email.substr(atIndex, unverifiedUser.email.length-1);
        req.params.redirect_link = "/change-pass";
        res.render("emailVerification", {usr: null, link:null, cats: categories, userId: req.params.userId, email: email, redirect_link:"/change-pass", link:"/change-pass" });
        
    });

    

    app.get("/service-requests", async function(req, res){
        
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
            const jobRequests = await PostRequestService.getActiveRequests(req, res);
            res.render("jobRequests", {notifications: notifs.reverse(), usr: req.user, jobs: jobRequests, link:null, cats: categories});
        }
        else{
            res.redirect("/");
        }
    });

    app.post("/login-u", function(req, res){
        UserService.login(req, res);
    });

    app.get("/professionals", async function(req, res){
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
            res.render("forProfessionals", {usr: req.user, notifications: notifs.reverse(), link: req.link, cats: categories, countries: countries});
        }
        else
            res.render("forProfessionals", {usr: null, link:null, cats: categories, countries: countries });
    });

    app.get("/find-services", async function(req, res){
        const result = await UserModel.find({accountType:"provider"}).exec();
        const pages = result.length > 10 ? (Math.floor(result.length / 10))+1 : 1; 
        logger.info("result length: "+result.length+" Pages: "+pages);  
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
            res.render("findprofessionals", {usr: req.user, notifications: notifs.reverse(), link: req.link, cats: categories, countries: countries, professionals: result, 
                pages:pages, total: result.length, base_domain: process.env.BASE_URL});
        }
        else
            res.render("findprofessionals", {usr: null, notifications: null, link:null, cats: categories, countries: countries, professionals: result, 
                pages:pages, total: result.length, base_domain: process.env.BASE_URL});
    });

    app.get("/term-of-use", async function(req, res){
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
            res.render("termsAndConditions", {usr: req.user, notifications: notifs.reverse(), link: req.link, cats: categories, countries: countries});
        }
        else
            res.render("termsAndConditions", {usr: null, notifications: null, link:null, cats: categories, countries: countries });
    });

    app.get("/do-not-sell", async function(req, res){
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
            res.render("doNotSell", {usr: req.user, notifications: notifs.reverse(), link: req.link, cats: categories, countries: countries});
        }
        else
            res.render("doNotSell", {usr: null, notifications: null, link:null, cats: categories, countries: countries });
    });

    app.get("/privacy-policy", async function(req, res){
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
            res.render("privacyPolicy", {usr: req.user, notifications: notifs.reverse(), link: req.link, cats: categories, countries: countries});
        }
        else
            res.render("privacyPolicy", {usr: null, notifications: null, link:null, cats: categories, countries: countries });
    })

    app.get("/about-us", async function(req, res){
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
            res.render("about_us", {usr: req.user, notifications: notifs.reverse(), link:null, cats: categories});
        }
        else
            res.render("about_us", {usr: null, notifications: null, link: null, cats: categories });
    });

    app.get("/contact-us", async function(req, res){
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
            res.render("contact", {usr: req.user, notifications: notifs.reverse(), link: null, cats: categories});
        }
        else
            res.render("contact", {usr: null,  notifications:null, link: null,  cats: categories });
    });

    app.get("/report-issue", async function(req, res){
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
            res.render("contact", {usr: req.user, notifications: notifs.reverse(), link: null, cats: categories});
        }
        else
            res.render("contact", {usr: null,  notifications:null, link: null,  cats: categories });
    });

    app.get("/myrequests", async function(req, res){
    if(req.isAuthenticated()){
        try{
            const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
            const allRequests = await PostRequestModel.find({username:req.user.username, status:"active"}).exec();
            const pRequests = await PostRequestModel.find({username:req.user.username, status:"active"}).limit(6).exec();
            if(pRequests){
                logger.info("Requests found: "+pRequests.length);
            }else{
                logger.info("No requests found with username: "+req.user.username);
            }
            res.render("manageUserRequests", {usr: req.user, notifications: notifs.reverse(), postRequests: pRequests, allRequests: allRequests, link: null,base_url:process.env.BASE_URL,  cats: categories});
        }catch(error) {res.redirect("/")};
    }
    else
        res.redirect("/");
    });

    app.get("/myrequests/:type", async function(req, res){
        let types = ["active", "completed", "in-progress", "all"];
        if(req.isAuthenticated() && types.includes(req.params.type)){
            try{
                const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
                const allRequests = req.params.type != "all"? await PostRequestModel.find({username:req.user.username, status:req.params.type}).exec(): 
                                                                await PostRequestModel.find({username:req.user.username}).exec();
                const pRequests =  req.params.type != "all"? await PostRequestModel.find({username:req.user.username, status:req.params.type}).limit(12).exec():
                                                                await PostRequestModel.find({username:req.user.username}).limit(12).exec();
                if(pRequests){
                    logger.info("Requests found: "+pRequests.length);
                }else{
                    logger.info("No requests found with username: "+req.user.username);
                }
                res.render("userRequests", {usr: req.user, notifications: notifs.reverse(), postRequests: pRequests, allRequests: allRequests, link: null,
                                            base_url:process.env.BASE_URL, projects_type:req.params.type, cats: categories});
            }catch(error) {res.redirect("/")};
        }
        else
            res.redirect("/");
        });

    app.get("/getbookings", async function(req, res){
        if(req.isAuthenticated()){
            try{
                logger.info("Pro: "+req.user._id);
                const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
                let pRequests = [];
                if(req.query?.type == "all")
                    pRequests = await BookingModel.find({providerId:req.user._id}).exec();
                else
                    pRequests =  await BookingModel.find({providerId:req.user._id, status:req.query?.type}).exec();

                if(pRequests){
                    logger.info("GetBookings found: "+pRequests.length);
                }else{
                    logger.info("No requests found with username: "+req.user.username);
                }
                logger.info("Bookings: "+pRequests.length);
                res.send(pRequests);
            }catch(error) {res.redirect("/")};
        }
        else
            res.redirect("/");
    });

    app.get("/getrequests", async function(req, res){
        if(req.isAuthenticated()){
            try{
                logger.info("User: "+req.user.username);
                const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
                let pRequests = [];
                let allRequests = [];
                if(req.query?.type == "all"){
                    pRequests = await PostRequestModel.find({username:req.user.username}).limit(req.query?.lim).exec();
                    allRequests = await PostRequestModel.find({username:req.user.username}).exec();
                }
                else{
                    pRequests = await PostRequestModel.find({username:req.user.username, status:req.query?.type}).limit(req.query?.lim).exec();
                    allRequests = await PostRequestModel.find({username:req.user.username, status:req.query?.type}).exec();
                }

                if(pRequests){
                    logger.info("Requests found: "+pRequests.length);
                }else{
                    logger.info("No requests found for user: "+req.user.username);
                }
                logger.info("Requests: "+pRequests.length);
                res.send(pRequests);
                
            }catch(error) {
                logger.info("Error occured: "+error);
                res.redirect("/")
            };
        }
        else
            res.redirect("/");
    });

    app.get("/manage-request", async function(req, res){
        if(req.isAuthenticated()){
            try{
                const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
                const req_ = await PostRequestModel.findById(req.query?.rq).exec();
                let inPros = [];
                if(req_.status == "in-progress" || req_.status == "booked"){
                    const booking = await BookingModel.findOne({jobId: req_._id}).exec();
                    const pro = await UserModel.findById(booking.providerId).exec();
                    inPros.push(pro);
                }
                res.render("manageRequest", {usr: req.user, notifications: notifs.reverse(), interestedPros: inPros, request: req_, link: null,  cats: categories});
            }catch(error){
                logger.info("Error occured: "+error);
                res.redirect("/myrequests");
            }
        }
        else
            res.redirect("/");
    });

    app.post("/resubmit-request", async function(req, res){
        if(req.isAuthenticated()){
            try{
                PostRequestService.resubmitRequest(req, res);
            }catch(error){  
                logger.info("An error occured (/resubmit-request): "+error);
            }
        }else
            res.redirect("/");
    });

    app.post("/cancel-request", async function(req, res){
        if(req.isAuthenticated()){
            try{
                PostRequestService.cancelRequest(req, res);
            }catch(error){  
                logger.info("An error occured (/cancel-request): "+error);
                //console.log("An error occured (/cancel-request): "+error);
            }
        }else
            res.redirect("/");
    });

    app.get("/mybookings", async function(req, res){
        if(req.isAuthenticated() &&  req.user.accountType == "provider"){
            const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
            const bookings = await BookingModel.find({providerId:req.user._id, status: "active"}).exec();
            if(bookings){
                //console.log("Bookings found: "+bookings.length);
                logger.info("Bookings found: "+bookings.length);
            }else{
                logger.warn("No requests found with username: "+req.user.username);
                //console.log("No requests found with username: "+req.user.username);
            }
            res.render("manageServiceRequests", {usr: req.user, notifications: notifs.reverse(), postRequests:bookings, link: null,  cats: categories});
            
        }
        else
            res.redirect("/");
        });

    app.post('/update-password', function(req, res){
        if(req.isAuthenticated())
            UserService.updatePassword(req, res);
        else
            res.redirect("/");
    });
    
    app.post('/change-password', async function(req, res){
        UserService.changePassword(req, res);
    });

    app.get("/change-pass/:userId", async function(req, res){
        try{
            if(req.params.userId != null)
                res.render("changePass.ejs", {usr: null, notifications: null, postRequests:null, link: null, cats: categories, userId: req.params.userId});
            else
                res.redirect("/");
            
        }catch(error){
            logger.error("ROUNTING: Error occured: "+error);
        }
        
    });

    app.post("/authenticate", async function(req, res){
        const unverifiedUser = await UserModel.findById(req.body.iddl).exec();
        let email = unverifiedUser.email.charAt(0);
        const atIndex = unverifiedUser.email.indexOf('@');
        for(let i = 0; i < atIndex; i++){
            email = email + "*";
        }
        email = email + unverifiedUser.email.substr(atIndex, unverifiedUser.email.length-1);
        res.render("emailVerification", {usr: null, email: email, notifications: null, cats: categories, userId: req.body.iddl, link: null, redirect_link:"/"});
    });
    app.get("/userdash", async function(req, res){
        
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
            logger.info(notifs);
            const pRequests = await PostRequestModel.find({username:req.user.username}).exec();
            res.render("userDashboard", {usr: req.user, notifications: notifs.reverse(), cats: categories, postRequests: pRequests, link: null});
        }
        else
        res.redirect("/");
    });
    app.get("/verified", function(req, res){
        res.render("emailVerified", {usr:null, cats: categories, link: null, redirect_link:"/", userId:null});
    });

    app.get("/logout", function(req, res, next ){
        req.logout(function(err){
            if(err){return next(err);}
            res.redirect("/");
        });
    });
    

    app.post("/verify-email", function(req, res){
        UserService.verifyEmail(req, res);
    });
    
    app.post("/verify-code", function(req, res){
        UserService.verifyCode(req, res);
    });
    app.post("/register-pro", function(req, res){
        UserService.register(req, res);
    });
    app.get("/register-pro", function(req, res){

        res.render("emailVerification", {usr: null, link:null,  notifications:null, cats: categories, email:email, userId: req.body.id, form_action: "verify-email", redirect_link:"/"});
    });
  
    app.get("/profile", async function(req, res){
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
            res.render("userProfile", {usr: req.user, notifications: notifs.reverse(), link:null, cats: categories, countries: countries});
        }else   res.redirect("/");
    });


    app.post("/profile", upload.single("photo"), async function(req, res){
        if(req.isAuthenticated()){
            if(req.file)
                req.body.photo = req.file.filename;
                req.body.accountType = "provider";
            if(UserService.updateUser({_id: req.user._id, ...req.body}))
                res.redirect("/profile");
            else
                logger.info("Update failed!");
            
        }else res.redirect("/");
        
    });

    app.post("/apply-for-sr", async function(req, res){
        jobApplicationHander.apply(req, res);
    });

    app.get("/booking", async function(req, res){
        if(req.isAuthenticated() && req.user.accountType == "provider" && req.query?.b != null ){
            try{
                const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
                const booking = await BookingModel.findOne({_id: req.query?.b}).exec();
                //const job_ = await PostRequestModel.findOne({_id: booking.jobId}).exec();
                const cust = await UserModel.findOne({username: booking.username}).exec();

                if(booking){
                    res.render("manageBooking", 
                    {usr: req.user, notifications: notifs.reverse(), 
                    link:null, cats: categories, 
                    countries: countries,
                    booking: booking,
                    job: booking,
                    customer: cust
                    });
                }
            }catch(error){
                logger.error("Error occured: "+error);
            }
        }else
            res.redirect("/");
    });

    app.post("/confirm-booking", async function(req, res){
        if(req.isAuthenticated()){
            try{
                BookingService.confirmBooking(req, res);
            }catch(error){
                logger.error("An error occured: "+error);
            }
        }
        else
            res.redirect("/");
    });
    
    app.post("/cancel-booking", async function(req, res){
        if(req.isAuthenticated() && req.user.accountType == "provider"){
            try{
                if(req.user.accountType == "provider")
                    BookingService.cancelBookingByPro(req, res);
                else
                    BookingService.cancelBookingByUser(req, res);
            }catch(error){
                logger.error("An error occured: "+error);
            }
        }else res.redirec("/");
    });

    app.post("/complete-booking", async function(req, res){
        if(req.isAuthenticated() && req.user.accountType == "provider"){
            try{
                BookingService.completeBooking(req, res);
            }catch(error){
                logger.error("An error occured: "+error);
            }
        }else res.redirec("/");
    });

    app.get("/p-profile", async function(req, res){
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
            res.render("userEdit", {usr: req.user, notifications: notifs.reverse(), link:null,  cats: categories, countries: countries});
        }else{res.redirect("/");}
    });

    app.get("/join-as-pro", async function(req, res){
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
            res.render("joinAsProProfile", {usr: req.user, notifications: notifs.reverse(), link:null,  cats: categories, countries: countries});
        }else{res.redirect("/");}
    });

    app.get('/pro-profile/:id/', async function (req, res) {
        let provider = await UserService.findUser(req, res);
        if( req.isAuthenticated() && provider){
            try{
                const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
                const favPros = req.user.favoriteProviders;
                let isFav = false;
                if(favPros != null && favPros.length > 0){
                    favPros.forEach(proId=>{
                        if(proId == provider._id)
                            isFav = true;
                    });
                }
                res.render("proProfile", {usr: req.user, notifications: notifs.reverse(), isFavorite: isFav, pro: provider, cats: categories, link:req.link});
            }catch(error){res.redirect("/");}
            
        }else
        res.render("proProfile", {usr: null, notifications: null, pro: provider, cats: categories, isFavorite: null, link:req.link});
   });

   app.post("/addfavpro", async function(req, res) {
        if( req.isAuthenticated()){
            try{
                await UserService.addFavPro(req, res);
            }
            catch(error){
                logger.error("An error occured(addfavpro): "+error);
            }
        }else   
            res.render("proProfile", {usr: null, notifications: null, pro: provider, cats: categories, link:req.link});

   });

   app.get('/service-request-booking/:id/', async function (req, res) {
    let provider = await UserService.findUser(req, res);
    if( req.isAuthenticated() && provider){
        const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
            res.render("bookPro", {usr: req.user, notifications: notifs.reverse(), pro: provider, cats: categories, link:req.link});
        
    }else
        res.redirect("/");
});
    
    app.post('/verify-p-email', function(req, res) {
        //model.verifyProviderEmail(req, res);
        UserService.verifyEmail(req, res);
    });
    
    app.get("/messages", async function(req, res){
        if( req.isAuthenticated()){
            try{
                const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
                const correspondants = await messageHander.getCorrespondants(req, res);
                let messages = [];
                let firstCorresp = null;
                if(correspondants.length > 0){
                    messages = await messageHander.getMessageWithUser(req, correspondants[0]._id);
                    firstCorresp = await UserModel.findById(correspondants[0]._id).exec();
                }
                res.render("messages", {usr: req.user, data: messages, correspondants: correspondants,
                    notifications: notifs.reverse(), firstCor: firstCorresp, cats: categories, link:null});
            }
            catch(err){
                logger.error("Error (routes): "+err);
            }
        }else
            res.redirect("/");
    });
    app.post("/messages", async function(req, res){
        if( req.isAuthenticated()){
            try{
                let messages = [];
                let firstCorresp = null;
                if(correspondants.length > 0){
                    messages = await messageHander.getMessageWithUser(req, req.body.userId);
                    firstCorresp = await UserModel.findById(req.body.userId).exec();
                }
                
                res.status(200).send({usr: req.user, data: messages, chatUser: firstCorresp , status: 200});
            }
            catch(err){
                res.status(401).send({status:401, message:"Error"});
                logger.error("Error (routes): "+err);
            }
        }else
            res.redirect("/");
    });

    app.post("/send-message", function(req, res){
        logger.info("About to send message..");
        messageHander.sendMessage(req, res);

    });

    app.get("/resendCode/:id", function(req, res){
        req.body.redirect_link = "/";
        UserService.resendCode(req, res);
    });

    app.post("/resendCode", async (req, res)=>{
        //req.body.redirect_link = "/pass-change";
        UserService.resendCode(req, res);
    });

    app.get("/resendCode/change-pass/:id", function(req, res){
        //model.resendCode(req, res);
        req.body.redirect_link = "/change-pass";
        UserService.resendCode(req, res);
    });

    app.get("/service-request", async function (req, res) {
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
            logger.info("Creating a service request..");
            res.render("serviceRequest",{usr: req.user, notifications: notifs.reverse(), link:null,  cats: categories});
        }else{
            logger.info("User not connecting, redirecting to home page..");
            res.redirect("/");
        }
    });

    app.post("/postServiceRequest",function(req,res){
        PostRequestService.postServiceRequest(req,res);
    });

    app.post("/submitBooking",function(req,res){
        BookingService.postBooking(req,res);
    });

    app.get("/find-professionals", async function (req, res) {
        const result = await UserService.find(req.query);
        res.send(result);
      });


    app.get("/find-services-md", async function(req, res){
        
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
            res.render("findProMd", {link:null, usr: req.user, notifications: notifs.reverse(), cats: categories});
        }
        else
            res.render("findProMd", {link:null, notifications: null, usr: null,  cats: categories });
    });

    app.get("/sr-details/:jobId", async function(req, res){
        if(req.isAuthenticated()){
            try{
            const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
            const sr = await PostRequestModel.findOne({_id: req.params.jobId}).exec();
            const owner_ = await UserModel.findOne({username: sr.username});
            res.render("jobRequestDetails", {job: sr, notifications: notifs.reverse(), owner: owner_, link:null, usr: req.user, cats: categories});
            }catch(error){
                res.redirect("/");
            }
        }
        else
            res.redirect("/");
    });
    app.get("/job-application/:jobId", async function(req, res){
        if(req.isAuthenticated()){
            try{
                const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
                const ja = await JobApplicationModel.findOne({jobId: req.params.jobId}).exec();
                const sr = await PostRequestModel.findOne({_id: req.params.jobId}).exec();
                const postedBy = await UserModel.findOne({username: sr.username}).exec();
                sr.createdAt = ja.createdAt;
                sr.appStatus = ja.status;
                res.render("jobApplicationDetails", {job: sr, notifications: notifs.reverse(), link:null, postedBy:postedBy, usr: req.user, cats: categories});
            }catch(error){
                res.redirect("/");
            }
           
        }
        else
            res.redirect("/");
    });

    app.post("/cancel-application", async function(req, res) {
        if(req.isAuthenticated()){
            try{
                jobApplicationHander.cancelApplication(req, res);
            }catch(error){
                logger.error("An error occured: "+error);
            }
        }
        else{
            res.redirect("/");
        }

    });

    app.get("/invoice", async function(req, res){
        if(req.isAuthenticated()){
            try{
                const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
                const job = await PostRequestModel.findOne({_id: req.query?.sr}).exec();
                const pro = await UserModel.findOne({_id: req.query?.p}).exec();
                res.render("invoice", {job: job, pro:pro, notifications: notifs.reverse(), link:null, usr: req.user, cats: categories});
            }catch(error){
                res.redirect("/");
            }
        }
        else
            res.redirect("/");
    });

    app.get('/files/:filename', function(req, res){
        const file = `postAttachments/${req.params.filename}`;
        res.download(file);
      });


    app.get('/:anything/', async function (req, res) {
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
            res.render("page_not_found", {usr: req.user, notifications: notifs.reverse(), cats: categories, link:req.link});
        }else
         res.render("page_not_found", {usr: null, notifications: null, cats: categories, link:null });
   });

    app.get('*', async function (req, res) {
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
            res.render("page_not_found", {usr: req.user, notifications: notifs.reverse(), cats: categories, link:req.link});
        }else
         res.render("page_not_found", {usr: null, notifications: null, cats: categories, link:null });
    });
    
    app.use(async function(req, res, next) {
        if(req.isAuthenticated()){
            const notifs = await NotificationModel.find({receiverId: req.user._id}).exec();
            res.render("page_not_found", {usr: req.user, notifications: notifs.reverse(), cats: categories, link:req.link});
        }else
         res.render("page_not_found", {usr: null, notifications: null,cats: categories, link:null });
    });
}


