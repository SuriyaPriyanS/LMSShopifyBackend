import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();



const dbConnect = async () => {
    try {
        if (!process.env.MONGO_URL) {
            throw new Error("MONGO_URL environment variable is missing.");
        }
        await mongoose.connect(process.env.MONGO_URL);
        console.log(" MongoDB connected successfully");
    } catch (error) {
        console.error(" MongoDB connection failed:", error);
        if (!process.env.VERCEL) {
            process.exit(1);
        }
        throw error;
    }
};

export default dbConnect;