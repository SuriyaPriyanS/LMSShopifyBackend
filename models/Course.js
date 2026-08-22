import mongoose from "mongoose";



const courseSchema = new mongoose.Schema({
    shop: {
        type: String, required: true, index: true
    },
    title: {
        type: String, required : [true, "Course title is required"] , trim: true, minlength: 2, maxlength:200 } ,
      
        description: {
            type:String, required: [true, "Description is required"], 
            trim: true, maxlength: 4000
        },
        instructorName: {
            type: String, required: [true, "Instructor name is required"] ,
            trim: true, maxlength: 200 
        },
        category: {
            type: String, required: [true, "Category is required"],
            trim: true, maxlength: 100
        },
        duration: {
            type:String, required: [true, "Duration is required"],
            trim:true, maxlength: 100
        },
        status: {
            type: String, enum: ["Active", "Inactive"], default: "Active"
        },
    },
    {timestamps: true}
);


   courseSchema.index({ shop: 1, title: 1});


   courseSchema.pre("findOneAndDelete", async function (next) {
        const doc = await this.model.findOne(this.getFilter());

        if(doc) {
            const Enrollment = mongoose.model("Enrollment");
            await Enrollment.deleteMany({ course: doc._id});
        }
        next();
   });

   export default mongoose.model("Course", courseSchema);