
export function Header(containerElement, { user, onLogout }) {
    const content = `
        <header class="h-20 bg-white shadow-md flex items-center justify-between px-6">
            <div>
                <h2 class="text-2xl font-semibold text-gray-800">Welcome, ${user.name}!</h2>
                <p class="text-sm text-gray-500">Role: ${user.role}</p>
            </div>
            <button
                id="logout-button"
                class="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-800 transition-colors duration-300 flex items-center"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
            </button>
        </header>
    `;

    containerElement.innerHTML = content;
    document.getElementById('logout-button').addEventListener('click', onLogout);
}
