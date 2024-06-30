/*********************************************************************************************************
*	App.js : gateway of the application, handles requirements, tools and resources that need to be used.
*   Author: Constant Pagoui.
*	Date: 03-01-2023
*	Copyright: MosalaPro TM
*
**********************************************************************************************************/

//------------------REQUIREMENTS & TOOLS ------------------------------//

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const hpp = require('hpp');
const ejs = require("ejs");
const mongoose = require("mongoose");
const UserModel = require(__dirname+"/models/user");
const compression = require("compression");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const MongoStore = require('connect-mongo');
const Notification = require(__dirname+"/services/notification");
const notifObj = new Notification();
const nodeCron = require('node-cron');
const log4js = require("log4js");
const logger = log4js.getLogger();
logger.level = "debug";



// const emailValidator = required("email-validator");

//------------------DATABASE CONNECTION ------------------------------//
dbConnected = false;
const connectDB = async(DBURI) => { 
	await mongoose.connect(DBURI, {
		useNewUrlParser:true,
		useUnifiedTopology: true,
		family:4
	}).then(success=>{
		dbConnected = true;
		logger.info("APP:: Successfully connected to the database.");
		// console.log("APP:: Successfully connected to the database.");
		return true;
	}).catch(err=>{
		logger.debug("APP:: Error occured while connecting to the database. "+err);
		// console.log("APP:: Error occured while connecting to the database.\n"+err);
		return false;
	});
};

//------------------GENERAL CONFIGURATION ------------------------------//


const GoogleStrategy = require("passport-google-oauth2").Strategy;
const FacebookStrategy = require("passport-facebook");

const app = express();

mongoose.set('strictQuery', false);

app.use(express.static("public"));
app.use(express.json());
app.use(compression());
//app.use(hpp());
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use("/photo", express.static("uploads"));
app.use("/files", express.static("postAttachements"));

app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false,
	cookie: {
		maxAge: 1000 * 3600 * 24 * 365
	},
	store: MongoStore.create({
		mongoUrl: process.env.DBURI,
		autoRemove: 'interval',
		autoRemoveInterval: 10, // In minutes. Default
		crypto: {
			secret: process.env.SESSION_SECRET,
		  },
		
	  })
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(UserModel.authenticate()));

passport.serializeUser(UserModel.serializeUser());
passport.deserializeUser(UserModel.deserializeUser());

passport.use(new GoogleStrategy ({
	clientID: process.env.CLIENT_ID,
	clientSecret: process.env.CLIENT_SECRET,
	callbackURL: process.env.GOOGLE_CALLBACK_URL,
	userProfileURL: process.env.GOOGLE_PROFILE_URL
},
	function(accessToken, refreshToken, profile, cb){
		console.log(profile);

		UserModel.findOne({google_id: profile.id}, function(err, existingUser){
			if(existingUser){
				return cb(err, existingUser);
			}else{
				var newUser = new UserModel({
					google_id : profile.id,
					photo : profile.photos[0].value,
					email : profile.emails[0].value,
					username: profile.emails[0].value,
					verified: true,
					display_name : profile.displayName,
					firstName: profile._json.given_name,
					lastName: profile._json.family_name,
					createdAt: new Date(),
					lastUpdate: new Date()
				}).save(function(err,newUser){
					if(err) {
						logger.error("GOOGLE AUTH:: Error occured: "+ err);
						// console.log("GOOGLE AUTH:: Error occured: "+ err);
					};
					return cb(err, newUser);
				});
			}
		});

	})

);

passport.use(new FacebookStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.APP_SECRET,
    callbackURL: process.env.FB_CALLBACK_URL
  },
  function(accessToken, refreshToken, profile, cb) {
	  console.log(profile);
	UserModel.findOne({facebook_id: profile.id}, function(err, existingUser){
		if(existingUser){
			return cb(err, existingUser);
		}else{
			var newUser = new UserModel({
				facebook_id : profile.id,
				photo : profile.photos[0].value,
				email : profile.email,
				verified: true,
				display_name : profile.displayName,
				username: profile.email,
				firstName: profile._json.first_name,
				lastName: profile._json.last_name,
				facebookProfileLink:  "https://www.facebook.com/profile.php?"+profile.id,
				createdAt: new Date(),
				lastUpdate: new Date()
			}).save(function(err,newUser){
				
				if(err) {
					logger.error("FB AUTH:: Error occured: "+ err);
					// console.log("FB AUTH:: Error occured: "+ err);
				};
				return cb(err, newUser);
			});
		}
	});
   
  }
));


app.get("/auth/google",
	passport.authenticate("google", {scope: [ 'email', 'profile' ]}));

app.get("/auth/google/mosalapro", 
	passport.authenticate("google", {
		successRedirect: '/profile',
		failureRedirect: "/"}));
		
	
app.get("/auth/facebook",
  passport.authenticate("facebook", {scope: ['email', 'public_profile']}));

app.get('/auth/facebook/mosalapro',
  passport.authenticate('facebook', { failureRedirect: '/' }),
  function(req, res) {
    // Successful authentication, redirect home.
	logger.info("FB Authentication successful!");
	//console.log("successful FB");
    res.redirect('/profile');
});

// check job deadline and send reminder to service providers
const jobDeadlineReminder = nodeCron.schedule("59 59 0 * * *", async() =>{
	await notifObj.sendBookingsDeadlineReminders();
});
jobDeadlineReminder.start();

require('./api-routes/routes')(app);


//------------------STARTING UP SERVER------------------------------//

const start = async () => {
    try {
        await connectDB(process.env.DBURI).then(async function (success) {
			app.listen(process.env.PORT || 3000, function() {
				logger.info("APP:: Server successfully started online or locally on port 3000");
				//console.log("APP:: Server successfully started online or locally on port 3000");
			});
		}).catch(function (error) {console.log("APP:: Error"+error);});
		
	}catch(error) {
		logger.fatal("APP:: Error occured while connecting to the DB: "+error);
		//console.log("APP:: Error occured while connecting to the DB: "+error);
	}
};

start();

