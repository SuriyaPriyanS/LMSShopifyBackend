import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema({
    shop: { 
        type: String, required: true, index:true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId, ref: "Course", required:true
    }, 
    enrollmentDate: {
        type: Date, default: Date.now
    },
    status: {
        type: String, enum: ["In Progress", "Completed"], default: "In Progress"
    }, 
},

    {timestamps: true}
);


enrollmentSchema.index({ student: 1, course: 1}, { unique:true});

export default mongoose.model("Enrollment", enrollmentSchema);