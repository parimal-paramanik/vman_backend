

const mongoose = require("mongoose")

const userSchema= mongoose.Schema({
  name: { type: String, required: true },
  email: {type: String,required: true },
  password: {type: String,required: true },
  walletAddress: { type: String },
  verificationToken:{type:String},
  verified: {
    type: Boolean,
    default: false,
  },
}

)

const userModel= mongoose.model("userr",userSchema)

module.exports= {userModel}