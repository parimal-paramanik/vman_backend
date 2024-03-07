const express =  require("express")
const {userModel}= require("../Models/userModel")
const bcrypt = require("bcrypt")
const jwt= require("jsonwebtoken")
const userRouter=express.Router()
const {userAuth}= require("../Middleware/userOauth")


const nodemailer = require('nodemailer');
require("dotenv").config()
// Nodemailer configuration
const transporter  = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

userRouter.post("/register",async(req,res)=>{
    const { name, email, password } = req.body; // Retreiving data from request body

  // Regular expressions for validation
  const nameRegex = /^[A-Za-z\s]{3,}$/; // Minimum 3 letters in the name
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/; // Basic email validation
  const passwordRegex = /^(?=.*[!@#$%^&*])(?=.*[0-9])(?=.*[A-Z]).{8,16}$/; // Password with special char, number, uppercase, and 8-16 chars
  // Checking if proper information is being sent from client
  if (!name || !email || !password) {
    return res.status(401).json({
      message: "Failed to register",
      error: "Insufficient Information!",
    });
  }
  if (!nameRegex.test(name)) {
    return res.status(400).json({
      message: "Failed to register",
      error:
        "Name should be at least 3 letters long and should contain alphabets only!",
    });
  }
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message: "Failed to register",
      error: "Invalid email format!",
    });
  }

  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message: "Failed to register",
      error:
        "Password must be 8-16 characters, contain at least one special character, one number, and one uppercase letter!",
    });
  }
 
   try {
    const isUser = await userModel.findOne({ email });
    if (isUser) {
      return res.status(401).json({
        "message": "Failed to register",
        "error": "User already exists with this email!"
    })
    } else {
      bcrypt.hash(password, 5, async (err, hash) => {
        if (err) {
          res.status(401).json({message:"error while bcrypting"});
        }
        const verificationToken = await jwt.sign({ email }, process.env.JWT_ACCESS_TOKEN_SECRET)
        console.log(verificationToken)
        const user = new userModel({ name, email, password: hash, verificationToken });
        await user.save();

        // email to verify
  
        const verificationLink = `https://bacde.onrender.com/user/verifyemail?token=${verificationToken}`;
        const mailOptions = {
          from: 'smartdesk2015@gmail.com',
          to: email,
          subject: 'Email Verification',
          text: `Click the following link to verify your email:${verificationLink}`
        };
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error(error);
            res.status(400).json({msg:error.message})
            // Handle error sending email
          } else {
            console.log('Email sent: ' + info.response);
            res.send({msg: "email send for verification" ,user})
            // Handle successful email sending
          }
        })
      });
    }
   
   } catch (error) {
    res.status(400).json({msg:error.message})
   }
})
userRouter.get('/verifyemail', async (req, res) => {
  const token = req.query.token;
  console.log("Received token:", token); // Debugging statement
  
  const user = await userModel.findOne({ verificationToken: token });
  console.log("User found in database:", user); // Debugging statement

  if (user && !user.verified) {
    // Mark the user account as verified in your database
    user.verified = true;
    await user.save();
    console.log("User account verified:", user.email,token); // Debugging statement
    res.redirect(`http://localhost:5173/`);
  } else {
    console.log("Invalid or expired verification token:"); // Debugging statement
    res.status(400).json('Invalid or expired verification token');
  }
});


userRouter.post("/login",async(req,res)=>{
  try {
    const { email, password } = req.body;
    if(!email  || !password){
      return  res.status(400).json({  "msg": "please fill all field " });
   }
    const user = await userModel.findOne({ email });
    // console.log(user);
    if (!user) {
      res.status(400).json({"msg": "User Not found, Please Register First" });
    } else {
      if (user.verified) {

        bcrypt.compare(password, user.password, (err, result) => {
          if (result) {
            let accessToken = jwt.sign({ userId: user._id }, process.env.JWT_ACCESS_TOKEN_SECRET);
            res.status(200).json({
              data: { accessToken, user },
            message: "Login Success!",
            });
          } else {
            res.status(400).json({  "msg": "Wrong Credentials" });
          }
        });
      }else{
        res.status(400).json({ "msg": "Your email is not verified" });  
      }
    }
  } catch (err) {
    res.status(400).json({ "msg": err.message });
  }
})


userRouter.post("/addWalletToProfile", async (req, res) => {
  try {
    const { walletAddress ,email} = req.body;
     // Check if the wallet address is already bound to another user account
     const isWalletBound = await userModel.exists({ walletAddress });
     if (isWalletBound) {
       return res.status(400).json({ message: "Wallet address is already bound to another user" });
     }

    const isUserPresent = await userModel.findOne({ email });
    if (!isUserPresent) {
      return res.status(404).json({ message: "Login First" });
    }
   
    // update the wallet address to the user's profile
    isUserPresent.walletAddress = walletAddress;
    // Save the updated user document
    await isUserPresent.save();
    return res.status(200).json({ message: "Wallet address Binded" });
  } catch (error) {
    console.error("Error adding wallet address to user profile:", error);
    return res.status(500).json({ message: error.message });
  }
});

userRouter.post("/comparewalletaddress", async (req, res) => {
  try {
      const { walletAddress, email } = req.body;

      // Check if wallet address is provided
      if (!walletAddress) {
          return res.status(400).json({ message: "Wallet not connected" });
      }

      // Find user by email address
      const user = await userModel.findOne({ email });

      // Check if user exists
      if (!user) {
          return res.status(404).json({ message: "Login to Continue" });
      }

      // Check if user's wallet address is present
      if (!user.walletAddress) {
          return res.status(400).json({ message: "Please bind your wallet address first" });
      }

      // Compare user's wallet address with provided wallet address
      if (user.walletAddress === walletAddress) {
          return res.status(200).json({ message: "Wallet addresses match" });
      } else {
          return res.status(400).json({ message: "Wrong Wallet Connected" });
      }
  } catch (error) {
      console.error("Error comparing wallet address:", error);
      return res.status(500).json({ message: "Internal server error" });
  }
});

userRouter.get("/wallet", userAuth, async (req, res) => {
  try {
    // Find the user by user ID attached to the request object
    const user = await userModel.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Check if user has a wallet address
    if (!user.walletAddress) {
      return res.status(400).json({ message: "User does not have a wallet address" });
    }
    // Return the user's wallet address
    return res.status(200).json({ walletAddress: user.walletAddress });
  } catch (error) {
    console.error("Error getting wallet address:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports={userRouter}

