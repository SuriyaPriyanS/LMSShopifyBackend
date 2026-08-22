import mongoose from "mongoose";

const  shopSchema = new mongoose.Schema(
    {
        shop: {
            type:String, required: true, unique: true, index: true
        },
        installedAt: {
            type:Date, default: Date.now
        },
        uninstalledAt: {
            type: Date, default: null
        },
    },
    {timestamps: true}
);

export default mongoose.model("Shop", shopSchema);