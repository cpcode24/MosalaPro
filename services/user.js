/*********************************************************************************************************
*	User.js : Handles user operations and requests.
* Author: Constant Pagoui.
*	Date: 03-18-2023
*	Copyright: MosalaPro TM
*
**********************************************************************************************************/

const UserModel = require("../models/user");
const TokenModel = require("../models/token");
const CategoryModel = require("../models/category");
const NotificationModel = require("../models/notification");
const EmailSender = require("../services/emailsender");
const _ = require("lodash");
const mongoose = require("mongoose");
const sanitizer = require('sanitize')();
mongoose.set('strictQuery', false);
const passport = require("passport");
const CountryModel = require("../models/country");
const PostRequestModel = require("../models/postRequest");
const BookingModel = require("../models/booking");
const JobApplication = require("./jobApplication");
const JobApplicationModel = require("../models/jobApplication");
const userEmailSender = new EmailSender();

passport.use(UserModel.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  UserModel.findById(id, function(err, user) {
    done(err, user);
  });
});

// exports.sanitizeUser = function(user) {
//   return {
//     id: user._id,
//     username: user.username,
//     firstName: user.firstName,
//     lastName: user.lastName,
//     accountType: user.accountType,
//     category: user.category,
//     photo: user.photo,
//     role: user.role
//   };
// };

const UserService = {
  login: async (req, res) => {
    const user = new UserModel({
      username : _.trim(_.toLower(req.body.username)),
      password : req.body.password
    });
    req.login(user, function(err){
          if (err) {
              console.log("USER:: An error occured : ", err);
              res.status(400).send({ error: "Wrong username or password" });
              return;
          } else {
              passport.authenticate("local")(req, res, function(){
                  if(req.user.verified === true){
                      console.log("User has been successfully logged in");
                      res.status(200).send({message:"Ok", status:200});
                      //res.redirect("/");
                      return;
                  }else{
                      console.log("USER AUTH:: User has not been verified.");
                      res.status(402).send({message:"Your account has not been verified.", id:req.user._id, status: 402} );
                      req.logout(function(err){
                          if(err){return next(err);}
                      });
                      return;
                  }
                  
              });
          }
      });
      return;
  },
  register: async (req, res) => {
    let newUser = null;
    let password = "";
    let isPro = false;
    
    if(req.body.userType == "provider"){
      const category = await CategoryModel.findOne({name:req.body.pCategory}).exec();
      const countryCode = await CountryModel.findOne({name: req.body.country_p}).exec();
      newUser = await new UserModel({
        categoryId : category._id,
        category: category.name,
        firstName: _.trim(_.capitalize(req.body.pFirstName)),
        lastName: _.trim(_.capitalize(req.body.pLastName)),
        email: _.trim(_.toLower(req.body.pEmail)),
        phone: _.trim(req.body.pPhone), 
        address: _.trim(req.body.pAddress),
        username: _.trim(req.body.pEmail),
        countryCode: countryCode.phone_code,
        country: req.body.country_p,
        city: req.body.city_p,
        accountType: req.body.userType,
        createdAt: new Date(),
        lastUpdate: new Date()
      });
      isPro = true;
      password = req.body.pPassword;
    }
    else{
      const countryCode = await CountryModel.findOne({name: req.body.country}).exec();
      newUser = new UserModel({
        firstName: _.capitalize(req.body.firstName),
        lastName: _.capitalize(req.body.lastName),
        email: _.trim(req.body.email),
        phone: req.body.phone,
        address: req.body.address,
        username: _.toLower(req.body.email),
        accountType: req.body.userType,
        countryCode: countryCode.phone_code,
        verified: false,
        country: req.body.country,
        subscriptionPlan: "",
        city: req.body.city,
        createdAt: new Date(),
        lastUpdate: new Date()
      });
      password = req.body.password;
    }
    

    try{
      console.log("USER:: User email that always exists: "+newUser.email);
      let user = await UserModel.findOne({email: newUser.email}).exec();
      if(user){
          console.log("USER:: User already exists: "+user +" --");
          //return res.status(400).send("User with given email already exist!");
          const msg = "User with given email already exist!"; 
          res.status(300).send(msg);
          return;
          //res.render("register", {usr: newUser, cats: categories, msg: msg});
      }else{ 
          console.log("USER:: Email is solid, none found.");
          await UserModel.register(newUser, password, function(err, u){
          if (err) {
            console.log("USER:: User Registration error: "+err);
            res.status(409).send({error: err});
            return;
          } else {
              let tok = TokenModel.findOne({ userId: newUser._id }).exec();
              TokenModel.findByIdAndRemove(tok._id).exec();
              console.log("User has been successfully registered.");
              if(isPro){
                if(userEmailSender.sendProCode(6, newUser)){
                    //res.render("emailVerification", {usr: null, link:null, cats: categories, userId: newUser._id});
                    res.status(200).send({userId: newUser._id, status:200});
                    return;
                }else{
                    console.log("USER:: Could not send code!");
                    res.status(408).send({error: "USER:: Could not send code!"});
                    return;
                }
              }
              else{
                if(userEmailSender.sendCode(6, newUser)){
                    res.status(200).send({userId: newUser._id, status:200});
                      return;
                }else{
                    console.log("USER:: Could not send code!");
                    res.status(408).send({error: "USER:: Could not send code!"});
                    return;
                }
              }
          }
          });
          return;
          
      }
    }catch(error){
        res.status(400).send("USER:: An error occured : "+error);
        return;
    }
    return;
  
  },
  sendVerificationCode: async(req, res)=>{
    try{
      const user = await UserModel.findOne({email:req.body.email}).exec();
      
      if(user){
        if(userEmailSender.sendRecoveryCode(6, user)){
            //res.render("emailVerification", {usr: null, link:null, cats: categories, userId: newUser._id});
            res.status(200).send({userId: user._id, status:200});
            return;
        }else{
          console.log("USER:: User found but could not send code!");
          res.status(408).send("USER:: Could not send code!");
          return;
        }
      }
      else{
        console.log("USER:: Could not find user!");
        res.status(408).send({status:408, msg:"USER:: Could not find user!"});
        return;
      }
    }catch(error){
      console.log("USER:: (sendVerificationCode) An error occured : "+error);
      res.status(400).send("USER:: (sendVerificationCode) An error occured : "+error);
      return;
    }
  },
  resendCode: async(req, res)=>{
    try{
      let user = await UserModel.findOne({_id: req.body.id}).exec();
      if(user){
          console.log("USER:: User found, resending email..");
          let tok = await TokenModel.findOne({ userId: user._id }).exec();
          if(tok)
            await TokenModel.findByIdAndRemove(tok._id).exec();

          let email_ = user.email.charAt(0);
          const atIndex = user.email.indexOf('@');
          for(let i = 0; i < atIndex; i++){
              email_ = email_ + "*";
          }
          email_ = email_ + user.email.substr(atIndex, user.email.length-1);
          if(req.body.redirect_link == "/"){
            if(await userEmailSender.sendCode(6, user)){
              //res.render("emailVerification", {usr: null, link:null, cats: categories, email:email_, userId: user._id, redirect_link:req.body.redirect_link });
              res.status(200).send({userId: user._id, status:200});
              return;
            }else{
                console.log("USER:: Could not resend code!");
                res.status(408).send({status:408, msg:"USER:: Could not resend code!"});
                return;
            }
          }else{
            if(await userEmailSender.sendRecoveryCode(6, user)){
              //res.render("emailVerification", {usr: null, link:null, cats: categories, email:email_, userId: user._id, redirect_link:req.body.redirect_link });
              res.status(200).send({userId: user._id, status:200});
              return;
            }else{
                console.log("USER:: Could not resend code!");
                res.status(408).send({status:408, msg:"USER:: Could not resend code!"});
                return;
            }
          }
      }
      else{
          console.log("USER:: User not found, could not resend email.");
          //res.render("emailVerification", {usr: null, link:null, cats: categories, email: null, userId: req.params.id, redirect_link:req.body.redirect_link});
          res.status(402).send({status:402, msg:"USER:: Could not find user!"});
          return;
      }
      
    }catch(error){
        console.log("USER:: An error occured: "+ error);
        //res.status(400).send("USER:: An error occured : "+error);
        res.redirect("/");
        return;
    }
  },

  verifyEmail: async (req, res) => {
    try {
      const user = await UserModel.findOne({ _id: req.body.id }).exec();
      if (!user) return res.status(400).send("USER:: User : Invalid link. User id: "+req.body.id);
  
      const token = await TokenModel.findOne({ userId: user._id}).exec();

      if (!token) return res.status(400).send("USER:: Token : Invalid link");
      
      const codeEntered = ""+req.body.first + req.body.second + req.body.third + req.body.fourth + req.body.fifth + req.body.sixth;
      if(codeEntered == token.token){
          console.log("USER:: Code verification successful! logging in the user..")
          req.login(user, function(err){
              if (err) {
                  console.log("USER:: An error occured (Email Verification): "+err);
                  return res.status(400).send("An error occured (Email Verification)");
                  // TODO: activate error message on modal
              } else {
                      console.log("USER:: Email verification: User has been successfully logged in");
                      UserModel.updateOne({ _id: user._id}, {$set: {verified: true}} ).exec();
                      TokenModel.findByIdAndRemove(token._id).exec();
                      //res.redirect("/");
                      return res.status(200).send({msg:" Code verification successful!", status:200});
              }
          });
          return;
      }
      else{
          console.log("USER:: Email verification: Code entered does not match the one sent!");
          //res.redirect(req.get('referer'));
          return res.status(400).send("USER:: Email verification: Code entered does not match the one sent!");
          //res.render("emailVerification", {usr: null, cats: categories, userId: user._id});
      }
      
    } catch (error) {
      console.log("USER:: An error occured (Email verification): "+ error);
      return res.status(400).send("An error occured : "+error);
    }
  },

  verifyCode: async (req, res) => {
    try {
      const user = await UserModel.findOne({ _id: req.body.id }).exec();
      if (!user) return res.status(400).send("USER:: User : Invalid link. User id: "+req.body.id);
  
      const token = await TokenModel.findOne({ userId: user._id}).exec();

      if (!token) return res.status(400).send("USER:: Token : Invalid link");
      
      const codeEntered = ""+req.body.first + req.body.second + req.body.third + req.body.fourth + req.body.fifth + req.body.sixth;
      if(codeEntered == token.token){
          console.log("USER:: Code verification successful! logging in the user..")
          TokenModel.findByIdAndRemove(token._id).exec();
          return res.status(200).send({msg:" Code verification successful!", status:200});
      }
      else{
          return res.status(400).send("USER:: Email verification: Code entered does not match the one sent!");
          //res.render("emailVerification", {usr: null, cats: categories, userId: user._id});
      }
      
    } catch (error) {
      console.log("USER:: An error occured (Email verification): "+ error);
      return res.status(400).send("An error occured : "+error);
    }
  }, 

  find: async(query) => {
    const filters = {};
    if(query?.country_search && query?.country_search !== "Country")
      filters.country = query.country_search;
    
    if(query?.city_search && query?.city_search !== "Select City")
      filters.city = query.city_search;

    if(query?.search !== "")
      filters.role = new RegExp(query.search, "i");

    filters.accountType = "provider";
    //filters.verified = true;

    if(query?.category !== "" && query?.category !== "Select Category")
      filters.category = query.category;
    result = [];
    const res = await UserModel.find(filters);
    res.forEach(pro=>{
        pro.email = "";
        pro.phone = "";
        pro.address = "";
        pro.createdAt = "";
        pro.lastUpdate = "";
        pro.subscriptionPlan = "";
        pro.username = "";
        result.push(pro);
    });
    ret = result.slice((query.page-1)*10, (query.page-1)*10+10);
    return ret;
  },
  getProviders : async()=>{
    const providers = await UserModel.find({accountType:"provider"}).limit(8).exec();
    return providers;
  },
  update: async (data) => {
    data.lastUpdate = new Date();
    data.skills = data.skills.toString().split(",").filter(skill => skill !== '');
    const res = await UserModel.findByIdAndUpdate(data._id, data);
    if(!res)
      return false;
    return true;
  },
  createSubscription: async (_id, type) => {
    let period = 0;
    if(type === "bronze")
      period = 90;
    else if(type === "gold")
      period = 180;
    else if(type === "platinum")
      period = 365;
    
    const expire = new Date();
    expire.setDate(expire.getDate() + period);
    const subscription = {
      expire: expire.valueOf(),
      plan: type,
      lastUpdate: new Date()
    }
    const res = await UserModel.findByIdAndUpdate(_id, { subscription });
  },

  updateUser: async (userData) => {
    userData.lastUpdate = new Date();
    const result = await UserModel.findByIdAndUpdate(userData._id, userData);
    if(result)
      console.log("USER:: User updated");
    else
      console.log("USER:: Update failed");
  }, 
  updatePassword : async(req, res)=>{
      req.user.authenticate(req.body.accountPassword, function(err,model,passwordError){
        if(passwordError){
          console.log("USER:: Error occured while authenticating user: "+err);
          res.status(400).send('The given password is incorrect!!');
          return;
         } else if(model) {

          req.user.setPassword(req.body.newPassword, function(){
            req.user.lastUpdate = new Date();
            req.user.save();
            return res.status(200).send('Password has been updated successfully!');
            });
          } else {
            console.log('USER:: Incorrect password');
            return res.status(304).send("Inccorect password");
        }
    return;
    });
  },

  changePassword : async(req, res) =>{
    try{
      const user = await UserModel.findById(req.body.userId).exec();
      console.log("USER:: (changePassword) User successfully found! \n"+user);
      if(user){
          user.setPassword(req.body.newPassword,function(){
          user.lastUpdate = new Date();
          user.save();
          console.log("We're getting there!");
          res.status(200).send({message:"Ok", status:200});
          return;
          });
        } else {
          console.log('USER:: (changePassword) User not found. Password update failed.');
          res.status(304).send({message:"Password update failed", status:304}); 
          return;
      }
    }catch(error){
      console.log('USER:: (changePassword) Error occured while trying to update password.');
      res.status(304).send({message:"Error occured while trying to update password", status:304});
      return;
    }
    

  },

  findUser: async(req, res)=>{
    let user = await UserModel.findById(req.params.id).exec();
    if(user)
      return user;
    else{
      user = await UserModel.findOne({facebook_id: req.params.id}).exec();
      if(user)
        return user;
      else user = await UserModel.findOne({google_id: req.params.id}).exec();
        return user;
    }
    return;
  },

  hireProvider: async(req, res)=>{
    const job = await PostRequestModel.findOne({_id: req.body.jobId}).exec();

    newBooking = new BookingModel({
      username: req.user.username,
      bookingTitle: job.requestTitle,
      bookingDescription: job.requestDescription,
      providerId:  req.body.providerId,
      jobId: job._id,
      budget: job.budget,
      deadline: job.deadline,
      createdAt: new Date(),
      lastUpdate: new Date(),
      status: "active"
    }).save().then(success => {
      const notification = new NotificationModel({
        causedByUserId: req.user._id,
        causeByItem: req.body.jobId,
        receiverId: req.body.providerId,
        icon:"fa-check-square-o",
        title: "Congratulations! You have been hired.",
        content: req.user.firstName+" "+req.user.lastName+" has accepted your job application for the job '"+job.requestTitle+"'. Open to check to check job's details",
        createdAt: new Date(),
        lastUpdate: new Date()
      }).save().then(async scss=>{

          const j = await PostRequestModel.findByIdAndUpdate( req.body.jobId, {status:"in-progress", lastUpdate: new Date()}).exec();
          if(j) console.log("Job request status updated!"); else console.log("Job request status update failed");

          const jobApplication = await JobApplicationModel.findOneAndUpdate({jobId: req.body.jobId}, {status:"hired", lastUpdate: new Date()}).exec();
          if(jobApplication)
            console.log("Job application status updated!");
          else  
            console.log("Job application status update failed");

          res.status(200).send({message: "Provider has been hired and notification has been sent successfully", status: 200});
          console.log("USER:: Provider has been hired and notification has been sent successfully.");
          return;
      }).catch(err=>{
          res.status(401).send({message: "New notification failed. Error", status: 401});
          console.log("USER:: New notification failed. Error: "+err);
          return;
      }); 
    
    }).catch(error=>{
      res.status(401).send({message: "New booking creation failed.", status: 401});
      console.log("USER:: New booking creation failed. Error: "+error);
      return;
    });
    return;
  },

  rejectApplication: async(req, res)=>{

    const jobApplication = await JobApplicationModel.findOneAndUpdate({jobId: req.body.jobId}, {status:"rejected", lastUpdate: new Date()}).exec();
    if(jobApplication){
      const notification = new NotificationModel({
        causedByUserId: req.user._id,
        causeByItem: req.body.jobId,
        receiverId: req.body.providerId,
        icon: "fa-window-close-o",
        title: "Your job application has been rejected.",
        content: " Unfortunately, "+req.user.firstName+" "+req.user.lastName+" has decided to hire another provider for the job: '"+jobApplication.requestTitle+"'.",
        createdAt: new Date(),
        lastUpdate: new Date()
      }).save().then(async scss=>{
          res.status(200).send({message: "Provider application has been rejected and notification has been sent successfully", status: 200});
          console.log("USER:: Provider application has been rejected and notification has been sent successfully.");
          return;
      }).catch(err=>{
          res.status(401).send({message: "New notification failed. Error", status: 401});
          console.log("USER:: New notification failed. Error: "+err);
          return;
      }); 
      console.log("Job application status updated!");
    }
    else {
      res.status(401).send({message: "Job application status update failed.", status: 401});
      console.log("Job application status update failed");
      return;
    }

    return;
  },
  getUserRequests: async(req, res)=>{
    const pRequests = await PostRequestModel.find({username:req.user.username}).exec();
    let requests = [];
    if(pRequests){
      for(let i = 0; i < pRequests.length; i++){
        const booking = await BookingModel.findOne({jobId: pRequests[i]._id}).exec();
        if(booking){
          const prov = await UserModel.findById(booking.providerId);
          pRequests[i].pro = prov.firstName+" "+prov.lastName;
        }
        else
          pRequests[i].pro = " ";

        requests.push(pRequests[i]);
      }

    }
    return requests;
  },

  addFavPro: async(req, res)=>{
    const currentFavPros = await req.user.favoriteProviders;
    const pro = await UserModel.findById(req.body.proId).exec();
    if(pro){

      currentFavPros.push(req.body.proId);
      req.user.favoriteProviders = currentFavPros.reverse();
      req.user.lastUpdate = new Date();
      req.user.save().then(success=>{
        console.log("USER:: pro has been added as favorite.");
        res.status(200).send({message: "Ok", status:200});
        return;
      }).catch(err=>{
        console.log("USER:: An error occured while adding pro as favorite: "+err);
        res.status(401).send({message:"Internal Server Error", status:401});
        return;
      })
    }

  }
}
module.exports = UserService;
