/*********************************************************************************************************
*	notification.js : Handles notifications events.
*   Author: Constant Pagoui.
*	Date: 04-14-2023
*	Copyright: MosalaPro TM
*
**********************************************************************************************************/

const BookingModel = require("../models/booking");
const NotificationModel = require("../models/notification");
const PostRequestModel = require("../models/postRequest");
const PostRequestService = require("../services/postrequest");
const UserModel = require("../models/user");


class Notification {

    async notifyBookingQuotation(req, res){

        const job = await BookingModel.findById(req.body.jobId).exec();
        
        if(job){
            const endUser = await UserModel.findOne({username: job.username}).exec();
            const notification = await new NotificationModel({
                causedByUserId: req.user._id,
                causedByItem: job.jobId,
                receiverId: endUser._id,
                icon:"fa-money",
                title: "Service Provider has provided a quotation for your booking.",
                content: "Servive provider "+req.user.firstName+" "+req.user.lastName+" has sent you a  quotation for your booking. Check service provider's required budget.",
                createdAt: new Date(),
                lastUpdate: new Date()
            }).save().then(success=> {
                    console.log("NOTIFICATION:: Notification has been successfuly saved"); 
                
                }).catch(err=> {console.log("NOTIFICATION:: Error occured while creating notification.")});
            return;
        }
        
    }
    async readNotification(req, res){

        const notif = await NotificationModel.findByIdAndUpdate(req.body._id, {status: "read", lastUpdate: new Date()}).exec();
        if(notif){
            res.status(200).send({message:"Notification read with success.", status: 200});
            return true;
        }
        else {
            res.status(401).send({message:"Notification reading failed.", status: 401});
            return false;
        }
    }
    async deleteNotification(req, res){
        const notif = await NotificationModel.findByIdAndUpdate(req.body._id, {status: "archived", lastUpdate: new Date()}).exec();
        if(notif){
            res.status(200).send({message:"NOTIFICATION:: Notification removed with success.", status: 200});
            return true;
        }
        else {
            res.status(401).send({message:"NOTIFICATION:: Notification removing failed.", status: 401});
            return false;
        }
    }
    async getNotificationList(){

    }

    async sendBookingsDeadlineReminders(){
        const bookingsWithCloseDeadlines = await  PostRequestService.checkBookingsDeadline();
        
        if(bookingsWithCloseDeadlines){
            for(let i = 0; i < bookingsWithCloseDeadlines.length; i++){
                const endUser = await UserModel.findOne({username: bookingsWithCloseDeadlines[i].username}).exec();
                const pro = await UserModel.findById(bookingsWithCloseDeadlines[i].providerId).exec();
                let notifContent = "";
                if(bookingsWithCloseDeadlines[i].status == "active"){
                    notifContent= "The deadline for booking request \'"+bookingsWithCloseDeadlines[i].bookingTitle+"\' is on "+
                                    bookingsWithCloseDeadlines[i].deadline+". Please confirm "+endUser.firstName+
                                    "\'s booking to complete it on time.";
                }else{

                    notifContent= "The deadline for booking request \'"+bookingsWithCloseDeadlines[i].bookingTitle+"\' is on "+
                                bookingsWithCloseDeadlines[i].deadline+". Please complete the job and submit it on time.";
                }
                const notification = await new NotificationModel({
                    causedByUserId: endUser._id,
                    causedByItem: bookingsWithCloseDeadlines[i].jobId,
                    receiverId: pro._id,
                    title: "The deadline for your booking is coming up.",
                    content: notifContent,
                    icon: "fa-clock-o",
                    createdAt: new Date(),
                    lastUpdate: new Date()
                }).save().then(success=> {
                        console.log("NOTIFICATION:: Notification has been successfuly saved"); 
                    
                    }).catch(err=> {console.log("NOTIFICATION:: Error occured while creating notification.")});
            }
        }
        else{
            console.log("NOTIFICATION:: No booking with close deadlines were returned.")
        }
    }

    

}

module.exports = Notification;