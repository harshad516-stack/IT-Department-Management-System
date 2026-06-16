import { Card } from '../../components/ui/Card.js';

export function renderDocumentAI(rootElement) {
    const content = Card({
        title: "Document AI Processor",
        children: `
            <div class="text-center text-gray-500 py-8">
                 <h2 class="text-2xl font-semibold mb-2">Coming Soon</h2>
                 <p>This feature for general document processing is under development.</p>
            </div>
        `
    });
    rootElement.innerHTML = content;
}
