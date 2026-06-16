import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.warn("API_KEY environment variable not set. AI features will not function.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
        systemInstruction: `You are a friendly and helpful AI assistant for a college's IT Department Management System.
        Your role is to answer questions from students, faculty, and staff about the system and college-related information.
        Topics include: student information (registration, attendance, marks),
        faculty details, academic matters (courses, timetables, exams), events (seminars, workshops), and resources (library, labs).
        Be concise, accurate, and maintain a professional yet approachable tone. Do not answer questions outside of this scope.`,
        temperature: 0.7,
        topP: 0.9,
    },
});

export async function* streamChatResponse(message) {
    if (!API_KEY) {
        yield "Chatbot is currently disabled. Administrator needs to set an API Key.";
        return;
    }
    
    try {
        const result = await chat.sendMessageStream({ message });
        for await (const chunk of result) {
            yield chunk.text;
        }
    } catch (error) {
        console.error("Error streaming response from Gemini:", error);
        yield "I'm sorry, but I'm having trouble connecting to my services right now. Please try again in a moment.";
    }
}

export async function processInternalMarksImage(images) {
    if (!API_KEY) {
        throw new Error("API_KEY not set. Document processing is disabled.");
    }

    const imageParts = images.map(image => ({
        inlineData: {
            data: image.base64Data,
            mimeType: image.mimeType
        }
    }));

    const textPart = {
        text: `IMPORTANT: Your response MUST be a single, valid JSON object. Do not include any text, markdown, or explanations before or after the JSON block.

Analyze the provided image(s), which may be multiple pages of a single internal marks sheet for a single course. Consolidate all student marks from all pages into a single structured JSON response.

Extraction Rules:
- **Crucial Rule:** The 'courseDetails' object must always be present. If the course name or code is not clearly visible in the document, you MUST provide fallback values. Use 'Unknown Course' for the course name and 'UNKNOWN' for the course code.
- Extract the main course name and course code from the header.
- For each student row, extract the 'Student ID' (or serial number), 'Student Name', 'Unit Test 1', 'Unit Test 2', and 'Final' marks.
- If a mark is missing, represented by a dash ('-'), or otherwise empty, do not include the corresponding key for that student's object.
- Ensure all numerical values are extracted as numbers, not strings.

The response must be a JSON object with two top-level keys: 'courseDetails' and 'students'.`
    };
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            courseDetails: {
                type: Type.OBJECT,
                properties: {
                    courseName: { type: Type.STRING, description: "The full name of the course, e.g., 'Advanced Algorithms'." },
                    courseCode: { type: Type.STRING, description: "The course code, e.g., 'CS301'." }
                },
                required: ["courseName", "courseCode"]
            },
            students: {
                type: Type.ARRAY,
                description: "List of all students and their marks from the document.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        studentId: { type: Type.STRING, description: "The student's ID or serial number from the first column." },
                        studentName: { type: Type.STRING, description: "The student's full name." },
                        unitTest1: { type: Type.NUMBER, description: "Mark for Unit Test 1. Omit if not present." },
                        unitTest2: { type: Type.NUMBER, description: "Mark for Unit Test 2. Omit if not present." },
                        final: { type: Type.NUMBER, description: "Mark for the Final assessment. Omit if not present." },
                    },
                    required: ["studentId", "studentName"]
                }
            }
        },
        required: ["courseDetails", "students"]
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [...imageParts, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });

        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);

    } catch (error) {
        console.error("Error processing internal marks with Gemini:", error);
        throw new Error("Failed to extract data from the marks sheet. The AI model could not process the image or the format was unrecognized.");
    }
}


export async function processAssignmentMarksImage(images) {
    if (!API_KEY) {
        throw new Error("API_KEY not set. Document processing is disabled.");
    }

    const imageParts = images.map(image => ({
        inlineData: {
            data: image.base64Data,
            mimeType: image.mimeType
        }
    }));

    const textPart = {
        text: `Your response MUST be a single, valid JSON object. Do not include any text or markdown before or after the JSON block.

Analyze the provided image(s) of a student assignment marksheet, which may be spread across multiple pages. Consolidate all student data from all pages into a single JSON response.

Extraction Rules:
- Extract the 'Subject Name & Code' if available. If not, use 'Unknown Subject' and 'UNKNOWN' as fallback values.
- For each student row, extract the 'Roll No.', 'NAME OF STUDENT', 'Assignment 1' mark, 'Assignment 2' mark, and the crucial 'Avg. Marks'.
- The marks for each assignment might be under a sub-column (like 'T'). Extract the numerical value from within the main assignment column group.
- If a mark for any assignment or the average is missing or empty, you must omit the corresponding key from that student's object.
- All extracted marks must be numerical values.

The response must be a JSON object with two top-level keys: 'subjectDetails' and 'students'.`
    };
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            subjectDetails: {
                type: Type.OBJECT,
                properties: {
                    subjectName: { type: Type.STRING, description: "The name of the subject." },
                    subjectCode: { type: Type.STRING, description: "The subject code." }
                },
                required: ["subjectName", "subjectCode"]
            },
            students: {
                type: Type.ARRAY,
                description: "List of all students and their assignment marks.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        rollNo: { type: Type.STRING, description: "The student's roll number." },
                        studentName: { type: Type.STRING, description: "The student's full name." },
                        assignment1: { type: Type.NUMBER, description: "Mark for Assignment 1. Omit if not present." },
                        assignment2: { type: Type.NUMBER, description: "Mark for Assignment 2. Omit if not present." },
                        avgMarks: { type: Type.NUMBER, description: "Average marks. Omit if not present." }
                    },
                    required: ["rollNo", "studentName"]
                }
            }
        },
        required: ["subjectDetails", "students"]
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [...imageParts, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });

        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);

    } catch (error) {
        console.error("Error processing assignment marks with Gemini:", error);
        throw new Error("Failed to extract data from the assignment marksheet. The AI model could not process the image or the format was unrecognized.");
    }
}

export async function processLabMarksImage(images) {
    if (!API_KEY) {
        throw new Error("API_KEY not set. Document processing is disabled.");
    }

    const imageParts = images.map(image => ({
        inlineData: {
            data: image.base64Data,
            mimeType: image.mimeType
        }
    }));

    const textPart = {
        text: `Your response MUST be a single, valid JSON object. Do not include any text or markdown.

Analyze the provided image(s) of a lab experiment marksheet, potentially across multiple pages. Consolidate all student data into a single JSON response.

Extraction Rules:
- Extract 'Subject Name & Code'. If not visible, use 'Unknown Subject' and 'UNKNOWN'.
- For each student, extract 'Roll No.', 'NAME OF STUDENT', marks for 'EXP1' through 'EXP6', and the final 'Avg. Marks'.
- The marks for each experiment might be under a sub-column (e.g., 'T'). Extract the numerical value from the main experiment column group.
- If a mark is missing or empty, omit the corresponding key from the student's object.
- All extracted marks must be numerical values.

The response must be a JSON object with 'subjectDetails' and 'students' keys.`
    };
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            subjectDetails: {
                type: Type.OBJECT,
                properties: {
                    subjectName: { type: Type.STRING, description: "The name of the subject." },
                    subjectCode: { type: Type.STRING, description: "The subject code." }
                },
                required: ["subjectName", "subjectCode"]
            },
            students: {
                type: Type.ARRAY,
                description: "List of all students and their lab experiment marks.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        rollNo: { type: Type.STRING, description: "The student's roll number." },
                        studentName: { type: Type.STRING, description: "The student's full name." },
                        exp1: { type: Type.NUMBER, description: "Mark for EXP1. Omit if not present." },
                        exp2: { type: Type.NUMBER, description: "Mark for EXP2. Omit if not present." },
                        exp3: { type: Type.NUMBER, description: "Mark for EXP3. Omit if not present." },
                        exp4: { type: Type.NUMBER, description: "Mark for EXP4. Omit if not present." },
                        exp5: { type: Type.NUMBER, description: "Mark for EXP5. Omit if not present." },
                        exp6: { type: Type.NUMBER, description: "Mark for EXP6. Omit if not present." },
                        avgMarks: { type: Type.NUMBER, description: "Average marks. Omit if not present." }
                    },
                    required: ["rollNo", "studentName"]
                }
            }
        },
        required: ["subjectDetails", "students"]
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [...imageParts, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });

        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);

    } catch (error) {
        console.error("Error processing lab marks with Gemini:", error);
        throw new Error("Failed to extract data from the lab marksheet. The AI model could not process the image or the format was unrecognized.");
    }
}


export async function processDocumentImage(images) {
    if (!API_KEY) {
        throw new Error("API_KEY not set. Document processing is disabled.");
    }

    const imageParts = images.map(image => ({
        inlineData: {
            data: image.base64Data,
            mimeType: image.mimeType
        }
    }));

    const textPart = {
        text: `IMPORTANT: Your response MUST be a single, valid JSON object and nothing else. Do not include any text, markdown formatting, or explanations before or after the JSON block.

Analyze the provided image(s) of a 'Consolidated Result Sheet', which might be split across multiple pages. Consolidate all header subjects and all student results from all pages into the structured JSON format specified in the schema.

Key extraction rules:
- Pay close attention to column alignment to ensure correct data association.
- **Crucial Rule for Lab/Project Subjects**: Some subjects might have multiple components like 'TW' (Term Work), 'PR' (Practical), and 'OR' (Oral). If a subject has separate columns for both 'PR' and 'OR', you MUST merge them into a single component named "PR/OR". For numerical values like marks, credits, or GP*C, you MUST sum the values from the 'PR' and 'OR' columns and report the total under the "PR/OR" component. For non-numerical values (like grades), you should represent them as a combined string, e.g., "A/B". Extract all other components as they appear.
- If a mark is an abbreviation (e.g., 'AB' for absent), extract it as a string.
- If a cell for a mark or grade is completely empty or contains a dash ('-'), you MUST NOT create an entry for that component. The corresponding array (e.g., 'marks_o', 'grade') should omit an object for that component entirely.

The response must be a JSON object with two top-level keys: 'subjects' and 'students'.

1.  'subjects': An array of objects for each subject column in the header. Each object must contain:
    *   'name': The full name of the subject (e.g., "Engineering Mathematics-IV").
    *   'code': The subject code (e.g., "ITC401").
    *   'components': An array of strings for the mark types under that subject (e.g., ["ESE", "IA", "TOT"]). The order must match the document exactly.

2.  'students': An array of objects, one for each student. Each object must contain:
    *   'name': The student's full name.
    *   'seatNo': The student's seat number.
    *   'result': The final result status (e.g., "P", "F").
    *   'totalMarks': The grand total of marks obtained by the student.
    *   'sgpi': The final SGPI (e.g., 7.22).
    *   'subjectDetails': An array of objects detailing results for each subject. Each object must have:
        *   'code': The subject code.
        *   'marks_o': An array of {component, value} pairs for the "MarksO" row.
        *   'grade': An array of {component, value} pairs for the "Grade" row.
        *   'c': An array of {component, value} pairs for the "C" (Credits) row.
        *   'gp_c': An array of {component, value} pairs for the "GP*C" row.

Example of omitting an empty component: If for a subject, the 'C' row only has a value under 'TOT', the 'c' array should be: [{"component": "TOT", "value": 3}]. The other components are not included.
Ensure every student and subject from the document is extracted with precision.`
    };

    const markComponentValueSchema = (valueType, valueDescription) => ({
        type: Type.ARRAY,
        description: `Array of component-value pairs for ${valueDescription}.`,
        items: {
            type: Type.OBJECT,
            properties: {
                component: { type: Type.STRING, description: "The mark component (e.g., 'ESE', 'TOT')." },
                value: valueType,
            },
            required: ["component", "value"]
        }
    });
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            subjects: {
                type: Type.ARRAY,
                description: "List of all subjects from the document header, in the order they appear.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "Full name of the subject, e.g., 'Engineering Mathematics-IV'." },
                        code: { type: Type.STRING, description: "Subject code, e.g., 'ITC401'." },
                        components: {
                            type: Type.ARRAY,
                            description: "Mark components for this subject in the exact order they appear in the header, e.g., ['ESE', 'IA', 'TOT'].",
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["name", "code", "components"]
                }
            },
            students: {
                type: Type.ARRAY,
                description: "List of all students and their detailed results.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "Student's full name." },
                        seatNo: { type: Type.STRING, description: "Student's seat number." },
                        result: { type: Type.STRING, description: "Final result status, typically 'P' for Pass or 'F' for Fail." },
                        totalMarks: { type: Type.NUMBER, description: "Grand total of marks obtained." },
                        sgpi: { type: Type.NUMBER, description: "Final SGPI, e.g., 7.22." },
                        subjectDetails: {
                            type: Type.ARRAY,
                            description: "Detailed breakdown of marks for each subject.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    code: { type: Type.STRING, description: "Subject code, must match a code from the main 'subjects' array." },
                                    marks_o: markComponentValueSchema({ oneOf: [{ type: Type.NUMBER }, { type: Type.STRING }] }, "the 'MarksO' row. Value can be a number or a string like 'AB' for absent."),
                                    grade: markComponentValueSchema({ type: Type.STRING }, "the 'Grade' row."),
                                    c: markComponentValueSchema({ type: Type.NUMBER }, "the 'C' (Credits) row."),
                                    gp_c: markComponentValueSchema({ type: Type.NUMBER }, "the 'GP*C' (Grade Points * Credits) row."),
                                },
                                required: ["code"]
                            }
                        }
                    },
                    required: ["name", "seatNo", "result", "totalMarks", "sgpi", "subjectDetails"]
                }
            }
        },
        required: ["subjects", "students"]
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [...imageParts, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });

        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);

    } catch (error) {
        console.error("Error processing document with Gemini:", error);
        throw new Error("Failed to extract data from the document. The AI model could not process the image or the format was unrecognized.");
    }
}