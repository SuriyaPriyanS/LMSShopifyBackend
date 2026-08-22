

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

export function validationCourse(body, {partial = false} = {}) {
    const errors = {};
    const req = (field , label) => {
        if(!partial || body[field] !== undefined) {
            if(body[field] === undefined || body[field] === null || String(body[field]).trim() === "") {
                  errors[field] = `${label} is required`;
            }
        }
    };

    req("title", "Course title");
    req("description", "Description");
    req("instructorName", "Instructor name");
    req("category", "Category");
    req("duration", "Duration");

    if(body.title && String(body.title).trim().length < 2) {
        errors.title = "Course title must be at least 2 characters";
    }
    if(body.status !== undefined && !["Active", "Inactive"].includes(body.status)) {
        errors.status = "Status must be 'Active' or 'Inactive'";
    }

    return {valid: Object.keys(errors).length === 0, errors};
}


export function validateStudent(body, {partial = false} = {}) {
    const errors = {};

    if(!partial || body.name !== undefined) {
        if(!body.name || String(body.name).trim().length < 2) {
            errors.name = "Student name is required (min 2 characters)";
        }
    }
    if(!partial || body.email !== undefined) {
        if(!body.email || !EMAIL_RE.test(String(body.email).trim())) {
            errors.email = "A valid email address is required";
        }
    }
    return { valid: Object.keys(errors).length === 0 , errors};

}

export function validationEnrollment(body) {
    const errors = {};
    
    if (!body.studentId || !OBJECT_ID_RE.test(String(body.studentId))) {
        errors.studentId = "Valid Student ID is required";
    }
    if (!body.courseId || !OBJECT_ID_RE.test(String(body.courseId))) {
        errors.courseId = "Valid Course ID is required";
    }
    if (body.status !== undefined && !["In Progress", "Completed"].includes(body.status)) {
        errors.status = "Status must be 'In Progress' or 'Completed'";
    }
    
    return { valid: Object.keys(errors).length === 0, errors};
}


export function validateEnrollmentStatus(body) {
  const errors = {};
  if (!body.status || !["In Progress", "Completed"].includes(body.status)) {
    errors.status = "Status must be 'In Progress' or 'Completed'";
  }
  return { valid: Object.keys(errors).length === 0, errors };
}
