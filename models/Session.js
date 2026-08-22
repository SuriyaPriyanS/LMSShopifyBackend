import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    id: {
        type:String, required: true, unique: true, index: true
    },
    shop: {
        type: String, required: true, index: true
    }, 
    payload: {
        
            type: Object, required: true
    },
}, 
{timestamps: true}
);

export default mongoose.model("Session", sessionSchema);