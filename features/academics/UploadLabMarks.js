import { Card } from '../../components/ui/Card.js';
import { processLabMarksImage } from '../../services/geminiService.js';

let state = {
    selectedFiles: [],
    isProcessing: false,
    lastProcessedResult: null,
};

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

const generatePdf = (data) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });
    
    if (!data || !data.students) {
        return doc;
    }

    const { subjectDetails, students: extractedStudents } = data;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SHIVAJIRAO S. JONDHALE COLLEGE OF ENGINEERING', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Sonarpada, Dombivali (E)', doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' });
    doc.setFontSize(12);
    doc.text('SUMMARY OF THEORY ATTENDANCE', 20, 45);
    doc.text(`Sem:- TE-`, doc.internal.pageSize.getWidth() - 20, 45, { align: 'right' });
    
    let subjectText = 'Subject Name & Code :-';
    if (subjectDetails.subjectName && subjectDetails.subjectName !== 'Unknown Subject') {
        subjectText += ` ${subjectDetails.subjectName}`;
        if (subjectDetails.subjectCode && subjectDetails.subjectCode !== 'UNKNOWN') {
            subjectText += ` (${subjectDetails.subjectCode})`;
        }
    }
    doc.text(subjectText, 20, 55);
    
    const head = [['Roll No.', 'NAME OF STUDENT', 'EXP1', 'T', 'EXP2', 'T', 'EXP3', 'T', 'EXP4', 'T', 'EXP5', 'T', 'EXP6', 'T', 'Avg. Marks']];
    const body = extractedStudents.map(s => {
        const avgMarks = s.avgMarks ?? '';
        return [
            s.rollNo, s.studentName,
            s.exp1 ?? '', s.exp1 ?? '',
            s.exp2 ?? '', s.exp2 ?? '',
            s.exp3 ?? '', s.exp3 ?? '',
            s.exp4 ?? '', s.exp4 ?? '',
            s.exp5 ?? '', s.exp5 ?? '',
            s.exp6 ?? '', s.exp6 ?? '',
            avgMarks,
        ];
    });

    doc.autoTable({
        head: head,
        body: body,
        startY: 65,
        theme: 'grid',
        headStyles: { fillColor: '#FFFFFF', textColor: '#000000', fontStyle: 'bold', lineWidth: 0.5, lineColor: [0,0,0] },
        styles: { fontSize: 8, cellPadding: 3, halign: 'center', lineWidth: 0.5, lineColor: [0,0,0] },
        columnStyles: { 1: { halign: 'left', cellWidth: 'auto' } },
    });
    
    return doc;
};


export function renderUploadLabMarks(rootElement, props) {
    const { students, onSaveLabMarks } = props;

    const setState = (newState, shouldRender = true) => {
        state = { ...state, ...newState };
        if (shouldRender) {
            render();
        }
    };

    const handleProcessDocument = async (files) => {
        setState({ isProcessing: true, lastProcessedResult: null });

        try {
            const imagePromises = files.map(file => 
                fileToDataUrl(file).then(dataUrl => ({
                    base64Data: dataUrl.split(',')[1],
                    mimeType: file.type
                }))
            );
            const images = await Promise.all(imagePromises);
            const result = await processLabMarksImage(images);
            
            setState({
                isProcessing: false,
                lastProcessedResult: { data: result, error: null },
                selectedFiles: [],
            });

        } catch (err) {
            setState({
                isProcessing: false,
                lastProcessedResult: { data: null, error: err.message }
            });
        }
    };

    const handleUploadPdf = () => {
        const { data } = state.lastProcessedResult;
        if (!data || !data.students) {
            alert("No data to save.");
            return;
        }

        const courseCode = data.subjectDetails.subjectCode;
        if (!courseCode || courseCode === 'UNKNOWN') {
            alert("Cannot save marks without a valid course code. Please check the uploaded document.");
            return;
        }

        const studentNameMap = new Map(students.map(s => [s.name.toLowerCase().trim(), s.id]));
        const updates = [];
        let unmappedStudents = [];

        data.students.forEach(extractedStudent => {
            const studentId = studentNameMap.get(extractedStudent.studentName.toLowerCase().trim());
            if (studentId) {
                for (let i = 1; i <= 6; i++) {
                    const expKey = `exp${i}`;
                    if (extractedStudent[expKey] !== undefined) {
                        updates.push({ studentId, markType: expKey, value: extractedStudent[expKey] });
                    }
                }
                if (extractedStudent.avgMarks !== undefined) {
                    updates.push({ studentId, markType: 'avgMarks', value: extractedStudent.avgMarks });
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
            onSaveLabMarks(courseCode, updates, pdfDataUrl);
            setState({ lastProcessedResult: null });
        } else if (unmappedStudents.length === 0) {
            alert('No new marks to save.');
        }
    };

    const renderExtractedData = () => {
        if (!state.lastProcessedResult) return '';
        const { error, data } = state.lastProcessedResult;

        if (error) {
            return Card({
                title: "Processing Failed",
                children: `<div class="p-4 bg-red-100 text-red-700 border border-red-300 rounded-lg"><p>${error}</p></div>`
            });
        }
        
        if (!data) return '';
        
        const { subjectDetails, students: extractedStudents } = data;
        
        const studentRows = extractedStudents.map(s => `
            <tr class="border-b hover:bg-gray-50">
                <td class="p-2">${s.rollNo}</td>
                <td class="p-2 font-medium">${s.studentName}</td>
                ${[...Array(6)].map((_, i) => `<td class="p-2 text-center">${s[`exp${i + 1}`] ?? '-'}</td>`).join('')}
                <td class="p-2 text-center font-bold">${s.avgMarks ?? '-'}</td>
            </tr>
        `).join('');

        return Card({
            title: `Extracted Data: ${subjectDetails.subjectName} (${subjectDetails.subjectCode})`,
            children: `
                <div class="overflow-auto border rounded-lg max-h-[500px]">
                    <table class="w-full text-left table-auto text-sm">
                        <thead class="bg-gray-100 sticky top-0">
                            <tr>
                                <th class="p-2 font-semibold">Roll No</th>
                                <th class="p-2 font-semibold">Student Name</th>
                                ${[...Array(6)].map((_, i) => `<th class="p-2 font-semibold text-center">EXP${i + 1}</th>`).join('')}
                                <th class="p-2 font-semibold text-center">Avg. Marks</th>
                            </tr>
                        </thead>
                        <tbody>${studentRows}</tbody>
                    </table>
                </div>
                <div class="mt-4 flex gap-4">
                    <button id="export-pdf-btn" class="flex-1 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">Export to PDF</button>
                    <button id="export-excel-btn" class="flex-1 bg-green-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-800">Export to Excel</button>
                    <button id="upload-pdf-btn" class="flex-1 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">Upload PDF</button>
                </div>
            `
        });
    };

    const render = () => {
         const imagePreviews = state.selectedFiles.map(file => `
            <div class="relative w-24 h-24 border rounded-md overflow-hidden">
                <img src="${URL.createObjectURL(file)}" alt="${file.name}" class="w-full h-full object-cover">
            </div>
        `).join('');

        const content = `
            <div>
                <h2 class="text-3xl font-bold text-gray-800">Upload Lab Marksheet</h2>
                <hr class="my-6"/>
                <div class="grid grid-cols-1 lg:grid-cols-5 gap-12">
                    <div class="lg:col-span-2">
                        ${Card({
                            title: "Upload Marksheet Image(s)",
                            children: `
                                <form id="upload-lab-form" class="space-y-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Marksheet File(s) (Image)</label>
                                        <div class="flex items-center">
                                            <label for="lab-file" class="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">Choose Files</label>
                                            <input type="file" id="lab-file" accept="image/png, image/jpeg, image/webp" class="sr-only" multiple/>
                                            <span id="lab-file-name" class="ml-3 text-sm text-gray-500 truncate">${state.selectedFiles.length > 1 ? `${state.selectedFiles.length} files selected` : (state.selectedFiles[0]?.name || 'No file chosen')}</span>
                                        </div>
                                    </div>
                                     ${state.selectedFiles.length > 0 ? `
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                                        <div class="flex flex-wrap gap-2 p-2 border rounded-md bg-gray-50 min-h-[6rem]">
                                            ${imagePreviews}
                                        </div>
                                    </div>` : ''}
                                    <button type="submit" class="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-800 flex items-center justify-center disabled:bg-gray-400" ${state.isProcessing || state.selectedFiles.length === 0 ? 'disabled' : ''}>
                                        ${state.isProcessing ? LoadingSpinner() + 'Processing...' : 'Upload & Process'}
                                    </button>
                                </form>
                            `
                        })}
                    </div>
                    <div class="lg:col-span-3" id="extracted-data-container">
                        ${state.lastProcessedResult ? renderExtractedData() : Card({ title: "Extracted Data", children: '<p class="text-gray-500 text-center py-8">Process a marksheet to see the extracted data here.</p>' })}
                    </div>
                </div>
            </div>
        `;
        rootElement.innerHTML = content;
        attachEventListeners();
    };

    const attachEventListeners = () => {
        document.getElementById('upload-lab-form')?.addEventListener('submit', e => {
            e.preventDefault();
            if (state.selectedFiles.length > 0) {
                handleProcessDocument(state.selectedFiles);
            }
        });

        document.getElementById('lab-file')?.addEventListener('change', e => {
            const files = Array.from(e.target.files);
            setState({ selectedFiles: files });
        });

        document.getElementById('upload-pdf-btn')?.addEventListener('click', handleUploadPdf);

        document.getElementById('export-pdf-btn')?.addEventListener('click', () => {
            const { data } = state.lastProcessedResult;
            if (!data) {
                alert("No data to export.");
                return;
            }
            const doc = generatePdf(data);
            doc.save(`${data.subjectDetails.subjectCode}-Lab-Marks.pdf`);
        });

        document.getElementById('export-excel-btn')?.addEventListener('click', () => {
            const { data } = state.lastProcessedResult;
            if (!data) {
                alert("No data to export.");
                return;
            }
            const { subjectDetails, students } = data;
            const excelData = students.map(s => ({
                'Roll No.': s.rollNo,
                'Student Name': s.studentName,
                'EXP1': s.exp1 ?? null,
                'EXP2': s.exp2 ?? null,
                'EXP3': s.exp3 ?? null,
                'EXP4': s.exp4 ?? null,
                'EXP5': s.exp5 ?? null,
                'EXP6': s.exp6 ?? null,
                'Avg. Marks': s.avgMarks ?? null,
            }));
            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Lab Marks");
            XLSX.writeFile(wb, `${subjectDetails.subjectCode}-Lab-Marks.xlsx`);
        });
    };

    render();
}