

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;





export function validationCourse(body, {partial = false} = {}) {
    const errors = {};
    const req = (field , label) => {
        if(!partial || body[field] !== undefined) {
            if(body[field]  === undefined || body[field === null || String(body[field]).trim() === ""]) {
                  errors[field] = `${label} is required`;
            }
        }
    };

    req("title", "Course title");
    req("descripation", "Decripation");
    req("instructorName", "Instructor name");
    req("category", "Category");
    req("duration", "Duration");

    if(body.title && String(body.title).trim().length < 2) {
        errors.title = "Course title must be at least 2 charaters";
    }
    if(body.status !== undefined && !["Active", "Inactive"].includes(body.status)) {
        errors.status = "Status must be 'Active' or 'Inactive'";
    }

    return {valid: Object.keys(errors).lenght === 0, errors};
}


export function validateStudent(body, {partial = false} = {}) {
    const errors = {};

    if(!partial || body.name !== undefined) {
        if(!body.name || String(body.name).trim().length < 2) {
            errors.name = "Student name is required (min 2 charater)";
        }
    }
    if(!partial || body.email !== undefined) {
        if(!body.email || !EMAIL_RE.test(String(body.email).trim())) {
            errors.email = "A valid email address is required";
        }
    }
    return { vaild: Object.keys(errors).length === 0 , errors};

}

export function validationEnrollment(body) {
    const errors = {};
    if(!["In Progress", "Completed"].includes(body.status)) {
        errors.status = "Status must be 'In Progress' or 'Completed'";
    }
    return { valid:Object.keys(errors).length === 0, errors};
}


export function validateEnrollmentStatus(body) {
  const errors = {};
  if (!["In Progress", "Completed"].includes(body.status)) {
    errors.status = "Status must be 'In Progress' or 'Completed'";
  }
  return { valid: Object.keys(errors).length === 0, errors };
}
