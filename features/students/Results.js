import { Card } from '../../components/ui/Card.js';

export function renderResults(rootElement, { user, students, courses, uploadedMarksheets, uploadedAssignmentMarksheets, uploadedLabMarksheets, uploadedFinalMarksheets }) {
    const currentUserStudent = students.find(s => s.name === user.name);

    if (!currentUserStudent) {
        rootElement.innerHTML = Card({
            title: "My Results",
            children: `
                <div class="text-center text-gray-500 py-8">
                    <h2 class="text-2xl font-semibold mb-2">Student Profile Not Found</h2>
                    <p>Your student profile has not been created by the administration yet. Please check back later.</p>
                </div>
            `
        });
        return;
    }

    const hasAssessmentData = (
        (currentUserStudent.subjectMarks && Object.keys(currentUserStudent.subjectMarks).length > 0) ||
        Object.keys(uploadedMarksheets).length > 0 ||
        Object.keys(uploadedAssignmentMarksheets).length > 0 ||
        Object.keys(uploadedLabMarksheets).length > 0
    );
    const hasFinalResults = !!currentUserStudent.finalResults;

    let activeTab = hasFinalResults ? 'final' : 'assessment';

    if (!hasAssessmentData && !hasFinalResults) {
        rootElement.innerHTML = Card({
            title: "My Results",
            children: `
                <div class="text-center text-gray-500 py-8">
                    <h2 class="text-2xl font-semibold mb-2">Results Not Published</h2>
                    <p>Your results for the current semester have not been published yet. Please check back later.</p>
                </div>
            `
        });
        return;
    }

    const handleExportPdf = () => {
        if (!currentUserStudent || !currentUserStudent.finalResults) return;
        const { subjects, subjectDetails, totalMarks, sgpi } = currentUserStudent.finalResults;
        const subjectMap = new Map(subjects.map(s => [s.code, s.name]));
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text(`Result for ${currentUserStudent.name}`, 14, 22);
        doc.setFontSize(12);
        doc.text(`Total Marks: ${totalMarks}`, 14, 32);
        doc.text(`SGPI: ${sgpi.toFixed(2)}`, 14, 40);

        const head = [['Course', 'ESE', 'IA', 'TW', 'PR/OR', 'Total Marks', 'Grade']];
        const body = subjectDetails.map(detail => {
             const getComponentValue = (arr, comp) => arr?.find(item => item.component === comp)?.value ?? '-';
             const pr_or = getComponentValue(detail.marks_o, 'PR/OR') || getComponentValue(detail.marks_o, 'PR') || getComponentValue(detail.marks_o, 'OR');
             return [
                 subjectMap.get(detail.code) || detail.code,
                 getComponentValue(detail.marks_o, 'ESE'),
                 getComponentValue(detail.marks_o, 'IA'),
                 getComponentValue(detail.marks_o, 'TW'),
                 pr_or,
                 getComponentValue(detail.marks_o, 'TOT'),
                 getComponentValue(detail.grade, 'TOT')
             ];
        });

        doc.autoTable({ head, body, startY: 50 });
        doc.save(`${currentUserStudent.id}-final-result.pdf`);
    };
    
    const handleExportExcel = () => {
        if (!currentUserStudent || !currentUserStudent.finalResults) return;
        const { subjects, subjectDetails, totalMarks, sgpi } = currentUserStudent.finalResults;
        const subjectMap = new Map(subjects.map(s => [s.code, s.name]));

        const data = subjectDetails.map(detail => {
            const getComponentValue = (arr, comp) => arr?.find(item => item.component === comp)?.value ?? null;
            const pr_or = getComponentValue(detail.marks_o, 'PR/OR') || getComponentValue(detail.marks_o, 'PR') || getComponentValue(detail.marks_o, 'OR');
            return {
                'Course': subjectMap.get(detail.code) || detail.code,
                'ESE': getComponentValue(detail.marks_o, 'ESE'),
                'IA': getComponentValue(detail.marks_o, 'IA'),
                'TW': getComponentValue(detail.marks_o, 'TW'),
                'PR/OR': pr_or,
                'Total Marks': getComponentValue(detail.marks_o, 'TOT'),
                'Grade': getComponentValue(detail.grade, 'TOT')
            };
        });

        // Add summary info
        data.unshift({}); // spacer
        data.unshift({ 'Course': 'SGPI', 'ESE': sgpi.toFixed(2) });
        data.unshift({ 'Course': 'Total Marks', 'ESE': totalMarks });


        const ws = XLSX.utils.json_to_sheet(data, { skipHeader: false });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Final Result");
        XLSX.writeFile(wb, `${currentUserStudent.id}-final-result.xlsx`);
    };

    const renderAssessmentMarks = () => {
        const allCourseCodes = new Set([
            ...Object.keys(currentUserStudent.subjectMarks || {}),
            ...Object.keys(uploadedMarksheets),
            ...Object.keys(uploadedAssignmentMarksheets),
            ...Object.keys(uploadedLabMarksheets),
        ]);

        if (allCourseCodes.size === 0) {
            return '<p class="text-center text-gray-500 py-8">No assessment data has been uploaded for your courses yet.</p>';
        }

        const courseCards = Array.from(allCourseCodes).map(code => {
            const course = courses.find(c => c.code === code);
            if (!course) return '';

            const createLinkRow = (url, label) => {
                const link = url
                    ? `<a href="${url}" target="_blank" rel="noopener noreferrer" class="bg-blue-500 text-white font-semibold py-1 px-3 rounded-md hover:bg-blue-600 transition-colors text-sm">View Document</a>`
                    : `<span class="text-gray-400 font-medium text-sm">Not Available</span>`;
                return `
                    <div class="flex justify-between items-center py-3 border-b last:border-b-0">
                        <span class="text-gray-700">${label}</span>
                        ${link}
                    </div>
                `;
            };

            const internalUrl = uploadedMarksheets[code];
            const assignmentUrl = uploadedAssignmentMarksheets[code];
            const labUrl = uploadedLabMarksheets[code];

            return `
                <div class="bg-white rounded-lg shadow-md p-4 border">
                    <h3 class="text-lg font-semibold text-gray-800 mb-2 pb-2 border-b">${course.name} (${course.code})</h3>
                    <div class="space-y-1">
                        ${createLinkRow(internalUrl, 'Internal Marksheet')}
                        ${createLinkRow(assignmentUrl, 'Assignment Marksheet')}
                        ${createLinkRow(labUrl, 'Lab Marksheet')}
                    </div>
                </div>`;
        }).join('');

        return `
            <p class="mb-6 text-gray-600">Your assessment results are available below. Click a link to see the detailed document uploaded by your faculty.</p>
            <div class="space-y-4">
                ${courseCards}
            </div>
        `;
    };

    const renderFinalResults = () => {
        if (!hasFinalResults) return '';

        const { subjects, subjectDetails, totalMarks, sgpi } = currentUserStudent.finalResults;
        const subjectMap = new Map(subjects.map(s => [s.code, s.name]));
        
        const finalMarksheetUrl = uploadedFinalMarksheets && uploadedFinalMarksheets['FINAL_SEMESTER_RESULTS'];

        const resultRows = subjectDetails.map(detail => {
            const getComponentValue = (arr, comp) => {
                if (!arr) return '-';
                const item = arr.find(item => item.component === comp);
                return item?.value ?? '-';
            }
            
            return `
                <tr class="border-b hover:bg-gray-50">
                    <td class="p-3 font-medium text-gray-800">${subjectMap.get(detail.code) || detail.code}</td>
                    <td class="p-3 text-center">${getComponentValue(detail.marks_o, 'ESE')}</td>
                    <td class="p-3 text-center">${getComponentValue(detail.marks_o, 'IA')}</td>
                    <td class="p-3 text-center">${getComponentValue(detail.marks_o, 'TW')}</td>
                    <td class="p-3 text-center">${getComponentValue(detail.marks_o, 'PR/OR') || getComponentValue(detail.marks_o, 'PR') || getComponentValue(detail.marks_o, 'OR')}</td>
                    <td class="p-3 text-center font-bold bg-gray-50">${getComponentValue(detail.marks_o, 'TOT')}</td>
                    <td class="p-3 text-center font-bold text-primary">${getComponentValue(detail.grade, 'TOT')}</td>
                </tr>
            `;
        }).join('');

        return `
             <div class="flex flex-wrap justify-between items-center gap-4 mb-6">
                ${finalMarksheetUrl ? `
                    <a href="${finalMarksheetUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 bg-secondary text-primary font-bold py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" /></svg>
                        View Full Marksheet PDF
                    </a>
                ` : `<div></div>` }
                <div class="flex gap-2">
                    <button id="export-pdf-btn" class="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm">Export PDF</button>
                    <button id="export-excel-btn" class="bg-green-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-800 transition-colors text-sm">Export Excel</button>
                </div>
            </div>
            <div class="mb-6 p-6 bg-blue-50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                 <div>
                    <h3 class="text-xl font-bold text-primary">Grand Total Marks</h3>
                    <p class="text-4xl font-bold text-primary">${totalMarks}</p>
                 </div>
                 <div>
                    <h3 class="text-xl font-bold text-primary">Final SGPI</h3>
                    <p class="text-4xl font-bold text-primary">${sgpi.toFixed(2)}</p>
                 </div>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left table-auto">
                    <thead class="bg-gray-100">
                        <tr>
                            <th class="p-3 font-semibold text-gray-600">Course</th>
                            <th class="p-3 font-semibold text-gray-600 text-center">ESE</th>
                            <th class="p-3 font-semibold text-gray-600 text-center">IA</th>
                            <th class="p-3 font-semibold text-gray-600 text-center">TW</th>
                            <th class="p-3 font-semibold text-gray-600 text-center">PR/OR</th>
                            <th class="p-3 font-semibold text-gray-600 text-center">Total Marks</th>
                            <th class="p-3 font-semibold text-gray-600 text-center">Grade</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${resultRows}
                    </tbody>
                </table>
            </div>
        `;
    };

    const render = () => {
        const tabs = `
            <div class="flex border-b mb-6">
                ${hasAssessmentData ? `<button data-tab="assessment" class="tab-btn py-2 px-6 text-lg ${activeTab === 'assessment' ? 'border-b-2 border-primary text-primary font-semibold' : 'text-gray-500'}">Assessments</button>` : ''}
                ${hasFinalResults ? `<button data-tab="final" class="tab-btn py-2 px-6 text-lg ${activeTab === 'final' ? 'border-b-2 border-primary text-primary font-semibold' : 'text-gray-500'}">Final Semester Result</button>` : ''}
            </div>
        `;

        const content = Card({
            title: `Results for ${currentUserStudent.name}`,
            children: `
                ${(hasAssessmentData && hasFinalResults) ? tabs : ''}
                <div id="results-content">
                    ${activeTab === 'assessment' ? renderAssessmentMarks() : renderFinalResults()}
                </div>
            `
        });
        rootElement.innerHTML = content;
        attachEventListeners();
    };

    const attachEventListeners = () => {
        rootElement.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                activeTab = e.target.dataset.tab;
                render();
            });
        });
        
        if (activeTab === 'final' && hasFinalResults) {
            document.getElementById('export-pdf-btn')?.addEventListener('click', handleExportPdf);
            document.getElementById('export-excel-btn')?.addEventListener('click', handleExportExcel);
        }
    };

    render();
}