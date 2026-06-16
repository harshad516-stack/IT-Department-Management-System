import { Card } from '../../components/ui/Card.js';
import { processDocumentImage } from '../../services/geminiService.js';

// --- Component-level state that persists across re-renders ---
let state = {
    documentType: 'Consolidated Result Sheet',
    imageFiles: [],
    imageUrls: [],
    isLoading: false,
    extractedData: null,
    error: null,
    validationErrors: null,
};

const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
});

const LoadingSpinner = () => `
    <svg class="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

    data.students.forEach(student => {
        const studentIdentifier = `Student '${student.name || 'Unknown'}' (Seat No: ${student.seatNo || 'N/A'})`;

        // 1. Format Consistency Check for Result Status
        if (student.result && !['P', 'F'].includes(student.result)) {
            errors.push(`Invalid result status '${student.result}' for ${studentIdentifier}. Expected 'P' or 'F'.`);
        }

        // 2. Data Type and Range Check for SGPI
        if (typeof student.sgpi !== 'number') {
            errors.push(`SGPI for ${studentIdentifier} is not a valid number (found type: ${typeof student.sgpi}).`);
        } else if (student.sgpi < 0 || student.sgpi > 10) {
            errors.push(`SGPI for ${studentIdentifier} is out of the valid range (0-10). Found: ${student.sgpi}.`);
        }
        
        // 3. Data Type and Range check for Total Marks
        if (typeof student.totalMarks !== 'number' || student.totalMarks < 0) {
            errors.push(`Total marks for ${studentIdentifier} is not a valid positive number.`);
        }

        // 4. Detailed checks for subject marks, credits, etc.
        if (student.subjectDetails && Array.isArray(student.subjectDetails)) {
            student.subjectDetails.forEach(subjectDetail => {
                const subjectIdentifier = `in subject ${subjectDetail.code} for ${studentIdentifier}`;
                
                const checkValues = (detailArray, detailName) => {
                    if (!detailArray) return;
                    detailArray.forEach(item => {
                         if (typeof item.value === 'number' && item.value < 0) {
                            errors.push(`Negative ${detailName} value found for ${item.component} ${subjectIdentifier}.`);
                        } else if (typeof item.value !== 'number' && typeof item.value !== 'string') {
                            errors.push(`Invalid data type for ${detailName} '${item.component}' ${subjectIdentifier}.`);
                        }
                    });
                };
                
                checkValues(subjectDetail.marks_o, 'mark');
                checkValues(subjectDetail.c, 'credit');
                checkValues(subjectDetail.gp_c, 'GP*C');
            });
        }
    });

    return errors;
};


export function renderDocumentAI(rootElement, props) {
    const { onSaveFinalResults, finalResultsStatus } = props;

    const setState = (newState) => {
        state = { ...state, ...newState };
        render();
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
             // Clean up old object URLs to prevent memory leaks
            state.imageUrls.forEach(url => URL.revokeObjectURL(url));

            const urls = files.map(f => URL.createObjectURL(f));
            setState({
                imageFiles: files,
                imageUrls: urls,
                isLoading: false,
                extractedData: null,
                error: null,
                validationErrors: null,
            });
        }
    };

    const handleProcessDocument = async () => {
        if (state.imageFiles.length === 0) return;

        setState({ isLoading: true, error: null, extractedData: null, validationErrors: null });

        try {
            const imagePromises = state.imageFiles.map(file => 
                fileToBase64(file).then(base64Data => ({
                    base64Data,
                    mimeType: file.type
                }))
            );
            const images = await Promise.all(imagePromises);
            const result = await processDocumentImage(images);
            const validationIssues = validateExtractedData(result);
            setState({ extractedData: result, isLoading: false, validationErrors: validationIssues });
        } catch (err) {
            setState({ error: err.message, isLoading: false, validationErrors: null });
        }
    };

    const handleExportExcel = () => {
        if (!state.extractedData || !state.extractedData.students) {
             alert("No data to export.");
            return;
        }

        const { subjects, students } = state.extractedData;
        const aoa = []; // array of arrays

        // Header Row 1
        const header1 = ["Student Details"];
        subjects.forEach(subject => {
            header1.push(`${subject.name} (${subject.code})`);
            // Add null placeholders for merging
            for (let i = 1; i < subject.components.length; i++) header1.push(null);
        });
        header1.push('Total', 'SGPI');
        
        // Header Row 2
        const header2 = [""];
        subjects.forEach(subject => {
            subject.components.forEach(comp => header2.push(comp));
        });
        header2.push('', '');

        aoa.push(header1, header2);
        
        // Data Rows
        students.forEach(student => {
            // Student Info row
            const studentInfoRow = [`${student.name.toUpperCase()} (Seat No: ${student.seatNo}) - Result: ${student.result}`];
            for(let i = 1; i < header2.length; i++) studentInfoRow.push(null);
            aoa.push(studentInfoRow);

            const rowTypes = ['marks_o', 'grade', 'c', 'gp_c'];
            const rowLabels = { 'marks_o': 'MarksO', 'grade': 'Grade', 'c': 'C', 'gp_c': 'GP*C' };
            
            rowTypes.forEach(type => {
                const row = [rowLabels[type]];
                subjects.forEach(subject => {
                     const studentSubjectData = student.subjectDetails.find(sd => sd.code === subject.code);
                     subject.components.forEach(comp => {
                        let value = null; // Use null for empty cells in Excel
                        if (studentSubjectData && studentSubjectData[type]) {
                            const componentData = studentSubjectData[type].find(item => item.component === comp);
                            if (componentData !== undefined) value = componentData.value;
                        }
                        row.push(value);
                     });
                });
                if (type === 'marks_o') {
                    row.push(student.totalMarks, student.sgpi);
                } else {
                    row.push(null, null);
                }
                aoa.push(row);
            });
        });

        const ws = XLSX.utils.aoa_to_sheet(aoa);

        // Define merges
        const merges = [];
        let col = 1;
        subjects.forEach(subject => {
            if (subject.components.length > 1) {
                merges.push({ s: { r: 0, c: col }, e: { r: 0, c: col + subject.components.length - 1 } });
            }
            col += subject.components.length;
        });

        let studentRowIndex = 2;
        students.forEach(() => {
            merges.push({ s: { r: studentRowIndex, c: 0 }, e: { r: studentRowIndex, c: header2.length - 1 } });
            studentRowIndex += (rowTypes.length + 1);
        });

        ws['!merges'] = merges;
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Extracted Results");
        XLSX.writeFile(wb, "extracted-final-marks.xlsx");
    };

    const renderValidationResult = () => {
        if (state.validationErrors === null || !state.extractedData) {
            return '';
        }

        if (state.validationErrors.length === 0) {
            return `
                <div class="p-4 bg-green-100 text-green-800 border border-green-300 rounded-lg mb-4">
                    <p class="font-bold flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
                        Validation Successful!
                    </p>
                    <p class="text-sm mt-1">All extracted data meets the required format and constraints.</p>
                </div>
            `;
        }

        return `
            <div class="p-4 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-lg mb-4">
                <p class="font-bold flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 3.001-1.742 3.001H4.42c-1.53 0-2.493-1.667-1.743-3.001l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                    Data Validation Issues Found
                </p>
                <ul class="list-disc list-inside mt-2 text-sm space-y-1 max-h-40 overflow-y-auto">
                    ${state.validationErrors.map(err => `<li>${err}</li>`).join('')}
                </ul>
            </div>
        `;
    };

    const renderExtractedDataTable = () => {
        if (!state.extractedData || !state.extractedData.students || state.extractedData.students.length === 0) {
            return `<div class="flex items-center justify-center min-h-[300px] bg-gray-50 border rounded-lg">
                        <span class="text-gray-500">Results will be displayed here after processing.</span>
                    </div>`;
        }

        const { subjects, students } = state.extractedData;
        const allComponentHeaders = subjects.flatMap(s => s.components);

        const headerRow1 = `
            <tr>
                <th rowspan="2" class="p-2 font-semibold text-gray-700 bg-gray-100 border-b-2 border-r sticky left-0 z-10 w-[240px]">Student Details</th>
                ${subjects.map(s => `<th colspan="${s.components.length}" class="p-2 font-semibold text-gray-700 border-b-2 border-r text-center">${s.name}<br>(${s.code})</th>`).join('')}
                <th rowspan="2" class="p-2 font-semibold text-gray-700 border-b-2 border-r">Total</th>
                <th rowspan="2" class="p-2 font-semibold text-gray-700 border-b-2">SGPI</th>
            </tr>
        `;

        const headerRow2 = `
            <tr>
                ${allComponentHeaders.map(comp => `<th class="p-2 font-semibold text-gray-500 border-b-2 border-r text-xs text-center">${comp}</th>`).join('')}
            </tr>
        `;

        const studentRows = students.map(student => {
            const studentInfoRow = `
                <tr class="border-b bg-gray-100 hover:bg-gray-200 group">
                    <td colspan="${allComponentHeaders.length + 3}" class="p-2 border-r sticky left-0 bg-gray-100 group-hover:bg-gray-200 font-bold">
                        ${student.name.toUpperCase()} (Seat No: ${student.seatNo}) - Result: 
                        <span class="${student.result === 'P' ? 'text-green-600' : 'text-red-600'}">${student.result}</span>
                    </td>
                </tr>
            `;

            const rowTypes = ['marks_o', 'grade', 'c', 'gp_c'];
            const rowLabels = { 'marks_o': 'MarksO', 'grade': 'Grade', 'c': 'C', 'gp_c': 'GP*C' };

            const dataRows = rowTypes.map(type => {
                const cells = subjects.flatMap(subject => {
                    const studentSubjectData = student.subjectDetails.find(sd => sd.code === subject.code);
                    return subject.components.map(comp => {
                        let value = '-';
                        if (studentSubjectData && studentSubjectData[type]) {
                            const componentData = studentSubjectData[type].find(item => item.component === comp);
                            if (componentData !== undefined) {
                                value = componentData.value;
                            }
                        }
                        return `<td class="p-1 text-center border-r">${value}</td>`;
                    });
                }).join('');

                let summaryCells = `<td></td><td></td>`; // Placeholders for Total and SGPI
                if (type === 'marks_o') {
                    summaryCells = `<td class="p-1 text-center border-r font-bold">${student.totalMarks}</td><td class="p-1 text-center font-bold">${student.sgpi}</td>`;
                }

                return `<tr class="border-b hover:bg-blue-50 group">
                    <td class="p-2 border-r sticky left-0 bg-white group-hover:bg-blue-50 font-semibold">${rowLabels[type]}</td>
                    ${cells}
                    ${summaryCells}
                </tr>`;
            }).join('');

            return studentInfoRow + dataRows;
        }).join('');

        return `
            <div class="overflow-auto border rounded-lg max-h-[500px]">
                <table class="w-full text-left table-auto border-collapse text-sm">
                    <thead class="bg-gray-100 sticky top-0 z-20">
                        ${headerRow1}
                        ${headerRow2}
                    </thead>
                    <tbody>${studentRows}</tbody>
                </table>
            </div>
        `;
    };

    const render = () => {
        const isGloballySaved = finalResultsStatus.saved;
        
        const imagePreviews = state.imageUrls.map((url, index) => `
            <div class="relative w-full h-auto border rounded-md overflow-hidden shadow-sm">
                <img src="${url}" alt="Preview ${index + 1}" class="w-full h-auto object-contain">
            </div>
        `).join('');

        const content = Card({
            title: "Upload Final Marksheet",
            children: `
                <p class="text-gray-600 mb-6">Upload one or more pages of a consolidated marksheet image to automatically extract structured data using AI.</p>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <!-- Left Column: Inputs -->
                    <div class="space-y-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">1. Select Document Type</label>
                            <select class="w-full p-2 border border-gray-300 rounded-lg bg-gray-50">
                                <option>${state.documentType}</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">2. Upload Document Image(s)</label>
                            <input type="file" id="image-upload" accept="image/png, image/jpeg, image/webp" class="w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0
                                file:text-sm file:font-semibold file:bg-blue-50 file:text-primary
                                hover:file:bg-blue-100 cursor-pointer" multiple/>
                        </div>
                        
                        <div class="relative w-full min-h-[200px] bg-gray-100 border-2 border-dashed rounded-lg flex items-center justify-center p-2">
                            ${state.imageUrls.length > 0 ? `
                                <div class="w-full max-h-80 overflow-y-auto space-y-2">
                                    ${imagePreviews}
                                </div>
                            ` : `<span class="text-gray-500">Image previews will appear here</span>`}
                            
                            ${state.isLoading ? `
                                <div class="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center rounded-md">
                                    ${LoadingSpinner()}
                                    <span class="text-white font-semibold mt-4">Processing image with AI...</span>
                                </div>
                            ` : ''}
                        </div>

                        <button id="process-doc-btn" 
                            class="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-lg"
                            ${state.imageFiles.length === 0 || state.isLoading ? 'disabled' : ''}>
                            ${state.isLoading ? 'Processing...' : `Process ${state.imageFiles.length} Image(s)`}
                        </button>
                    </div>

                    <!-- Right Column: Output -->
                    <div class="space-y-4">
                        <div class="flex justify-between items-center border-b pb-2">
                             <h3 class="text-lg font-semibold text-gray-800">Extracted Data</h3>
                             ${state.extractedData ? `
                                <div class="flex gap-2">
                                     <button id="export-excel-btn" class="bg-green-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-800 transition-colors text-sm flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v1h-2V6H4v12h12v-1h2v1a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /><path d="M8 12h4v2H8v-2z" /><path d="M10.5 2.5a.5.5 0 00-1 0V3h-2v1h2v1.5a.5.5 0 001 0V4h2V3h-2V2.5z" clip-rule="evenodd" /></svg>
                                        Export to Excel
                                    </button>
                                    <button id="export-pdf-btn" class="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        Export to PDF
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                       
                        ${state.error ? `
                            <div class="p-4 bg-red-100 text-red-700 border border-red-300 rounded-lg">
                                <p class="font-bold">An error occurred:</p>
                                <p>${state.error}</p>
                            </div>
                        ` : ''}
                        
                        ${renderValidationResult()}
                        ${renderExtractedDataTable()}
                       
                        ${state.extractedData ? `
                            <button id="save-final-results-btn" class="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400" ${isGloballySaved || (state.validationErrors && state.validationErrors.length > 0) ? 'disabled' : ''}>
                                ${isGloballySaved ? 'Saved to System' : 'Save Extracted Data to System'}
                            </button>
                        ` : ''}
                    </div>
                </div>
            `
        });

        rootElement.innerHTML = content;
        attachEventListeners();
    };

    const attachEventListeners = () => {
        document.getElementById('image-upload')?.addEventListener('change', handleFileChange);
        document.getElementById('process-doc-btn')?.addEventListener('click', handleProcessDocument);
        
        document.getElementById('save-final-results-btn')?.addEventListener('click', () => {
            if (state.extractedData && state.validationErrors.length === 0) {
                onSaveFinalResults(state.extractedData);
            } else if (state.validationErrors && state.validationErrors.length > 0) {
                alert('Cannot save data with validation issues. Please check the extracted data or the source document.');
            } else {
                alert('No data to save.');
            }
        });
        
        document.getElementById('export-excel-btn')?.addEventListener('click', handleExportExcel);

        document.getElementById('export-pdf-btn')?.addEventListener('click', () => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'landscape', unit: 'pt' });

            if (!state.extractedData || !state.extractedData.students || state.extractedData.students.length === 0) {
                alert("No data to export.");
                return;
            }

            const { subjects, students } = state.extractedData;

            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text("Consolidated Result Sheet", doc.internal.pageSize.getWidth() / 2, 40, { align: 'center' });

            const allComponentHeaders = subjects.flatMap(s => s.components);
            
            const headRow1 = [{ content: '', styles: { halign: 'center' } }];
            subjects.forEach(s => {
                headRow1.push({
                    content: `${s.name}\n(${s.code})`,
                    colSpan: s.components.length,
                });
            });
            headRow1.push({ content: 'Total', rowSpan: 2 });
            headRow1.push({ content: 'SGPI', rowSpan: 2 });

            const headRow2 = [{ content: '' }];
            headRow2.push(...allComponentHeaders.map(comp => ({ content: comp })));
            
            const body = [];
            students.forEach(student => {
                body.push([{
                    content: `Student: ${student.name.toUpperCase()} (Seat No: ${student.seatNo}) - Result: ${student.result}`,
                    colSpan: allComponentHeaders.length + 3,
                }]);

                const rowTypes = ['marks_o', 'grade', 'c', 'gp_c'];
                const rowLabels = { 'marks_o': 'MarksO', 'grade': 'Grade', 'c': 'C', 'gp_c': 'GP*C' };

                rowTypes.forEach(type => {
                    const rowData = [{ content: rowLabels[type] }];
                    subjects.forEach(subject => {
                        const studentSubjectData = student.subjectDetails.find(sd => sd.code === subject.code);
                        subject.components.forEach(comp => {
                            let value = '-';
                            if (studentSubjectData && studentSubjectData[type]) {
                                const componentData = studentSubjectData[type].find(item => item.component === comp);
                                if (componentData !== undefined) {
                                    value = componentData.value;
                                }
                            }
                            rowData.push({ content: String(value) });
                        });
                    });
                    
                    if (type === 'marks_o') {
                        rowData.push({ content: student.totalMarks });
                        rowData.push({ content: student.sgpi });
                    } else {
                        rowData.push({ content: '' });
                        rowData.push({ content: '' });
                    }
                    body.push(rowData);
                });
            });

            doc.autoTable({
                head: [headRow1, headRow2],
                body: body,
                startY: 60,
                theme: 'grid',
                styles: { 
                    fontSize: 7, 
                    cellPadding: 3, 
                    lineWidth: 0.5, 
                    lineColor: [156, 163, 175] 
                },
                headStyles: { 
                    halign: 'center', 
                    valign: 'middle', 
                    fontStyle: 'bold', 
                    fontSize: 6.5,
                    textColor: '#1F2937', 
                    fillColor: '#F3F4F6' 
                },
                columnStyles: { 
                    0: { fontStyle: 'bold', cellWidth: 55, halign: 'left' },
                    [allComponentHeaders.length + 1]: { fontStyle: 'bold', halign: 'center' },
                    [allComponentHeaders.length + 2]: { fontStyle: 'bold', halign: 'center' },
                },
                didParseCell: function (data) {
                    // Apply specific styling to match the image visual
                    if (data.row.section === 'head' && data.row.index === 0 && data.column.index > 0) {
                        const cell = headRow1[data.column.dataKey];
                        if (cell && cell.colSpan) {
                             data.cell.styles.fillColor = '#1E40AF';
                             data.cell.styles.textColor = '#FFFFFF';
                        }
                    }
                    
                    if (data.row.section === 'body' && data.cell.raw.colSpan) {
                        data.cell.styles.fillColor = '#DBEAFE';
                        data.cell.styles.textColor = '#1E40AF';
                        data.cell.styles.fontStyle = 'bold';
                        data.cell.styles.fontSize = 8;
                    }
                    
                    const totalColumnIndex = allComponentHeaders.length + 1;
                    const sgpiColumnIndex = allComponentHeaders.length + 2;

                    if (data.row.section === 'body' && (data.column.index === totalColumnIndex || data.column.index === sgpiColumnIndex)) {
                         if (!data.cell.raw.colSpan) {
                            data.cell.styles.fillColor = '#EFF6FF';
                            data.cell.styles.fontStyle = 'bold';
                         }
                    }

                     // Align all body cells to center except the first column
                    if (data.row.section === 'body' && data.column.index > 0) {
                        data.cell.styles.halign = 'center';
                    }
                }
            });

            doc.save('Consolidated-Result-Sheet.pdf');
        });
    };

    render();
}