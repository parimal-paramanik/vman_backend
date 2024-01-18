const express = require("express")
const { productModel } = require("../Models/productModel")
const { mailer } = require("../config/nodemailerconfig")
const productRouter= express.Router()
const fs= require("fs")
productModel
require("dotenv").config()

productRouter.post("/productentry",async(req,res)=>{
    try {
        const {product,serialNo,description,image,assertId,Token_uri} = req.body
        console.log(req.body)
        const existingProduct= await productModel.findOne({serialNo})
        if (existingProduct) {
            return res.status(409).json({ message: 'Product already exists' });
        }
        const newProduct = new productModel({
            product,
            serialNo,
            description,
            image,
            assertId,
            Token_uri
        });
        const savedProduct = await newProduct.save();

        // Return a success response with the saved product data
        res.status(201).json({ message: 'Product saved successfully', product: savedProduct });
    } catch (error) {
        // Handle errors
        console.error(error);
        res.status(500).json({ message: error.message });
    }
})
// GET route to retrieve all products
productRouter.get("/getAllProducts", async (req, res) => {
    try {
        const allProducts = await productModel.find();

        // Return the array of products in the response
        res.status(200).json({ products: allProducts });
    } catch (error) {
        // Handle errors
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
productRouter.get("/singleproduct/:id", async (req, res) => {
    try {
        const productId = req.params.id; 
        const oneproduct = await productModel.findOne({ _id: productId });

        // Check if the product with the given ID exists
        if (!oneproduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ products: oneproduct });
    } catch (error) {
        // Handle errors
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});
productRouter.post("/send-email",async(req,res)=>{
    try {
        const { email ,query,contact} = req.body;
        if (!email) {
          return res.status(404).json({
            message: "Failed to send OTP!",
            error: "Email is required!",
          });
        }
        // Getting html file to be sent in email from helper directory
        
        const htmlTemplate = fs.readFileSync("./Templates/forgetpass_mail.html", "utf8");
        // Replace placeholders in the HTML template with user's data
                const populatedHtml = htmlTemplate
                .replace('{{email}}', email)
                .replace('{{contact}}', contact)
                .replace('{{query}}', query);


        // Details for the email to be sent
            const mailOptions = {
                from: '"Vman " <smartdesk2015@gmail.com>',
                to: 'parimalradhe2015@gmail.com', 
                subject: "Inquiry By User",
                text: "Change your password",
                html: populatedHtml,
            };
        
        const mail = await mailer.sendMail(mailOptions);
        // Successfull email sent
        return res.status(200).json({
          message: `Email Submitted Successfully`,
        });
      } catch (error) {
        console.log("[FORGOT PASSWORD EMAIL ERROR]", error);
        return res.status(500).json({
        message: "Failed to send OTP!",
        error: "Failed to send OTP!",
      });
      }
})

module.exports={productRouter}