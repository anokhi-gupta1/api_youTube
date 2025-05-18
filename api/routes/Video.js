const express = require('express');
const checkAuth = require('../middleware/checkAuth');
const Router = express.Router();
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();
const video = require("../models/Video");
const mongoose = require('mongoose');
const body=require('body-parser');

// Cloudinary configuration

cloudinary.config({ 
  cloud_name: 'dcmaxwnox', 
  api_key: '722487791946348', 
  api_secret: process.env.Api_secret
});
//upload video
Router.post('/upload', checkAuth, async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const user = jwt.verify(token, "sbs online classes 123");

    console.log("Body:", req.body);
    console.log("Files:", req.files);

    const uploadedVideo = await cloudinary.uploader.upload(
      req.files.video.tempFilePath,
      { resource_type: "video" }
    );

    const uploadedThumbnail = await cloudinary.uploader.upload(
      req.files.thumbnail.tempFilePath
    );

    const newVideo = new video({
      _id: new mongoose.Types.ObjectId(),
      title: req.body.title,
      description: req.body.description,
      user_id: user._id,
      VideoUrl: uploadedVideo.secure_url,
      VideoId: uploadedVideo.public_id,
      thumbnailUrl: uploadedThumbnail.secure_url,
      thumbnailId: uploadedThumbnail.public_id,
      category: req.body.category,
      tags: req.body.tags ? req.body.tags.split(",") : [],
    });

    const newUploadedVideoData = await newVideo.save();
    res.status(200).json({
      newVideo: newUploadedVideoData,
      message: "Video uploaded successfully"
    });

  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});
//update a video details
Router.put('/:VideoId', checkAuth, async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        console.log(token)
        const verifyuser =  jwt.verify(token, "sbs online classes 123");

        const videoData =    await video.find( req.body.VideoId );
        console.log("Video Data:", videoData[0].user_id);
        console.log("Verified User:", verifyuser);

        if (!videoData) {
            return res.status(404).json({ error: "Video not found" });
        }

        if (videoData[0].user_id == verifyuser._id) {
            console.log("done")
            if(req.files){
                await cloudinary.uploader.destroy(videoData[0].thumbnailId);
                const updatedThumbnail=await cloudinary.uploader.upload(req.files.thumbnail.tempFilePath);
            const updatedData={
                title: req.body.title,
                description: req.body.description,
                category: req.body.category,
      tags: req.body.tags ? req.body.tags.split(",") : [],thumbnailUrl: updatedThumbnail.secure_url,
      thumbnailId: updatedThumbnail.public_id
                }
                const updatedVideoDetails=await video.updateOne({ _id: req.params.VideoId }, { $set: updatedData });
                res.status(200).json({
                    message: "Video updated successfully",
                    updatedVideo: updatedVideoDetails
                });
            }
        }

    } catch (err) {
        console.error("Update error:", err);
        res.status(500).json({ error: "Something went wrong" });
    }
});
//delete a video
Router.delete('/:VideoId', checkAuth, async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const verifyuser = jwt.verify(token, "sbs online classes 123");

        const videoData = await video.findById(req.params.VideoId); // ✅ Fixed

        if (!videoData) {
            return res.status(404).json({ error: "Video not found" });
        }

        // Compare user IDs (make sure both are strings for safety)
        if (videoData.user_id.toString() !== verifyuser._id.toString()) {
            return res.status(403).json({ error: "Unauthorized to delete this video" });
        }

        await video.findByIdAndDelete(req.params.VideoId);
        res.status(200).json({ message: "Video deleted successfully" });

    } catch (err) {
        console.error("Delete error:", err);
        res.status(500).json({ error: "Something went wrong" });
    }
});
//count no of likes
Router.put('/like/:VideoId', checkAuth, async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "Authorization token missing" });
        }

        const verifiedUser = jwt.verify(token, "sbs online classes 123");

        // Fetch video by ID
        const videoData = await video.findById(req.params.VideoId);
        if (!videoData) {
            return res.status(404).json({ error: "Video not found" });
        }

        // If already liked
        if (videoData.likeBy.includes(verifiedUser._id)) {
            return res.status(400).json({ error: "You already liked this video" });
        }

        // If previously disliked, remove the dislike
        if (videoData.dislikeBy.includes(verifiedUser._id)) {
            videoData.dislikes -= 1;
            videoData.dislikeBy = videoData.dislikeBy.filter(id => id !== verifiedUser._id);
        }

        // Add like
        videoData.likeBy.push(verifiedUser._id);
        videoData.likes += 1;
        await videoData.save();

        res.status(200).json({
            message: "Video liked successfully",
            likes: videoData.likes
        });

    } catch (err) {
        console.error("Like Error:", err);
        res.status(500).json({ error: "Something went wrong" });
    }
});

//count no of dislikes
Router.put('/dislike/:VideoId', checkAuth, async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "Authorization token missing" });
        }

        const verifiedUser = jwt.verify(token, "sbs online classes 123");

        // Fetch video by ID
        const videoData = await video.findById(req.params.VideoId);
        if (!videoData) {
            return res.status(404).json({ error: "Video not found" });
        }

        // If already disliked
        if (videoData.dislikeBy.includes(verifiedUser._id)) {
            return res.status(400).json({ error: "You already disliked this video" });
        }

        // If previously liked, remove like
        if (videoData.likeBy.includes(verifiedUser._id)) {
            videoData.likes -= 1;
            videoData.likeBy = videoData.likeBy.filter(id => id !== verifiedUser._id);
        }

        // Add dislike
        videoData.dislikeBy.push(verifiedUser._id);
        videoData.dislikes += 1;

        await videoData.save();

        res.status(200).json({
            message: "Video disliked successfully",
            dislikes: videoData.dislikes
        });

    } catch (err) {
        console.error("Dislike Error:", err);
        res.status(500).json({ error: "Something went wrong" });
    }
});

//view api
Router.put('/view/:VideoId',checkAuth,async(req,res)=>{
    try{
        const token = req.headers.authorization.split(" ")[1];
        const verifyuser = jwt.verify(token, "sbs online classes 123");
        console.log(verifyuser)
        const videoData =    await video.find( req.body.VideoId );
        console.log("Video Data:", videoData[0]);
        console.log("Verified User:", verifyuser);

        if (!videoData) {
            return res.status(404).json({ error: "Video not found" });
        }
        videoData[0].views += 1;
        await videoData[0].save();
        res.status(200).json({message:"video viewed successfully",views:videoData[0].views})
       
    }
    catch(err){
        console.log(err)
        res.status(500).json({error:"something went wrong"})
    }
   
})
module.exports = Router;
