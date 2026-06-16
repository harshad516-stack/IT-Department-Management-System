import { Card } from '../../components/ui/Card.js';
import { processInternalMarksImage } from '../../services/geminiService.js';

// --- Component-level state that persists across re-renders ---
let state = {
    uploadedResults: new Map(),
    selectedCourse: '',
    selectedFiles: [],
    isProcessing: false,
    lastProcessedResult: null,
};

// Helper functions & components
const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});


const LoadingSpinner = () => `
    <svg class="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
`;

const validateExtractedData = (data) => {
    const errors = [];
    if (!data || !data.students || !Array.isArray(data.students)) {
        errors.push("Validation Error: The extracted data does not contain a valid 'students' array.");
        return errors;
    }
    if (!data.courseDetails || !data.courseDetails.courseCode || !data.courseDetails.courseName) {
        errors.push("Validation Error: Missing course details from the extracted data.");
    }

    data.students.forEach(student => {
        const studentIdentifier = `Student '${student.studentName || 'Unknown'}' (ID: ${student.studentId || 'N/A'})`;
        
        const checkMark = (mark, markName) => {
            if (mark !== undefined) {
                if (typeof mark !== 'number') {
                    errors.push(`Invalid ${markName} for ${studentIdentifier}: not a number.`);
                } else if (mark < 0) {
                    errors.push(`Negative ${markName} found for ${studentIdentifier}.`);
                }
            }
        };

        checkMark(student.unitTest1, 'Unit Test 1');
        checkMark(student.unitTest2, 'Unit Test 2');
        checkMark(student.final, 'Final');
    });

    return errors;
};

const generatePdf = (data) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait' });
    
    if (!data || !data.students || data.students.length === 0) {
        return doc; // Return an empty doc if no data
    }

    const { courseDetails, students } = data;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`${courseDetails.courseName} (${courseDetails.courseCode})`, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const generationDate = new Date().toLocaleDateString('en-GB');
    doc.text(`Generated on: ${generationDate}`, doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
    
    const head = [['Student ID', 'Student Name', 'Unit Test 1', 'Unit Test 2', 'Average', 'Signature']];
    const body = students.map(student => {
        const ut1 = student.unitTest1;
        const ut2 = student.unitTest2;
        let average = '';
        
        if (ut1 !== undefined && ut2 !== undefined) {
            average = Math.round((ut1 + ut2) / 2);
        } else if (ut1 !== undefined) {
            average = ut1;
        } else if (ut2 !== undefined) {
            average = ut2;
        }

        return [
            student.studentId,
            student.studentName,
            ut1 ?? '',
            ut2 ?? '',
            average,
            '' // Empty signature column
        ];
    });

    doc.autoTable({
        head: head,
        body: body,
        startY: 40,
        theme: 'grid',
        headStyles: {
            fillColor: '#1E40AF',
            textColor: '#FFFFFF',
            fontStyle: 'bold',
        },
        styles: {
            fontSize: 9,
            cellPadding: 4,
            halign: 'center',
        },
        columnStyles: {
            1: { halign: 'left', cellWidth: 'auto' },
        }
    });

    return doc;
};


export function renderUploadResults(rootElement, props) {
    const { courses, onSaveInternalMarks, uploadedMarksheets } = props;

    const setState = (newState, shouldRender = true) => {
        state = { ...state, ...newState };
        if (shouldRender) {
            render();
        }
    };
    
    const renderExtractedData = () => {
        if (!state.lastProcessedResult) return '';

        const { error, data, validationErrors, courseCode } = state.lastProcessedResult;

        if (error) {
            return Card({
                title: "Processing Failed",
                children: `
                    <div class="p-4 bg-red-100 text-red-700 border border-red-300 rounded-lg">
                        <p class="font-bold">An error occurred during processing:</p>
                        <p>${error}</p>
                    </div>
                `
            });
        }
        
        if (!data) return '';

        const renderValidationResult = () => {
            if (!validationErrors) return '';
            if (validationErrors.length === 0) {
                return `<div class="p-4 bg-green-100 text-green-800 border border-green-300 rounded-lg mb-4">
                    <p class="font-bold flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
                        Validation Successful!
                    </p>
                </div>`;
            }
            return `<div class="p-4 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-lg mb-4">
                <p class="font-bold flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 3.001-1.742 3.001H4.42c-1.53 0-2.493-1.667-1.743-3.001l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                    Data Validation Issues Found
                </p>
                <ul class="list-disc list-inside mt-2 text-sm space-y-1">${validationErrors.map(err => `<li>${err}</li>`).join('')}</ul>
            </div>`;
        };

        const renderTable = () => {
            const { students } = data;
            const studentRows = students.map(student => {
                const ut1 = student.unitTest1;
                const ut2 = student.unitTest2;
                let average = '';
                if (ut1 !== undefined && ut2 !== undefined) {
                    average = Math.round((ut1 + ut2) / 2);
                } else if (ut1 !== undefined) {
                    average = ut1;
                } else if (ut2 !== undefined) {
                    average = ut2;
                }

                return `<tr class="border-b hover:bg-gray-50">
                    <td class="p-2">${student.studentId}</td>
                    <td class="p-2 font-medium">${student.studentName}</td>
                    <td class="p-2 text-center">${ut1 ?? '-'}</td>
                    <td class="p-2 text-center">${ut2 ?? '-'}</td>
                    <td class="p-2 text-center">${student.final ?? '-'}</td>
                    <td class="p-2 text-center font-semibold">${average}</td>
                </tr>`;
            }).join('');
            
            return `<div class="overflow-auto border rounded-lg max-h-[500px]">
                        <table class="w-full text-left table-auto text-sm">
                            <thead class="bg-gray-100 sticky top-0">
                                <tr>
                                    <th class="p-2 font-semibold">Student ID</th>
                                    <th class="p-2 font-semibold">Student Name</th>
                                    <th class="p-2 font-semibold text-center">Unit Test 1</th>
                                    <th class="p-2 font-semibold text-center">Unit Test 2</th>
                                    <th class="p-2 font-semibold text-center">Final</th>
                                    <th class="p-2 font-semibold text-center">Average</th>
                                </tr>
                            </thead>
                            <tbody>${studentRows}</tbody>
                        </table>
                    </div>`;
        };
        
        const course = props.courses.find(c => c.code === courseCode);
        const isSaved = course ? course.internalMarksSaved : false;
        
        const saveButton = isSaved
            ? `<button class="flex-1 bg-gray-500 text-white font-bold py-2 px-4 rounded-lg cursor-not-allowed" disabled>Uploaded to System</button>`
            : `<button id="upload-pdf-btn" class="flex-1 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors ${validationErrors && validationErrors.length > 0 ? 'disabled:bg-gray-400' : ''}" ${validationErrors && validationErrors.length > 0 ? 'disabled' : ''}>Upload PDF</button>`;

        return Card({
            title: `Extracted Data for ${data.courseDetails?.courseName || 'Unknown'} (${data.courseDetails?.courseCode || 'N/A'})`,
            children: `
                ${renderValidationResult()}
                ${validationErrors && validationErrors.length > 0 ? '' : renderTable()}
                <div class="mt-4 flex gap-4">
                    <button id="export-pdf-btn" class="flex-1 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">Export to PDF</button>
                    <button id="export-excel-btn" class="flex-1 bg-green-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-800">Export to Excel</button>
                    ${saveButton}
                </div>
            `
        });
    };
    
    const render = () => {
        const courseOptions = courses
            .filter(c => !c.internalMarksSaved)
            .map(course => `<option value="${course.code}" ${state.selectedCourse === course.code ? 'selected' : ''}>${course.name} (${course.code})</option>`)
            .join('');

        const resultStatusRows = courses.map(course => {
            const isGloballySaved = course.internalMarksSaved;
            const uploadedMarksheetUrl = uploadedMarksheets[course.code];
            const resultInfo = state.uploadedResults.get(course.code) || { status: 'Pending' };
            let statusBadge;
            let actionLink;
            
            if (isGloballySaved && uploadedMarksheetUrl) {
                statusBadge = '<span class="px-2 py-1 text-xs font-semibold text-white bg-blue-600 rounded-md">Saved</span>';
                actionLink = `<a href="${uploadedMarksheetUrl}" class="text-sm text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">View Saved Marksheet</a>`;
            } else {
                switch(resultInfo.status) {
                    case 'Processed': 
                        statusBadge = '<span class="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-md">Processed</span>'; 
                        break;
                    case 'Processing': 
                        statusBadge = '<span class="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-md">Processing...</span>'; 
                        break;
                    case 'Error': 
                        statusBadge = '<span class="px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded-md">Error</span>'; 
                        break;
                    default: 
                        statusBadge = '<span class="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-md">Pending</span>'; 
                        break;
                }
                actionLink = resultInfo.url 
                    ? `<a href="${resultInfo.url}" class="text-sm text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">View Uploaded</a>`
                    : '<span class="text-sm text-gray-400">N/A</span>';
            }

            return `
                <tr class="border-b last:border-b-0 hover:bg-gray-50">
                    <td class="px-4 py-3">${course.code}</td>
                    <td class="px-4 py-3 font-medium text-gray-800">${course.name}</td>
                    <td class="px-4 py-3">${statusBadge}</td>
                    <td class="px-4 py-3">${actionLink}</td>
                </tr>
            `;
        }).join('');

        const imagePreviews = state.selectedFiles.map(file => `
            <div class="relative w-24 h-24 border rounded-md overflow-hidden">
                <img src="${URL.createObjectURL(file)}" alt="${file.name}" class="w-full h-full object-cover">
            </div>
        `).join('');

        const content = `
            <div>
                <h2 class="text-3xl font-bold text-gray-800">Upload Result</h2>
                <hr class="my-6"/>
                <div class="grid grid-cols-1 lg:grid-cols-5 gap-12">
                    <div class="lg:col-span-2 space-y-6">
                        ${Card({
                            title: "Upload New Result Sheet",
                            children: `
                                <form id="upload-result-form" class="space-y-4">
                                    <div>
                                        <label for="course-select-result" class="block text-sm font-medium text-gray-700 mb-1">Select Course</label>
                                        <select id="course-select-result" name="course" required class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                                            <option value="">-- Choose a course --</option>
                                            ${courseOptions}
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Result File(s) (Image)</label>
                                        <div class="flex items-center">
                                            <label for="result-file" class="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Choose Files</label>
                                            <input type="file" id="result-file" accept="image/png, image/jpeg, image/webp" class="sr-only" multiple/>
                                            <span id="result-file-name-display" class="ml-3 text-sm text-gray-500 truncate">${state.selectedFiles.length > 1 ? `${state.selectedFiles.length} files selected` : (state.selectedFiles[0]?.name || 'No file chosen')}</span>
                                        </div>
                                    </div>
                                    ${state.selectedFiles.length > 0 ? `
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                                        <div class="flex flex-wrap gap-2 p-2 border rounded-md bg-gray-50 min-h-[6rem]">
                                            ${imagePreviews}
                                        </div>
                                    </div>` : ''}
                                    <button type="submit" class="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-800 transition-colors text-base flex items-center justify-center disabled:bg-gray-400" ${state.isProcessing || state.selectedFiles.length === 0 ? 'disabled' : ''}>
                                        ${state.isProcessing ? LoadingSpinner() + 'Processing...' : 'Upload & Process Result'}
                                    </button>
                                </form>
                            `
                        })}
                         ${Card({
                            title: "Result Upload Status",
                            children: `
                                <div class="overflow-x-auto">
                                    <table class="w-full text-left table-auto">
                                        <thead class="bg-gray-50 border-b">
                                            <tr>
                                                <th class="px-4 py-3 font-semibold text-gray-600">Code</th>
                                                <th class="px-4 py-3 font-semibold text-gray-600">Name</th>
                                                <th class="px-4 py-3 font-semibold text-gray-600">Status</th>
                                                <th class="px-4 py-3 font-semibold text-gray-600">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>${resultStatusRows}</tbody>
                                    </table>
                                </div>`
                         })}
                    </div>
                    <div class="lg:col-span-3" id="extracted-data-container">
                        ${state.lastProcessedResult ? renderExtractedData() : Card({ title: "Extracted Data", children: '<p class="text-gray-500 text-center py-8">Process a result sheet to see the extracted data here.</p>' })}
                    </div>
                </div>
            </div>
        `;
        rootElement.innerHTML = content;
        attachEventListeners();
    };

    const handleProcessDocument = async (courseCode, files) => {
        // For simplicity, we create a composite entry for display.
        const fileURLs = files.map(file => URL.createObjectURL(file));
        state.uploadedResults.set(courseCode, { files, url: fileURLs[0], status: 'Processing' });
        setState({ isProcessing: true, lastProcessedResult: null });

        try {
            const imagePromises = files.map(file => 
                fileToDataUrl(file).then(dataUrl => ({
                    base64Data: dataUrl.split(',')[1],
                    mimeType: file.type
                }))
            );

            const images = await Promise.all(imagePromises);
            const result = await processInternalMarksImage(images);
            const validationIssues = validateExtractedData(result);

            const currentUpload = state.uploadedResults.get(courseCode);
            state.uploadedResults.set(courseCode, {
                ...currentUpload,
                status: 'Processed',
                data: result,
                validationErrors: validationIssues
            });
            
            setState({
                isProcessing: false,
                lastProcessedResult: { courseCode, data: result, validationErrors: validationIssues, error: null },
                selectedFiles: [],
                selectedCourse: '',
            });

        } catch (err) {
            const currentUpload = state.uploadedResults.get(courseCode);
            state.uploadedResults.set(courseCode, {
                ...currentUpload,
                status: 'Error',
                error: err.message
            });
            setState({
                isProcessing: false,
                lastProcessedResult: { courseCode, data: null, validationErrors: null, error: err.message }
            });
        }
    };

    const handleUploadPdf = () => {
        const { data, courseCode } = state.lastProcessedResult;
        if (!data || !data.students) {
            alert("No data to save.");
            return;
        }

        const studentNameMap = new Map(props.students.map(s => [s.name.toLowerCase().trim(), s.id]));

        const updates = [];
        let unmappedStudents = [];

        data.students.forEach(extractedStudent => {
            const studentId = studentNameMap.get(extractedStudent.studentName.toLowerCase().trim());
            if (studentId) {
                if (extractedStudent.unitTest1 !== undefined) {
                    updates.push({ studentId, courseCode, markType: 'unitTest1', value: extractedStudent.unitTest1 });
                }
                if (extractedStudent.unitTest2 !== undefined) {
                    updates.push({ studentId, courseCode, markType: 'unitTest2', value: extractedStudent.unitTest2 });
                }
                if (extractedStudent.final !== undefined) {
                    updates.push({ studentId, courseCode, markType: 'final', value: extractedStudent.final });
                }
            } else {
                unmappedStudents.push(extractedStudent.studentName);
            }
        });

        if (unmappedStudents.length > 0) {
            alert(`Warning: Could not find the following students in the system. Their marks were not saved:\n- ${unmappedStudents.join('\n- ')}`);
        }

        if (updates.length > 0) {
            const doc = generatePdf(data);
            const pdfDataUrl = doc.output('datauristring');
            onSaveInternalMarks(courseCode, updates, pdfDataUrl);
            setState({ lastProcessedResult: null }); // Clear the view after saving
        } else if (unmappedStudents.length === 0) {
            alert('No new marks to save.');
        }
    };

    const attachEventListeners = () => {
        document.getElementById('upload-result-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const courseCode = state.selectedCourse;
            if (!courseCode || state.selectedFiles.length === 0) {
                alert('Please select a course and at least one result image file.');
                return;
            }
            handleProcessDocument(courseCode, state.selectedFiles);
        });

        document.getElementById('course-select-result')?.addEventListener('change', (e) => {
            setState({ selectedCourse: e.target.value }, false); // Don't re-render just for this
        });

        document.getElementById('result-file')?.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            setState({ selectedFiles: files }); // Re-render to show previews
        });

        document.getElementById('upload-pdf-btn')?.addEventListener('click', handleUploadPdf);

        document.getElementById('export-pdf-btn')?.addEventListener('click', () => {
            const { data } = state.lastProcessedResult;
            if (!data) {
                alert("No data to export.");
                return;
            }
            const doc = generatePdf(data);
            doc.save(`${data.courseDetails.courseCode}-Internal-Marks.pdf`);
        });

        document.getElementById('export-excel-btn')?.addEventListener('click', () => {
            const { data } = state.lastProcessedResult;
            if (!data) {
                alert("No data to export.");
                return;
            }
            const { courseDetails, students } = data;
            const excelData = students.map(student => {
                const ut1 = student.unitTest1;
                const ut2 = student.unitTest2;
                let average = '';
                if (ut1 !== undefined && ut2 !== undefined) average = Math.round((ut1 + ut2) / 2);
                else if (ut1 !== undefined) average = ut1;
                else if (ut2 !== undefined) average = ut2;

                return {
                    'Student ID': student.studentId,
                    'Student Name': student.studentName,
                    'Unit Test 1': ut1 ?? null,
                    'Unit Test 2': ut2 ?? null,
                    'Final': student.final ?? null,
                    'Average': average,
                };
            });

            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Internal Marks");
            XLSX.writeFile(wb, `${courseDetails.courseCode}-Internal-Marks.xlsx`);
        });
    };
    render();
}