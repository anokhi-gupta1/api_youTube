const express=require('express');
const mongoose = require('mongoose');
const bodyParser=require('body-parser')

const app = express();

require('dotenv').config();
const userRoute=require('./api/routes/user')
const videoRoute=require('./api/routes/Video')
const commentRoute=require('./api/routes/Comment')
const fileUpload=require("express-fileupload")
// Connect to MongoDB
const connectWithDatabase = async () => {   
    try{
        const res=await mongoose.connect(process.env.MONGO_URI )
        console.log('MongoDB connected');
    }
    catch(err){
        console.log(err)
    }     
}       
connectWithDatabase();
app.use(bodyParser.json())
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/'
}))
app.use("/Video",videoRoute)
app.use("/user",userRoute)
app.use("/comment",commentRoute)
module.exports = app;
