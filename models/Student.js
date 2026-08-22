import mongoose from "mongoose";


const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;



const studentSchema = new mongoose.Schema({
    shop: {
        type: String, required: true, index: true
    },
    name: {
        type: String, required: [true, "Student name is required"], trim:true, minlength: 2, maxlength: 200
    },
    email: {
        type: String,
        required: [true, "Student email is required"],
        trim: true,
        lowercase: true,
        match: [EMAIL_RE, "Invalid email address"],

    },

    shopifyCustomerId: {
        type: String, 
        default: null } ,


    },

    {timestamps: true}

);

studentSchema.index({ shop: 1, email:1}, { unique: true});

studentSchema.pre("findOneAndDelete", async function (next) {
     const doc = await this.model.findOne(this.getFilter());

     if(doc) {
        const Enrollment = mongoose.model("Enrollment");
        await Enrollment.deleteMany({ student: doc. id});
     }

     next();
})

export default mongoose.model ("Student", studentSchema);

