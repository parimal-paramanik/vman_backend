const express= require('express')
const { Connection } = require('./config/db')
const { productRouter } = require("./Routes/productRoute")
const port= process.env.PORT
const app= express()
app.use(express.json())
const cors= require("cors");
const { userRouter } = require('./Routes/userRoutes')
;

app.get("/",(req,res)=>{
    res.send("Everything is working fine")
})
app.use(cors())

app.use("/",productRouter)
app.use("/user",userRouter)

app.listen((port),async(req,res)=>{
    try {
        await Connection
        console.log('server is connected to [MongoDB]')
    } catch (error) {
        console.log(error.message)
    }
    console.log(`server is awake at port ${port}`)
})