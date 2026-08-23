import express from "express";
import Student from "../models/Student.js";
import Enrollment from "../models/Enrollment.js";
import { validateStudent } from "../Utils/validate.js";



const router = express.Router();


router.get("/", async (req, res) => {
    try {
        const students = await Student.find({ shop: req.shop}).sort({createdAt: -1}).lean();
        res.json({students});
    }
    catch (error) {
        console.log("student list flly", error);
        res.status(500).json({error: "Failed to load students"});
    }
});

router.get("/:id", async (req, res)=> {
    try {
        const student = await Student.findOne({_id: req.params.id, shop: req.shop}).lean();
        if(!student) return res.status(404).json({ error: "student not founs"});

        const enrollments = await Enrollment.find({ student: student._id, shop: req.shop}).populate("course", "title category status duration instructorName").sort({enrollmentDate: -1}).lean();
        const overallEnrollmentCount = enrollments.length;
        const completedCount = enrollments.filter((e)=> e.status === "Completed").length;
        const inProgressCount = enrollments.filter((e)=> e.status === "In Progress").length;

        res.json({
            student, 
            enrollments, 
            stats: {overallEnrollmentCount, completedCount, inProgressCount},
        });

    }
    catch (error) {
        console.log("Student getlist " , error);
        res.status(400).json({error: "Invalited student id"})
    }
});

router.post("/", async (req, res) => {
    const {valid , errors} = validateStudent(req.body);
    if(!valid) return res.status(422).json({error : "Validation failed", fields: errors});

    try {
        const student = await Student.create({
            shop: req.shop,
            name: req.body.name.trim(),
            email: req.body.email.trim().toLowerCase(),
            shopifyCustomerId: req.body.shopifyCustomerId || null,
        });
        res.status(201).json({student});
    }
    catch (error) {
        if(error.code === 11000){
            return res.status(409).json({error: "A student with this email already exists"});

        }
        console.log("student create un successfully", error);
        res.status(500).json({error:"Failed to create student"})
    }
});


router.patch("/:id", async (req, res)=> {
    const {valid , errors} = validateStudent(req.body, {partial: true});
    if(!valid) return res.status(422).json({error: "Validation Failed", fields: errors});

    try {
        const update = {};
        if(req.body.name !== undefined) update.name = req.body.name.trim();
        if(req.body.email !== undefined) update.email = req.body.email.trim().toLowerCase();

        const student = await Student.findOneAndUpdate(
            {_id: req.params.id, shop: req.shop},
            update,
            {new:true, runValidators: true}
        );
        if(!student) return res.status(404).json({error: "Student not found!"});
        res.json({student});
    }
    catch (error) {
        if(error.code === 11000){
            return res.status(409).json({error: "A student with this email already exists"});
        }
        console.log("Student update missing" , error);
        res.status(400).json({error: "Failed to update student details"});
    }
});

router.delete("/:id" , async(req, res) => {
    try {
        const student = await Student.findOneAndDelete({_id: req.params.id, shop:req.shop});
        if(!student) return res.status(404).json({error : "Student not found"});
        res.json({success: true});

    }
    catch (error){
        console.log("Student delete details" , error);
        res.status(400).json({error: "Failed to delete student details"})
    }
});

export default router;