/*********************************************************************************************************
*	message.js : Handles message exchange between user and provider.
*   Author: Constant Pagoui.
*	Date: 04-11-2023
*	Copyright: MosalaPro TM
*
**********************************************************************************************************/

const MessageModel = require("../models/message");
const NotificationModel = require("../models/notification");
const _ = require("lodash");
const mongoose = require("mongoose");
const UserModel = require("../models/user");
mongoose.set('strictQuery', false);


class Message {
    async sendMessage(req, res){
        logger.info("Req info: "+req.user._id+" - "+req.body.proId+" "+req.body.messageTitle+" - "+req.body.content);
        const newMessage = await new MessageModel({
            senderId: req.user._id,
            recipientId:  req.body.proId,
            title: req.body.messageTitle,
            content: req.body.content,
            createdAt: new Date()
        }).save(function (err) {
            if (err) {
                logger.error("MESSAGE:: Error occured while sending message: "+err);
                res.status(401).send({error:"Error occured while sending message"} );
                return;
            }else{
                const notification = new NotificationModel({
                    causedByUserId: req.user._id,
                    receiverId: req.body.proId,
                    icon: "fa-envelope",
                    title: "You have a new message.",
                    content: "A message from "+req.user.firstName+ " "+req.user.lastName+": "+
                                            req.body.messageTitle+ " "+  req.body.content,
                    createdAt: new Date(),
                    lastUpdate: new Date()
                }).save(async function (err) {
                    if (err) {logger.error("MESSAGE:: Error occured while creating notification.");}
                    else logger.info("MESSAGE:: Notification has been successfuly saved"); });

                logger.info("MESSAGE:: Message has been sent successfully.");
                res.status(200).send({message:"Message sent successfully!", status:200} );
                return;
            }
        });
        return;
    }

    async getMessages(req, res){

        const messages = await MessageModel.find().or([{senderId: req.user._id}, { recipientId: req.user._id }])
                    .sort({ createdAt: 'desc'})
                    .then(success => {
                        logger.info("MESSAGE:: Message successfully retrieved!");
                    }).catch(err=>{
                        logger.error("MESSAGE:: Error occured while retrieving messages: "+err);
                    });
        let firstCorrespondantId = ""; 
        let firstConvo = [];
        if(messages){
            firstCorrespondantId = messages[0].senderId == req.user._id ? messages[0].recipientId : messages[0].senderId;

            firstConvo = MessageModel.find().and({ $or: [{senderId: req.user._id}, { recipientId: req.user._id }] } ,
                    {$or: [{senderId: firstCorrespondantId}, { recipientId: firstCorrespondantId }] })
                    .sort({ createdAt: 'desc'})
                    .then(success => {
                        logger.info("MESSAGE:: First convo successfully retrieved!");
                    }).catch(err=>{
                        logger.error("MESSAGE:: Error occured while retrieving first convo: "+err);
                    });
        }
        return firstConvo;

    }

    async getMessageWithUser(req, userId){

        const otherUser = await UserModel.findById(userId).exec();
        if(otherUser){
            logger.info("Getting messages with user: "+otherUser.username);
            otherUser.username = " ";
            otherUser.address = " ";
            otherUser.role = " ";
            otherUser.email = " ";
            otherUser.phone = " ";
        
            const messages_ = await MessageModel.find().and({ $or: [{senderId: req.user._id}, { recipientId: req.user._id }] } ,
                        {$or: [{senderId: userId}, { recipientId: userId }] }).exec();
                        // .then(success => {
                        //     console.log("MESSAGE:: Convo successfully retrieved!");
                        // }).catch(err=>{
                        //     console.log("MESSAGE:: Error occured while retrieving convo: "+err);
                        // });
            return messages_;
        }else
            return [];

    }

    async getCorrespondants(req, res){

        let correspondants = [];
        let unikIds = [];

        const messages = await MessageModel.find().or([{senderId: req.user._id}, { recipientId: req.user._id }]);

        if(messages){
            //console.log("MESSAGE:: retrieving correspondants for messages: "+messages);
            for(let i = 0; i < messages.length; i++){
                const correspondantId = messages[i].senderId == req.user._id ? messages[i].recipientId : messages[i].senderId;
                const correspondant = await UserModel.findById(correspondantId).exec();
                if(correspondant){
                    correspondant.accountType = " ";
                    correspondant.address = " ";
                    correspondant.role = " ";
                    correspondant.email = " ";
                    correspondant.phone = " ";
                    if(!unikIds.includes(correspondantId)){
                        correspondants.push(correspondant);
                        unikIds.push(correspondantId);
                    }
                }
            }
        }

        return correspondants;

    }

}

module.exports = Message;