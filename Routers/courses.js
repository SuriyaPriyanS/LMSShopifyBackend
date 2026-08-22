import express from "express";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import { validationCourse} from "../Utils/validate.js";


const router = express.Router();


router.get("/", async (req , res) => {
    try {
        const courses = await Course.find({shop: req.shop}).sort({createdAt: -1}).lean();
        res.json({courses});
    }
    catch (error) {
        console.log("course list failed", error);
        res.status(500).json({error: "Failed to load courses"});
    }

});

router.get("/:id", async (req, res) => {
    try {
        const course = await Course.findOne({ _id: req.params.id, shop:req.shop}).lean();
        if(!course) return res.status(404).json({error: "Course not found"});

        const enrollmentCount = await Enrollment.countDocuments({course: course._id});
        res.json({ course: {...course, enrollmentCount}});
    }
    catch (error) {
        console.log("course/get", error);
        res.status(400).json({error: "Invalid course id"});
    }
});

router.post("/", async (req, res) => {
    const { valid, errors} = validationCourse(req.body);
    if(!valid) return res.status(422).json({ errors: "Validation failed", fields: errors});

    try {
        const course = await Course.create({
            shop: req.shop,
            title: req.body.title.trim(),
            descripation: req.body.descripation.trim(),
            instructorName: req.body.instructorName.trim(),
            category: req.body.category.trim(),
            duration: req.body.duration.trim(),
            status: req.body.status || "Active",
        });
        res.status(201).json({course});
    }
    catch (error) {
        console.log("course create failed", error);
        res.status(500).json({error: "Failed to create course"});
    }
});

router.patch("/:id", async (req, res)=> {
    const {valid, errors} = validationCourse(req.body,{partial: true});
    if(!valid) return res.status(422).json({error: "Validation failed", fields: errors });


    try {
        const update = {}; 
        for(const key of ["title", "descripation", "instructorName", "category", "duration", "status"]) {
            if(req.body[key] !== undefined) {
                update[key] = typeof req.body[key] === "string" ? req.body[key].trim() : req.body[key];

            }


        }
         const course = await Course.findOneAndUpdate(
            {_id: req.params.id, shop: req.shop},
            update,
            {new: true, runValidators: true}
         );
         if(!course) return res.status(404).json({error: "Course not found"});
         res.json({course});

    
    }
    catch (error) {
        console.log("courses update" , error);
        res.status(400).json({error: "failed to update course"})
    }
});

router.delete("/:id" , async (req, res) => {
    try {
        const course = await Course.findOneAndDelete({_id: req.params.id, shop: req.shop});
        if(!course) return res.status(404).json({error: "Course not douns"});
        res.json({ success: true});

    }
    catch(error) {
        console.log("course delete not working", error);
        res.status(400).json({error: "Failed to delete course"});
    }
});

export default router;
