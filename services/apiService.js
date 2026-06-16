
import { createClient } from '@supabase/supabase-js';

// --- Supabase Client Initialization ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// This check provides a clear, developer-friendly error if the credentials are not set in `env.js`.
// It prevents the Supabase client from being initialized with invalid placeholder data, which causes the crash.
if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase credentials are not set. Please create an `env.js` file in the root directory and add your SUPABASE_URL and SUPABASE_ANON_KEY.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function for consistent error handling
function handleResponse({ data, error }) {
    if (error) {
        console.error('Supabase API Error:', error.message);
        throw new Error(error.message);
    }
    return data;
}

// --- Data Fetching Functions ---
export const getStudents = async () => handleResponse(await supabase.from('students').select('*'));
export const getFaculty = async () => handleResponse(await supabase.from('faculty').select('*'));
export const getCourses = async () => handleResponse(await supabase.from('courses').select('*'));
export const getEvents = async () => handleResponse(await supabase.from('events').select('*').order('date', { ascending: false }));
export const getUploadedSyllabi = async () => handleResponse(await supabase.from('syllabi').select('*'));
export const getUploadedMarksheets = async () => handleResponse(await supabase.from('uploaded_marksheets').select('*'));

// This function will fetch all marks and format them into the nested structure the frontend expects.
export async function getStudentMarks() {
    const marksData = await handleResponse(await supabase.from('marks').select('*'));
    
    // Transform the flat 'marks' table data into the nested structure used by the app's state.
    const subjectMarksByStudent = {};
    for (const mark of marksData) {
        if (!subjectMarksByStudent[mark.student_id]) {
            subjectMarksByStudent[mark.student_id] = {};
        }
        subjectMarksByStudent[mark.student_id][mark.course_code] = {
            unitTest1: mark.unit_test1,
            unitTest2: mark.unit_test2,
            final: mark.final_exam,
            assignments: mark.assignments_json || {},
            labExperiments: mark.lab_experiments_json || {},
        };
    }
    return subjectMarksByStudent;
}


// --- Data Mutation Functions ---

export async function addStudent(newStudent) {
    // In a real app with authentication, you would create a user in the `users` table first.
    // This is a simplified version matching the current app structure.
    const response = await supabase.from('students').insert([newStudent]).select();
    return handleResponse(response)[0];
}

export async function removeStudents(studentIds) {
    return handleResponse(await supabase.from('students').delete().in('id', studentIds));
}

export async function addFaculty(newFaculty) {
    const response = await supabase.from('faculty').insert([newFaculty]).select();
    return handleResponse(response)[0];
}

export async function removeFaculty(facultyIds) {
    return handleResponse(await supabase.from('faculty').delete().in('id', facultyIds));
}

export async function updateFaculty(facultyId, updatedData) {
    const response = await supabase.from('faculty').update(updatedData).eq('id', facultyId).select();
    return handleResponse(response)[0];
}

export async function addCourse(newCourse) {
    const response = await supabase.from('courses').insert([newCourse]).select();
    return handleResponse(response)[0];
}

export async function removeCourse(courseCode) {
    // The database is set up with cascading deletes, so removing a course
    // will automatically remove associated marks and syllabi.
    return handleResponse(await supabase.from('courses').delete().eq('code', courseCode));
}

export async function updateCourseFaculty(courseCode, facultyName) {
    // In a real DB, you'd use faculty_id. We'll find the ID from the name.
    const facultyMembers = await getFaculty();
    const faculty = facultyMembers.find(f => f.name === facultyName);
    const facultyId = faculty ? faculty.id : null;
    
    // In the DB schema, 'courses' table doesn't have a 'faculty' text column.
    // It has a `faculty_id` that references the `faculty` table.
    // We update the `faculty_id` field.
    const response = await supabase.from('courses').update({ faculty_id: facultyId }).eq('code', courseCode).select();
    return handleResponse(response)[0];
}

export async function addEvent(newEvent) {
    const response = await supabase.from('events').insert([newEvent]).select();
    return handleResponse(response)[0];
}

export async function removeEvents(eventIds) {
    return handleResponse(await supabase.from('events').delete().in('id', eventIds));
}

// --- Complex Update and File Handling ---

export async function updateMarks(updates) {
    // This performs an "upsert" (update or insert) for each mark change.
    // It's robust for handling both new and existing marks.
    const marksToUpsert = updates.map(update => {
        // Map frontend markType to DB column name
        const dbColumnMap = {
            unitTest1: 'unit_test1',
            unitTest2: 'unit_test2',
            final: 'final_exam',
        };
        const dbColumn = dbColumnMap[update.markType] || update.markType;

        return {
            student_id: update.studentId,
            course_code: update.courseCode,
            [dbColumn]: update.value,
        };
    });

    return handleResponse(await supabase.from('marks').upsert(marksToUpsert, { onConflict: 'student_id, course_code' }));
}

// Helper to convert data URL to Blob for Supabase upload
async function dataUrlToBlob(dataUrl) {
    const res = await fetch(dataUrl);
    return await res.blob();
}

async function uploadFile(bucket, filePath, fileOrDataUrl) {
    let fileToUpload = fileOrDataUrl;

    // If it's a data URL (from PDF generation), convert it to a Blob
    if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:')) {
        fileToUpload = await dataUrlToBlob(fileOrDataUrl);
    }
    
    // If it's a Blob URL (from file input), fetch and convert to Blob
    if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('blob:')) {
         const response = await fetch(fileOrDataUrl);
         fileToUpload = await response.blob();
    }


    const { data, error } = await supabase.storage.from(bucket).upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: true, // Overwrite if file exists
    });

    if (error) {
        console.error(`Error uploading to ${bucket}:`, error.message);
        throw error;
    }
    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicUrl;
}

export async function uploadSyllabus(courseCode, fileUrl) {
    const fileName = `syllabus-${courseCode}.pdf`;
    const filePath = `syllabi/${fileName}`;
    const publicUrl = await uploadFile('files', filePath, fileUrl);
    
    // Save the URL to the database
    const response = await supabase.from('syllabi').upsert({ course_code: courseCode, file_url: publicUrl }, { onConflict: 'course_code' }).select();
    return handleResponse(response)[0];
}

export async function removeSyllabus(courseCode) {
    // First, try to find the file path to delete from storage
    const { data: syllabus } = await supabase.from('syllabi').select('file_url').eq('course_code', courseCode).single();
    if (syllabus && syllabus.file_url) {
        const filePath = syllabus.file_url.split('/files/')[1];
        await supabase.storage.from('files').remove([filePath]);
    }
    // Then, delete the database record
    return handleResponse(await supabase.from('syllabi').delete().eq('course_code', courseCode));
}

export async function uploadMarksheetPdf(courseCode, marksheetType, fileUrl) {
    const fileName = `${marksheetType}-${courseCode}-${Date.now()}.pdf`;
    const filePath = `marksheets/${marksheetType}/${fileName}`;
    const publicUrl = await uploadFile('files', filePath, fileUrl);
    
    const response = await supabase.from('uploaded_marksheets').upsert({
        course_code: courseCode === 'FINAL_SEMESTER_RESULTS' ? null : courseCode,
        type: marksheetType,
        file_url: publicUrl
    }, { onConflict: 'course_code, type' }).select();
    return handleResponse(response)[0];
}

export async function removeMarksheetPdf(courseCode, marksheetType) {
    const matchCriteria = { type: marksheetType };
    if (courseCode === 'FINAL_SEMESTER_RESULTS') {
        matchCriteria.course_code = null;
    } else {
        matchCriteria.course_code = courseCode;
    }

    // Find the file path
    const { data: marksheet } = await supabase.from('uploaded_marksheets').select('file_url').match(matchCriteria).single();
    if (marksheet && marksheet.file_url) {
        const filePath = marksheet.file_url.split('/files/')[1];
        await supabase.storage.from('files').remove([filePath]);
    }
    // Delete the database record
    return handleResponse(await supabase.from('uploaded_marksheets').delete().match(matchCriteria));
}

export async function saveFinalResults(resultData) {
    // This function updates multiple students in bulk.
    const studentUpdates = resultData.students.map(resultStudent => {
        const student = props.students.find(s => s.name.toLowerCase() === resultStudent.name.toLowerCase());
        return {
            id: student ? student.id : null, 
            final_results_json: {
                subjects: resultData.subjects,
                ...resultStudent
            }
        };
    }).filter(s => s.id); // Filter out any students that couldn't be matched
    
    // A Supabase Edge Function would be ideal for this transaction.
    // On the client, we perform updates in a loop.
    const updatePromises = studentUpdates.map(update => 
        supabase.from('students').update({ final_results_json: update.final_results_json }).eq('id', update.id)
    );
    
    const results = await Promise.all(updatePromises);
    results.forEach(res => handleResponse(res)); // Check each response for errors
    return { success: true, updatedCount: results.length };
}

// This function is for saving marks from the AI processing components
export async function saveMarksAndPdf(courseCode, marksheetType, updates, fileDataUrl) {
    // 1. Upload the PDF
    const { file_url } = await uploadMarksheetPdf(courseCode, marksheetType, fileDataUrl);

    // 2. Save the marks. This requires mapping the complex structure to the flat `marks` table.
    const marksToUpsert = [];
    const studentMarkUpdates = {}; // { studentId: { assignments: {}, labExperiments: {} } }

    updates.forEach(update => {
        if (!studentMarkUpdates[update.studentId]) {
            studentMarkUpdates[update.studentId] = { assignments: {}, labExperiments: {} };
        }

        if (marksheetType === 'internal') {
            const dbColumnMap = { unitTest1: 'unit_test1', unitTest2: 'unit_test2', final: 'final_exam' };
            marksToUpsert.push({
                student_id: update.studentId,
                course_code: courseCode,
                [dbColumnMap[update.markType]]: update.value
            });
        } else {
            const subCategory = marksheetType === 'assignment' ? 'assignments' : 'labExperiments';
            studentMarkUpdates[update.studentId][subCategory][update.markType] = update.value;
        }
    });

    // Handle JSONB updates for assignments and lab experiments
    for (const [studentId, marks] of Object.entries(studentMarkUpdates)) {
        if (Object.keys(marks.assignments).length > 0) {
            marksToUpsert.push({
                student_id: studentId,
                course_code: courseCode,
                assignments_json: marks.assignments
            });
        }
        if (Object.keys(marks.labExperiments).length > 0) {
            marksToUpsert.push({
                student_id: studentId,
                course_code: courseCode,
                lab_experiments_json: marks.labExperiments
            });
        }
    }
    
    if (marksToUpsert.length > 0) {
        await handleResponse(await supabase.from('marks').upsert(marksToUpsert, { onConflict: 'student_id, course_code' }));
    }
    
    return { file_url };
}
