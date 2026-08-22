import express from "express";

import Course from "../models/Course.js";
import Student from "../models/Student.js";
import Enrollment from "../models/Enrollment.js";



const router = express.Router();


router.get("/" , async (req, res) => {
    try{
        const shop = req.shop;

        const [totalCourses, totalStudents, totalEnrollments, completedCount, inProgressCount, recent] =
        await Promise.all([
            Course.countDocuments({shop}),
            Student.countDocuments({shop}),
            Enrollment.countDocuments({shop}),
            Enrollment.countDocuments({ shop, status: "Completed"}),
            Enrollment.countDocuments({shop, status: "In Progress"}),
            Enrollment.find({shop}).sort({enrollmentDate: -1}).limit(5)
            .populate("student", "name email")
            .populate("course" , "title")
            .lean(),
        ]);
        res.json({totalCourses, totalStudents, totalEnrollments, completedCount, inProgressCount, recentEnrollments: recent});

    }
    catch(error) {
        console.log("Dashboard" , error);
        res.status(500).json({error: "Failed to load dashboard"});
    }
});

export default router;