import express from "express";
const app = express();
import connectDB from "./db/index.js";
import dotenv from "dotenv";
dotenv.config({
    path: "./env"
});

connectDB()
.then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log(`app is listening in port no. ${process.env.PORT}`);
    })
})
.catch(()=>{
    console.log("database connection failed: " + err);
})


/*
(async()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URL}/${DBNAME}`);
        app.on("error",(error)=>{
            console.log("ERROR: " + error);
        });
        app.listen(process.env.PORT,()=>{
            console.log(`app listening on port:${process.env.PORT}`);
        })
    }catch(e){
        console.log("ERROR: " + e.message);
    }
})()

*/