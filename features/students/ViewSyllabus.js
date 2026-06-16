
import { Card } from '../../components/ui/Card.js';

export function renderViewSyllabus(rootElement, { courses, uploadedSyllabi }) {
    
    const syllabusStatusRows = courses.map(course => {
        const isUploaded = !!uploadedSyllabi[course.code];
        const fileURL = isUploaded ? uploadedSyllabi[course.code] : '#';

        return `
            <tr class="border-b last:border-b-0 hover:bg-gray-50">
                <td class="px-4 py-3">${course.code}</td>
                <td class="px-4 py-3 font-medium text-gray-800">${course.name}</td>
                <td class="px-4 py-3">${course.faculty}</td>
                <td class="px-4 py-3">
                    ${isUploaded
                        ? '<span class="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-md">Available</span>'
                        : '<span class="px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded-md">Not Uploaded</span>'
                    }
                </td>
                <td class="px-4 py-3">
                    <a href="${fileURL}" 
                       class="text-sm text-blue-600 hover:underline ${!isUploaded ? 'text-gray-400 pointer-events-none' : ''}" 
                       ${!isUploaded ? 'aria-disabled="true" tabindex="-1"' : 'target="_blank" rel="noopener noreferrer"'}>
                       View Syllabus
                    </a>
                </td>
            </tr>
        `;
    }).join('');
    
    const content = Card({
        title: "View Course Syllabus",
        children: `
            <p class="mb-6 text-gray-600">Here you can find the syllabus for all available courses. Download the PDF to view the course structure, modules, and marking scheme.</p>
            <div class="bg-white rounded-lg shadow-sm border">
                <div class="overflow-x-auto">
                    <table class="w-full text-left table-auto">
                        <thead class="bg-gray-50 border-b">
                            <tr>
                                <th class="px-4 py-3 font-semibold text-gray-600">Code</th>
                                <th class="px-4 py-3 font-semibold text-gray-600">Course Name</th>
                                <th class="px-4 py-3 font-semibold text-gray-600">Faculty</th>
                                <th class="px-4 py-3 font-semibold text-gray-600">Status</th>
                                <th class="px-4 py-3 font-semibold text-gray-600">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${syllabusStatusRows}
                        </tbody>
                    </table>
                </div>
            </div>
        `
    });

    rootElement.innerHTML = content;
}
