// Importing necessary modules
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Logic for user authentication
const userAuth = async (req, res, next) => {
  const access_token = req.headers.authorization;
  if (!access_token) {
    return res.status(400).json({ 
      message: "Authentication Failed!",
      error: "No token provided, please login!"
    });
  }
  jwt.verify(access_token, process.env.JWT_ACCESS_TOKEN_SECRET, (err, payload) => {
    if (err) {
      return res.status(400).json({ message: "Authentication Failed!", error: err.message });
    } else if (payload) {
      req.user = { userId: payload.user._id };
      next();
    }
  });
};

module.exports = { userAuth };
