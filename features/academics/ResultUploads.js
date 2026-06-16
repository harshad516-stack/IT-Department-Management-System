import { Card } from '../../components/ui/Card.js';

export function renderResultUploads(rootElement) {
    const content = Card({
        title: "AI-Powered Result Upload",
        children: `
            <div class="text-center text-gray-500 py-8">
                 <h2 class="text-2xl font-semibold mb-2">Coming Soon</h2>
                 <p>This feature for uploading results via image scan is under development.</p>
            </div>
        `
    });
    rootElement.innerHTML = content;
}
