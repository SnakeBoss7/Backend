const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
  username:String,
  name:String,
  email:String,
  password:String,
  profilepic:{
    type: String,
    default: "default.png"
  },
  posts:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"post"
  }],
   followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
  }]
});

const UserModel = mongoose.model("user", UserSchema);

module.exports = UserModel;
