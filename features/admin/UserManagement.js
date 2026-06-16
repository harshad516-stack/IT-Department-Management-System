
import { Card } from '../../components/ui/Card.js';

export function renderUserManagement(rootElement) {
    const content = Card({
        title: "User Management",
        children: `
            <div class="text-center text-gray-500 py-8">
                 <h2 class="text-2xl font-semibold mb-2">Coming Soon</h2>
                 <p>This section is for administrators to add, remove, and manage user roles and permissions across the portal.</p>
            </div>
        `
    });
    rootElement.innerHTML = content;
}
