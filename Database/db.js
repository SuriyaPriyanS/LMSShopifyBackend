import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();



let cachedConnection = null;

const dbConnect = async () => {
    if (mongoose.connection.readyState === 1) {
        return;
    }

    if (cachedConnection) {
        await cachedConnection;
        return;
    }

    try {
        if (!process.env.MONGO_URL) {
            throw new Error("MONGO_URL environment variable is missing.");
        }
        
        cachedConnection = mongoose.connect(process.env.MONGO_URL, {
            bufferCommands: false,
        });
        
        await cachedConnection;
        console.log(" MongoDB connected successfully");
    } catch (error) {
        cachedConnection = null;
        console.error(" MongoDB connection failed:", error);
        if (!process.env.VERCEL) {
            process.exit(1);
        }
        throw error;
    }
};

export default dbConnect;