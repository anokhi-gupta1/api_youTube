const express=require('express');
const Router=express.Router();
const comment=require('../models/Comment');
const checkAuth=require('../middleware/checkAuth');
const jwt=require('jsonwebtoken');
const mongoose=require('mongoose');
//add a comment
Router.post('/new-comment/:videoId',checkAuth,async(req,res)=>{
    try{
      const token=req.headers.authorization.split(" ")[1];
      const verifiedUser=await jwt.verify(token,"sbs online classes 123");
      console.log(verifiedUser)
      const newComment=new comment({
        _id:new mongoose.Types.ObjectId(),
        userId:verifiedUser._id,
        videoId:req.params.videoId,
        commentText:req.body.commentText,
        
      })
      const comment1=await newComment.save()
      res.status(200).json({
        newComment:comment1
      })

    }
    catch(err){
        console.log("Error in new comment",err)
        res.status(500).json({error:"Something went wrong"})
    }
})
//get all comment
Router.get('/get-comment/:videoId', async (req, res) => {
  try {
    const videoId = req.params.videoId;
    console.log("Fetching comments for video ID:", videoId);

    const comments = await comment.find({ videoId: videoId })
      .populate('userId', 'channelName logoUrl');

    res.status(200).json({ comments });
  } catch (err) {
    console.error("Get Comment Error:", err);
    res.status(500).json({ error: 'Something went wrong', details: err.message });
  }
});


// update a comment
Router.put('/update-comment/:commentId',checkAuth,async(req,res)=>{
    try{
        const token=req.headers.authorization.split(" ")[1];
        const verifiedUser=await jwt.verify(token,"sbs online classes 123");
        console.log(verifiedUser)
        const updatedComment=await comment.findByIdAndUpdate(req.params.commentId,{
            commentText:req.body.commentText
        },{new:true})
        res.status(200).json({
            updatedComment:updatedComment
        })
    }
    catch(err){
        console.log("Error in update comment",err)
        res.status(500).json({error:"Something went wrong"})
    }
})
//delete a comment
Router.delete('/delete-comment/:commentId', checkAuth, async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const verifiedUser = jwt.verify(token, "sbs online classes 123");

        const commentData = await comment.findById(req.params.commentId);
        if (!commentData) {
            return res.status(404).json({ error: "Comment not found" });
        }

        if (commentData.userId.toString() !== verifiedUser._id) {
            return res.status(403).json({ error: "You are not authorized to delete this comment" });
        }

        await comment.findByIdAndDelete(req.params.commentId);

        res.status(200).json({ message: "Comment deleted successfully" });

    } catch (err) {
        console.error("Error in delete comment:", err);
        res.status(500).json({ error: "Something went wrong" });
    }
});


module.exports=Router;


