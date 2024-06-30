/*********************************************************************************************************
*	emailsender.js : Handles email notifications sent to the user.
* Author: Constant Pagoui.
*	Date: 03-19-2023
*	Copyright: MosalaPro TM
*
**********************************************************************************************************/
const UserModel = require("../models/user");
const TokenModel = require("../models/token");
const CategoryModel = require("../models/category");
const passport = require("passport");

class EmailSender {

    async sendEmail(name, email, subject, message) {
        const axios = require("axios");
        const data = JSON.stringify({
            "Messages": [{
            "From": {"Email": process.env.EMAIL_SENDER, "Name": "MosalaPro"},
            "To": [{"Email": email, "Name": name}],
            "Subject": subject,
            "TextPart": message
            }]
        });
    
        const config = {
            method: 'post',
            url: 'https://api.mailjet.com/v3.1/send',
            data: data,
            headers: {'Content-Type': 'application/json'},
            auth: {username: process.env.MAILJET_API_KEY, password: process.env.MAILJET_API_SECRET},
        };
        
        return axios(config)
            .then(function (response) {
                logger.info(JSON.stringify(response.data));
            }).catch(function (error) {logger.error(error);});
    }
    
    async generateRandomString(strLength){
        const chars =
          "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz1234567890";
        const randomArray = Array.from(
          { length: strLength },
          (v, k) => chars[Math.floor(Math.random() * chars.length)]
        );
      
        const randomString = randomArray.join("");
        return randomString;
      }
    
      async generateRandomDigit(codeLength){
        const chars =
          "1234567890";
        const randomArray = Array.from(
          { length: codeLength},
          (v, k) => chars[Math.floor(Math.random() * chars.length)]
        );
        const code = randomArray.join("");
        return code;
      }
    
    async sendCode(codeLength, user){
        const chars =
        "1234567890";
      const randomArray = Array.from(
        { length: codeLength},
        (v, k) => chars[Math.floor(Math.random() * chars.length)]
      );
        const randomDigit =  randomArray.join("");

        let token = await new TokenModel({
            userId: user._id,
            token: randomDigit,
        }).save();

        const name = user.firstName;
        const email = user.email;
        const subject = "Verify Your MosalaPro Account";
        const message = "Hi "+name+",\n\nThank you for signing up with MosalaPro. We appreciate your business."+
            "\nPlease use the code below to verify your MosalaPro Account:\n\n"
            +randomDigit +"\n\nThank you,\nMosalaPro TM";
            
        logger.info("EMAIL_SENDER:: Email sent to user");
        if(this.sendEmail(name, email, subject, message))
            return true;
        else
            return false;
        
      }

      async sendProCode(codeLength, provider) {
        
        const chars =
          "1234567890";
        const randomArray = Array.from(
          { length: codeLength},
          (v, k) => chars[Math.floor(Math.random() * chars.length)]
        );
        const randomDigit =  randomArray.join("");

        const name = provider.firstName; 
        const email = provider.email;
            //const link = `${process.env.BASE_URL}/user/verify/${newUser._id}/${token.token}`;
            
        const subject = "Verify Your MosalaPro Account";
        const message = "Hi "+name+",\n\nThank you for signing up with MosalaPro as a service provider. We appreciate your business."+
            "\nPlease use the code below to verify your MosalaPro Account:\n\n"
            +randomDigit +"\n\nThank you,\nMosalaPro TM";
            
        logger.info("EMAIL_SENDER:: An Email sent to your account please verify");
            
        if(this.sendEmail(name, email, subject, message))
            return true;
        else
            return false;
        
    }

    async sendRecoveryCode(codeLength, user){
      const chars =
        "1234567890";
        const randomArray = Array.from(
          { length: codeLength},
          (v, k) => chars[Math.floor(Math.random() * chars.length)]
        );
        const randomDigit =  randomArray.join("");

        let token = await new TokenModel({
            userId: user._id,
            token: randomDigit,
        }).save();

        const name = user.firstName;
        const email = user.email;
        const subject = "Your MosalaPro Account Recovery Code";
        const message = "Hi "+name+",\n\nWe received a request to reset your MosalaPro password."+
            "\nPlease enter the following password reset code to change your password:\n\n"
            +randomDigit +"\n\nThank you,\nMosalaPro TM";
            
        logger.info("EMAIL_SENDER:: An Email sent to your account please verify");
        if(this.sendEmail(name, email, subject, message))
            return true;
        else
            return false; 
    }
}



module.exports = EmailSender;