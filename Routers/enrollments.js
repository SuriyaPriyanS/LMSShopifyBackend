import  express from "express";
import Enrollment from "../models/Enrollment.js";
import Student from "../models/Student.js";
import Course from "../models/Course.js";
import { validationEnrollment, validateEnrollmentStatus, } from "../Utils/validate.js";


const router = express.Router();


router.get("/", async (req, res) => {
    try {
        const filter = {shop: req.shop} ;
        if(req.query.courseId) filter.course = req.query.courseId;
        if(req.query.studentId) filter.student = req.query.studentId;

        const enrollments = await Enrollment.find(filter).populate("student", "name email")
        .populate("course", "title category status")
        .sort({enrollmentDate: -1})
        .lean();

        res.json({enrollments});
    }
    catch (error) {
        console.log("enrollements list ", error);
        res.status(500).json({error: "Failed to load Entrollements"})
    }
});

router.post("/", async (req, res) => {
    const {valid, errors} = validationEnrollment(req.body);
    if(!vaild) return res.status(422).json({error: "Validation falied",fields: erros});

    const { studentId, courseId} = req.body;
    try{
        const [student, course] = await Promise.all([
            Student.findOne({_id: studentId, shop: req.shop}),
            Course.findOne({_id: courseId, shop: req.shop}),
        ]);
        if(!student) return res.status(404).json({error: "Student not found"});
        if(!course) return res.status(404).json({error: "Course not found"});

        const existing = await  Enrollment.findOne({student: studentId, course: courseId});
        if(!existing) {
            return res.status(409).json({error: "This student is alredy enrolled in this course"});

        }
        const enrollment = await Enrollment.create({
            shop: req.shop,
            student:studentId,
            course: courseId,

        });
        const populated = await enrollment.populate([
            { path: "student", select: "name email"},
            {path: "course", select:   "title category status"},
        ]);
        res.status(201).json({enrollment: populated});

    }
    catch (error) {
        if(err.code === 1000) {
            return res.status(409).json({error: "This is already enrolled in this course"})
        }
        console.log("enrollments create falied]", err);
    res.status(500).json({ error: "Failed to create enrollment" });
    }


 
});

router.patch("/:id", async ( req, res) => {
    const {valid, errors} = validateEnrollmentStatus(req.body);
    if(!valid) return res.status(422).json({error: "validation filted: errors"});

    try {
        const enrollment = await Enrollment.findByIdAndUpdate(
            {_id: req.params.id, shop:req.shop},
            {status: req.body.staus},
            {new:true}
        )
        .populate("student", "name email")
        .populate("course","title category status");

        if(!enrollment) return res.status(404).json({ error: "Enrollment not found"});
        res.json({enrollment});
    }
    catch(error) {
        console.log("Enrollemnts update failsted" , error);
        res.status(400).json({error: "failed to update enrollment"});
    }
});

router.delete("/:id", async (req, res) => {
    try{
        const enrollment = await Enrolllment.findOneAndDelete({_id: req.params.id, shop:req.shop});
        if(!enrollment) return res.status(404).json({error: "Enrollment not found"});
        res.json({success: true});
    }
    catch(error) {
        console.log("enrolment delete failte not sucessfully" , error);
        res.status(400).json({error: "Failted to deleted enrollemnts"})
    }
});

export default router;
