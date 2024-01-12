

const mongoose = require("mongoose")

const modelShema= mongoose.Schema({
  product: { type: String, required: true },
  serialNo: {type: String,required: true },
  description: {type: String,required: true },
  image: {type: String,required: true },
  assertId: {type: Number,required: true },
  Token_uri: {type: String,required: true },
 
}
)

const productModel= mongoose.model("user",modelShema)

module.exports= {productModel}