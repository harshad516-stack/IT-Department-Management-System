

import { UserRole } from '../types.js';

const RoleCard = ({ role, icon }) => `
    <div
        data-role="${role}"
        class="role-card group bg-white rounded-xl shadow-lg hover:shadow-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transform hover:-translate-y-2 transition-all duration-300 border-2 border-transparent hover:border-primary"
    >
        <span class="text-5xl mb-4">${icon}</span>
        <h3 class="text-xl font-semibold text-gray-800 group-hover:text-primary">${role}</h3>
    </div>
`;

export function renderLoginScreen(rootElement, { onLogin }) {
    const content = `
        <div class="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <div class="text-center mb-12">
                 <h1 class="text-5xl font-bold text-primary mb-2">IT Department Management System</h1>
                 <p class="text-xl text-gray-600">Please select your role to continue</p>
            </div>

            <div class="w-full max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
                ${RoleCard({ role: UserRole.HOD, icon: "🧑‍💼" })}
                ${RoleCard({ role: UserRole.Faculty, icon: "🧑‍🏫" })}
                ${RoleCard({ role: UserRole.Student, icon: "🎓" })}
            </div>
            
            <footer class="mt-12 text-center text-gray-500">
                <p>&copy; ${new Date().getFullYear()} Shivajirao S. Jhondhale College of Engineering and Management Studies. All Rights Reserved.</p>
            </footer>
        </div>
    `;

    rootElement.innerHTML = content;
    
    rootElement.querySelectorAll('.role-card').forEach(card => {
        card.addEventListener('click', () => {
            const role = card.dataset.role;
            onLogin(role);
        });
    });
}