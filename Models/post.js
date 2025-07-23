const  { Schema, model } = require("mongoose");

const postSchema = Schema({

  user:{type:Schema.Types.ObjectId,
    ref:"user"
  },
  date:{
    type:Date,
    default:Date.now
  },
  content:String,

   image: {
    type: String // store the filename or image URL
  },
    
  comments: [{
  user: { type: Schema.Types.ObjectId, ref: 'user' },
  text: String,
  date: { type: Date, default: Date.now }
}],


  likes:[{
    type:Schema.Types.ObjectId,
    ref:"user"
  }]
});

const postModel = model("post", postSchema);

module.exports = postModel;
 