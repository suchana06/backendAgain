import mongoose from "mongoose";
import { DBNAME } from "../constants.js";  

const connectDB = async()=>{
    try{
        const connectInstance=await mongoose.connect(`${process.env.MONGODB_URL}/${DBNAME}`);
        console.log(`Connected to Mongo:${connectInstance.connection.host}`);
    }catch(error){
        console.log("ERROR OCCURED: " + error);
    }
}

export default connectDB;