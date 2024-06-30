/*********************************************************************************************************
*	Schemas.js : schemas handler for main instances and collections.
*   Author: Constant Pagoui.
*	Date: 03-01-2023
*	Copyright: MosalaPro TM
*
**********************************************************************************************************/

const mongoose = require("mongoose");

// Schemas

// Category
const categorySchema = new mongoose.Schema({
    name:{
        type: String,
        min:3
    },
    description:{
        type: String,
        required: true,
        min: 3,
        max: 45
    },
    icon:{
        type: String
    },
    createdAt:{
        type: Date,
        required: true
    },
    lastUpdate:{
        type: Date,
        required: true
    },

});

categorySchema.plugin(require("passport-local-mongoose"));
categorySchema.plugin(require("mongoose-findorcreate"));

// Country
const countrySchema = new mongoose.Schema({
    name:{
        type: String,
        min:3
    },
    phone_code: String,
    currency_name: String,
    currency_symbol: String,
    capital: String, 
    region: String,
    subregion: String,
    latitude: Number,
    longitude: Number,

});
countrySchema.plugin(require("passport-local-mongoose"));
countrySchema.plugin(require("mongoose-findorcreate"));

//City
const citySchema = new mongoose.Schema({
    name:{
        type: String,
        min:3
    },
    country: String,
    latitude: Number,
    longitude: Number,

});
citySchema.plugin(require("passport-local-mongoose"));
citySchema.plugin(require("mongoose-findorcreate"));

//State
const stateSchema = new mongoose.Schema({
    name:{
        type: String,
        unique: true,
        min:3
    },
    state_code:{
        type: String,
        required: true
    },
    country: String,
    latitude: Number,
    longitude: Number,

});
stateSchema.plugin(require("passport-local-mongoose"));
stateSchema.plugin(require("mongoose-findorcreate"));

// Location
const locationSchema = new mongoose.Schema({
    country:{
        type: String,
        required: true
    },
    city:{
        type: String,
        required: true
    }
});
locationSchema.plugin(require("passport-local-mongoose"));
locationSchema.plugin(require("mongoose-findorcreate"));

//Token
const tokenSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    }
})

//User
const userSchema = new mongoose.Schema({
    firstName:{
        type: String,
        required: true,
        min: 3,
        max: 45
    },
    lastName:{
        type: String,
        min: 2,
        max: 45
    },
    email:{
        type: String,
    },
    username:String,
    phone:{
        type: String,
        min: 7,
        max: 15
    },
    verifiedContact:String,
    address:{
        type: String,
        required: false
    },
    country: String,
    city: String,
    createdAt:{
        type: Date,
        required: true
    },
    lastUpdate:{
        type: Date,
        required: true
    },
    active:{
        type: Boolean,
        default: false,
    },
    verified:{
        type: Boolean,
        default: false,
    },
    payments:{
        type: String,
        created_at: Date
    }
});
userSchema.plugin(require("passport-local-mongoose"));
userSchema.plugin(require("mongoose-findorcreate"));

//Provider
const providerSchema = new mongoose.Schema({
    companyName:String,
    categoryId:{   
        type:String,
        required: true
    },
    firstName:{
        type: String,
        required: true,
        min: 3,
        max: 45
    },
    lastName:{
        type: String,
        required: true,
        min: 2,
        max: 45
    },
    email:{
        type: String,
        required: true
    },
    phone:{
        type: String,
        required: true,
        min: 7,
        max: 15
    },
    verifiedContact:String,
    address:{
        type: String,
        required: false
    },
    country: String,
    city: String,
    createdAt:{
        type: Date,
        required: true
    },
    lastUpdate:{
        type: Date,
        required: true
    },
    active:{
        type: Boolean,
        default: false,
    },
    verified:{
        type: Boolean,
        default: false,
    },
    payments:{
        type: String,
        created_at: Date
    }
    
    });
providerSchema.plugin(require("passport-local-mongoose"));
providerSchema.plugin(require("mongoose-findorcreate"));

// Service Request
const postRequestSchema = new mongoose.Schema({
    username: { type: String, require:true },
    requestTitle:{
        type: String,
        required: true
    },
    requestDescription:{
        type: String,
        required: true
    },
    requestCategory:{
        type: String,
        required: true
    },
    budget: Number,
    deadline: String,
    createdAt:{
        type: Date,
        required: true
    },
    lastUpdate:{
        type: Date,
        required: true
    },

    files: [{
        type: String
    }]
});
postRequestSchema.plugin(require("mongoose-findorcreate"));

module.exports = {
    categorySchema,
    countrySchema,
    citySchema,
    stateSchema,
    locationSchema,
    tokenSchema,
    userSchema,
    providerSchema,
    postRequestSchema
}