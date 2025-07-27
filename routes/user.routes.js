const express = require('express');
const router = express.Router();
const userModel = require('../Models/user');
const postModel = require('../Models/post');
const upload=require ("../config/multerconfig")

const jwt=require('jsonwebtoken')
const bcrypt=require('bcrypt')


const path=require('path')

router.get('/logout', (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out" });
});


router.get("/allposts", isloggedin, async (req, res) => {
  try {
        const userId = req.user.userid;

    const posts = await postModel
      .find({})
      .sort({ date: -1 }) // newest first
      .populate("user", "username profilepic").populate("comments.user", "username")
; // include user info
      const loggedInUser = await userModel.findById(userId);

    res.status(200).json({ posts,user: loggedInUser });
  } catch (err) {
    console.error("Error fetching all posts:", err);
    res.status(500).json({ error: "Failed to load posts" });
  }
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////
router.post('/register',async (req,res)=>{
    let {email,password,name,username}=req.body
 let user=await userModel.findOne({email:email})  /*left wala data base mai email aur right waha jo body me mila */
    if(user) return res.status(500).send("User already exist")
      bcrypt.genSalt(10,(err,salt)=>{
    bcrypt.hash(password,salt, async (err,hash)=>{
       let user= await userModel.create({
        username,
        email,
        name,
        password:hash
       })
       let token=jwt.sign({email:email,userid:user._id},"shhhh")
       console.log(token);
       res.cookie("token",token)
       res.send("registered")
      })
    })
  })
  
  router.post('/login',async (req,res)=>{
    let {email,password}=req.body
    console.log(req.body)
    let user=await userModel.findOne({email:email})  /*left wala data base mai email aur right waha jo body me mila */
    if(!user) return res.status(500).send("Kuch galat hai")
      
      bcrypt.compare(password,user.password, function(err,result){
        if(result){ 
          console.log("user to mil gaya")
          let token=jwt.sign({email:email,userid:user._id},"shhhh")
          res.cookie("token",token,{
  httpOnly: true,
  secure: true, // set to true in production with HTTPS
  sameSite: 'lax', // important for cross-origin
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
});
          console.log("User found:", user);
          console.log(token);
         return(
    
           res.status(200).json({ user })
           
        );
        }
          res.status(401).send("Wrong password");
      })
})

router.get('/profile', isloggedin, async (req, res) => {
  try {
    const userId = req.user.userid;

    const posts = await postModel.find({ user: userId }).populate('user');
    const loggedInUser = await userModel.findById(userId);

    res.status(200).json({
      posts,
      user: loggedInUser, // ✅ send full user data
    });
  } catch (err) {
    res.status(500).send("Something went wrong");
  }
});


router.post("/upload", isloggedin, upload.single("image"), async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.user.email });
    user.profilepic = req.file.filename;
    await user.save();

    res.status(200).json({ message: "Profile picture updated", filename: req.file.filename });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

///////////////////////////////////////////////////////////////////////////////////////////////////////
router.post('/post', isloggedin, upload.single("image"), async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.user.email });

    const post = await postModel.create({
      user: user._id,
      content: req.body.content,
      image: req.file?.filename // 🆕 Save the filename (optional)
    });

    user.posts.push(post._id);
    await user.save();

    res.status(201).json({ message: "Post created", post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.get("/like/:id", isloggedin, async (req, res) => {
  try {
    let post = await postModel.findOne({ _id: req.params.id });

    const userId = req.user.userid;
    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(likeIndex, 1);
    }

    await post.save();

    res.status(200).json({ message: "Like toggled", likes: post.likes.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle like" });
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.post("/follow/:id", isloggedin, async (req, res) => {
  try {
    const userId = req.user.userid;
    const targetId = req.params.id;

    if (userId === targetId) {
      return res.status(400).json({ error: "You cannot follow yourself." });
    }

    const user = await userModel.findById(userId);
    const targetUser = await userModel.findById(targetId);

    const alreadyFollowing = user.following.includes(targetId);

    if (alreadyFollowing) {
      // Unfollow
      user.following.pull(targetId);
      targetUser.followers.pull(userId);
    } else {
      // Follow
      user.following.push(targetId);
      targetUser.followers.push(userId);
    }

    await user.save();           // ✅ Save user (important!)
    await targetUser.save();     // ✅ Save target user

    res.status(200).json({
      message: alreadyFollowing ? "Unfollowed" : "Followed",
      isFollowing: !alreadyFollowing,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to follow/unfollow user." });
  }
});


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.get("/edit/:id", isloggedin, async (req, res) => {
  try {
    const post = await postModel.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found");

    res.status(200).json({ post }); // ✅ send post as JSON to React
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.delete('/delete/:id', isloggedin, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.userid;

    const post = await postModel.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    // Optional: Check if the logged-in user is the owner
    if (post.user.toString() !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await postModel.findByIdAndDelete(postId);

    // Optional: remove reference from user.posts[]
    await userModel.findByIdAndUpdate(userId, {
      $pull: { posts: postId }
    });

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Delete failed:", err);
    res.status(500).json({ error: "Server error while deleting post" });
  }
});

//////////////////////////////////////////////////////////////////////////////////////////////////
router.put('/update/:id', isloggedin, async (req, res) => {
  const post = await postModel.findByIdAndUpdate(
    req.params.id,
    { content: req.body.content },
    { new: true }
  );
  res.json({ message: "Post updated", post });
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.post("/comment/:postId", isloggedin, async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user.userid; // or req.user._id depending on your token

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Comment text is required" });
    }

    const post = await postModel.findById(req.params.postId);
    const newComment = {
      user: userId,
      text,
    };

    post.comments.push(newComment);
    await post.save();

    // Populate the latest comment's user
    await post.populate("comments.user", "username");
    const lastComment = post.comments[post.comments.length - 1];

    res.status(200).json({ comment: lastComment });
  } catch (err) {
    console.error("Error posting comment:", err);
    res.status(500).json({ error: "Failed to post comment" });
  }
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// make sure path is correct

router.get("/someoneprofile/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    const user = await userModel.findById(userId).select("username email profilepic followers following");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const posts = await postModel
      .find({ user: userId })
      .sort({ date: -1 }) // newest first
      .select("content image date likes comments")
      .populate("user", "username profilepic");

    res.status(200).json({ user, posts });
  } catch (err) {
    console.error("🔥 Error fetching user and posts:", err);
    res.status(500).json({ error: "Server error while getting user profile" });
  }
});




///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function isloggedin(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).send("loggin required");

  try {
    const data = jwt.verify(token, "shhhh");
    req.user = data; // contains email and userid
    next();
  } catch {
    return res.status(401).send("Invalid token");
  }
}



module.exports = router;