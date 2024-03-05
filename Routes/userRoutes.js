const express =  require("express")
const {userModel}= require("../Models/userModel")
const bcrypt = require("bcrypt")
const jwt= require("jsonwebtoken")
const userRouter=express.Router()
const {userAuth}= require("../Middleware/userOauth")
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
  }//Checking if user is already present in database
  const isUser = await userModel.findOne({ email });
  if (isUser) {
    return res.status(401).json({
      
        "message": "Failed to register",
        "error": "User already exists with this email!"
    
      
    });
  }
  try {
    // hashing the password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 8);

    // Creating a new user in database
    const user = new userModel({
      email,
      name,
      password: hashedPassword,
    });
    await user.save();

    // Sending the registered user details in response upon successful registration
    return res.status(200).json({
      message: "Registartion successful!",
      data: user,
    });
  } catch (error) {
    console.log("[REGISTER ERROR]", error);
    return res
      .status(500)
      .json({ message: "Internal Error!", error: error.message });
  }
})


userRouter.post("/login",async(req,res)=>{
//Retreiving user email and password from request body
const { email, password } = req.body;
if (!email || !password) {
  return res.status(401).json({
    message: "Login Failed!",
    error: "Insufficient Information!",
  });
}
try {
  // Checking for user in database
  const isUserPresent = await userModel.findOne({ email });

  // User not present in the database.
  if (!isUserPresent) {
    return res.status(404).json({
      message: "Login Failed! No user found. Please register!",
      error: "No user found. Please register!!"
    });
  }
  // Password verification
  const isPasswordCorrect = bcrypt.compareSync(
    password,
    isUserPresent.password
  );
  // If password is not correct
  if (!isPasswordCorrect) {
    return res.status(401).send({
      message: "Login Failed!",
      error: "Wrong Credentials!",
    });
  }
  // Generating access token and sending login success response
  const accessToken = jwt.sign(
    { userId: isUserPresent._id, user: isUserPresent },
    process.env.JWT_ACCESS_TOKEN_SECRET
  );
  return res.status(200).send({
    data: { accessToken, isUserPresent },
    message: "Login Success!",
  });
} catch (error) {
  console.log("[LOGIN ERROR]", error);
  return res.status(500).json({
    message: "Internal Server error!",
    error: error.message,
  });
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



// userRouter.post("/comparewalletaddress", async (req, res) => {
//   try {
//     const { walletAddress, email } = req.body;
//     const isUserPresent = await userModel.findOne({ email });

//     // if (!walletAddress) {
//     //   // Check if the user has already bound a wallet
//     //   return res.status(400).json({ message: "Connect your wallet" });
//     // }

//     if (!isUserPresent.walletAddress) {
//       return res.status(400).json({ message: "Please bind your wallet" });
//     }

//     // Check if the wallet address matches
//     if (walletAddress !== isUserPresent.walletAddress) {
//       return res.status(400).json({ message: "Wrong Wallet Connected" });
//     }

//     return res.status(200).json({ message: "Right wallet address" });
//   } catch (error) {
//     return res.status(500).json({ message: error.message });
//   }
// });
userRouter.post("/comparewalletaddress", async (req, res) => {
  try {
      const { walletAddress, email } = req.body;

      // Check if wallet address is provided
      if (!walletAddress) {
          return res.status(400).json({ message: "Wallet address is required" });
      }

      // Find user by email address
      const user = await userModel.findOne({ email });

      // Check if user exists
      // if (!user) {
      //     return res.status(404).json({ message: "User not found" });
      // }

      // Check if user's wallet address is present
      if (!user.walletAddress) {
          return res.status(400).json({ message: "Please bind your wallet address first" });
      }

      // Compare user's wallet address with provided wallet address
      if (user.walletAddress === walletAddress) {
          return res.status(200).json({ message: "Wallet addresses match" });
      } else {
          return res.status(400).json({ message: "Wrong Wllet Connected" });
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

