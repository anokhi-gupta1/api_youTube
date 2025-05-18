const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require('../models/User');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const checkAuth = require('../middleware/checkAuth');
// const { use } = require('react');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Cloudinary configuration
cloudinary.config({
    cloud_name: 'dcmaxwnox',
    api_key: '722487791946348',
    api_secret: process.env.Api_secret
});

// ✅ SIGNUP ROUTE
router.post("/signup", async (req, res) => {
    try {
        // Check if email is already registered
        const existingUsers = await User.find({ email: req.body.email });
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        // Upload logo to Cloudinary
        const uploadedImage = await cloudinary.uploader.upload(req.files.logo.tempFilePath);

        // Create new user object
        const newUser = new User({
            _id: new mongoose.Types.ObjectId(),
            channelName: req.body.channelName,
            email: req.body.email,
            phone: req.body.phone,
            password: hashedPassword,
            logoUrl: uploadedImage.secure_url,
            logoId: uploadedImage.public_id,
        });

        // Save user in database
        const savedUser = await newUser.save();
        res.status(200).json({ message: 'User registered successfully', user: savedUser });

    } catch (err) {
        console.error("Signup Error:", err);
        res.status(500).json({ error: 'Something went wrong during registration' });
    }
});

// ✅ LOGIN ROUTE
router.post('/login', async (req, res) => {
    try {
        console.log("Login Request Body:", req.body);

        // Find user by email
        const users = await User.find({ email: req.body.email });
        if (users.length === 0) {
            return res.status(400).json({ error: 'Email is not registered' });
        }

        // Compare password
        const isValid = await bcrypt.compare(req.body.password, users[0].password);
        if (!isValid) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        // Generate JWT token
        const token = jwt.sign({
            _id: users[0]._id,
            channelName: users[0].channelName,
            email: users[0].email,
            phone: users[0].phone,
            logo: users[0].logo,
        }, 'sbs online classes 123', {
            expiresIn: '365d'
        });
console.log(token)
        // Respond with user data and token
        res.status(200).json({
            message: 'Login successful',
            _id: users[0]._id,
            channelName: users[0].channelName,
            email: users[0].email,
            phone: users[0].phone,
            logoId: users[0].logoId,
            logoUrl: users[0].logoUrl,
            token: token,
            subscribers: users[0].subscribers,
            subscribedChannels: users[0].subscribedChannels,
        });

    } catch (err) {
        console.error("Login Catch Error:", err);
        res.status(500).json({ error: "Something went wrong during login" });
    }
});

//subscribe api
router.put('/subscribe/:id', checkAuth, async (req, res) => {
    try {
        // Get the token and verify it
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "Authorization token missing" });
        }

        const decoded = jwt.verify(token, 'sbs online classes 123');
        const subscriberId = decoded._id;

        // Prevent self-subscription
        if (req.params.id === subscriberId) {
            return res.status(400).json({ error: "You cannot subscribe to your own channel" });
        }

        // Get the user to be subscribed to
        const channelUser = await User.findById(req.params.id);
        if (!channelUser) {
            return res.status(404).json({ error: "Channel user not found" });
        }

        // Check if already subscribed
        if (channelUser.subscribersBy.includes(subscriberId)) {
            return res.status(400).json({ error: "You already subscribed to this channel" });
        }

        // Update the channel user's subscribers
        channelUser.subscribers += 1;
        channelUser.subscribersBy.push(subscriberId);
        await channelUser.save();

        // Update the current user's subscribed channels
        const subscriberUser = await User.findById(subscriberId);
        if (!subscriberUser.subscribedChannels.includes(channelUser._id)) {
            subscriberUser.subscribedChannels.push(channelUser._id);
            await subscriberUser.save();
        }

        res.status(200).json({ message: "Subscribed successfully", subscribers: channelUser.subscribers });

    } catch (err) {
        console.error("Subscribe Error:", err);
        res.status(500).json({ error: "Something went wrong while subscribing" });
    }
});
// unsubscribe api
router.put("/unsubscribe/:id", checkAuth, async (req, res) => {
try{
const userA=await jwt.verify(req.headers.authorization.split(" ")[1],"sbs online classes 123")
const userB=await User.findById(req.params.id)
if(userB.subscribersBy.includes(userA._id)){
    userB.subscribers-=1;
    userB.subscribersBy=userB.subscribersBy.filter((item)=>item!=userA._id)
    await userB.save()
    const userC=await User.findById(userA._id)
    userC.subscribedChannels=userC.subscribedChannels.filter((item)=>item!=userB._id)
    await userC.save()
    return res.status(200).json({message:"unsubscribed successfully",subscribers:userB.subscribers})
}}
catch(err){
    console.log(err)
    res.status(500).json({error:"something went wrong"})
}})
module.exports = router;
