

import { NAVIGATION_LINKS } from '../constants.js';

export function Sidebar(containerElement, { userRole, activeComponent, setActiveComponent }) {
    const navItems = NAVIGATION_LINKS[userRole] || [];

    const content = `
        <aside class="w-64 bg-primary text-white flex flex-col shadow-lg h-full">
            <div class="h-20 flex items-center justify-center border-b border-blue-800">
                <h1 class="text-2xl font-bold">IT Portal</h1>
            </div>
            <nav class="flex-1 px-4 py-6">
                <ul>
                    ${navItems.map(item => `
                        <li class="mb-2">
                            <a
                                href="#"
                                data-component="${item.component}"
                                class="nav-link flex items-center p-3 rounded-lg transition-colors duration-200 ${
                                    activeComponent === item.component
                                        ? 'bg-blue-700 text-white shadow-inner'
                                        : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                                }"
                            >
                                <span class="mr-3">${item.icon}</span>
                                <span class="font-medium">${item.name}</span>
                            </a>
                        </li>
                    `).join('')}
                </ul>
            </nav>
            <div class="p-4 border-t border-blue-800">
                <p class="text-center text-xs text-blue-300">© ${new Date().getFullYear()} SSJCOE, Dombivli</p>
            </div>
        </aside>
    `;

    containerElement.innerHTML = content;

    containerElement.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            setActiveComponent(link.dataset.component);
        });
    });
}