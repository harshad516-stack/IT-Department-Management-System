
export function Card({ title, children, className = '' }) {
    return `
        <div class="bg-white rounded-lg shadow-md p-6 ${className}">
            ${title ? `<h3 class="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">${title}</h3>` : ''}
            ${children}
        </div>
    `;
}
