

import { Card } from '../../components/ui/Card.js';
import { UserRole } from '../../types.js';

export function renderEvents(rootElement, { events, user, onAddEvent, onRemoveEvents }) {
    let showAddForm = false;
    let isRemoveMode = false;
    let selectedEvents = new Set();

    const handleRemoveClick = () => {
        if (selectedEvents.size === 0) {
            alert('Please select at least one event to remove.');
            return;
        }
        const idsToRemove = Array.from(selectedEvents);
        const confirmation = confirm(`Are you sure you want to remove ${idsToRemove.length} event(s)? This action cannot be undone.`);
        if (confirmation) {
            onRemoveEvents(idsToRemove);
        }
    };

    const render = () => {
        const eventItems = events.map(event => {
            let typeClass = 'bg-gray-500';
            if (event.type === 'Hackathon') typeClass = 'bg-red-500';
            else if (event.type === 'Workshop') typeClass = 'bg-blue-500';
            else if (event.type === 'Seminar') typeClass = 'bg-green-500';
            else if (event.type === 'Notice') typeClass = 'bg-yellow-500';

            return `
                <div class="relative p-4 bg-gray-50 rounded-lg border ${selectedEvents.has(event.id) ? 'border-primary ring-2 ring-primary' : 'border-gray-200'} flex items-start gap-4 transition-all">
                    ${isRemoveMode ? `
                        <input 
                            type="checkbox" 
                            class="event-checkbox h-6 w-6 text-primary focus:ring-primary border-gray-300 rounded mt-1 flex-shrink-0" 
                            data-id="${event.id}" 
                            ${selectedEvents.has(event.id) ? 'checked' : ''}>
                    ` : ''}
                    <div class="flex-grow">
                        <div class="flex justify-between items-start">
                            <div>
                                <h3 class="text-lg font-bold text-primary">${event.title}</h3>
                                <p class="text-sm text-gray-600 mt-1">${event.description}</p>
                            </div>
                            <div class="text-right flex-shrink-0 ml-4">
                                <p class="font-semibold">${event.date}</p>
                                <span class="text-xs font-bold px-2 py-1 rounded-full text-white ${typeClass}">${event.type}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const managementButtons = (user.role === UserRole.HOD || user.role === UserRole.Faculty) ? `
            ${isRemoveMode ? `
                <button id="confirm-remove-btn" class="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400" ${selectedEvents.size === 0 ? 'disabled' : ''}>
                    Confirm & Delete (${selectedEvents.size})
                </button>
            `: ''}
            <button id="toggle-remove-mode-btn" class="${isRemoveMode ? 'bg-gray-500' : 'bg-red-500'} text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors" ${events.length === 0 ? 'disabled' : ''}>
                ${isRemoveMode ? 'Cancel Removal' : 'Remove Event'}
            </button>
            <button id="toggle-add-event-btn" class="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-800 transition-colors" ${isRemoveMode ? 'disabled' : ''}>
                ${showAddForm ? 'Cancel' : 'Add Event'}
            </button>
        ` : '';

        const addEventForm = showAddForm ? `
            <div class="my-4 p-4 bg-gray-50 rounded-lg border">
                <h4 class="text-lg font-semibold text-gray-700 mb-4">Add New Event or Notice</h4>
                <form id="add-event-form" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="event-title" class="block text-sm font-medium">Title</label>
                            <input type="text" id="event-title" name="title" required class="w-full p-2 border rounded-lg mt-1">
                        </div>
                        <div>
                            <label for="event-date" class="block text-sm font-medium">Date</label>
                            <input type="date" id="event-date" name="date" required value="${new Date().toISOString().split('T')[0]}" class="w-full p-2 border rounded-lg mt-1">
                        </div>
                    </div>
                    <div>
                        <label for="event-type" class="block text-sm font-medium">Type</label>
                        <select id="event-type" name="type" required class="w-full p-2 border rounded-lg mt-1">
                            <option value="Seminar">Seminar</option>
                            <option value="Workshop">Workshop</option>
                            <option value="Hackathon">Hackathon</option>
                            <option value="Notice">Notice</option>
                        </select>
                    </div>
                    <div>
                        <label for="event-description" class="block text-sm font-medium">Description</label>
                        <textarea id="event-description" name="description" required rows="3" class="w-full p-2 border rounded-lg mt-1"></textarea>
                    </div>
                    <button type="submit" class="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">Save Event</button>
                </form>
            </div>
        ` : '';

        const content = Card({
            title: "Events & Notices",
            children: `
                <div class="flex justify-between items-center mb-4">
                    <p class="text-gray-600">Stay updated with the latest seminars, workshops, hackathons, and circulars from the IT department.</p>
                    <div class="flex gap-2">
                        ${managementButtons}
                    </div>
                </div>
                ${addEventForm}
                <div class="space-y-4">
                    ${events.length > 0 ? eventItems : '<p class="text-center text-gray-500 py-4">No events or notices have been posted yet.</p>'}
                </div>
            `
        });
        rootElement.innerHTML = content;
        attachEventListeners();
    };

    const attachEventListeners = () => {
        if (user.role === UserRole.HOD || user.role === UserRole.Faculty) {
            document.getElementById('toggle-add-event-btn')?.addEventListener('click', () => {
                showAddForm = !showAddForm;
                render();
            });
            
            document.getElementById('toggle-remove-mode-btn')?.addEventListener('click', () => {
                isRemoveMode = !isRemoveMode;
                if (!isRemoveMode) selectedEvents.clear();
                render();
            });

            if (isRemoveMode) {
                document.getElementById('confirm-remove-btn')?.addEventListener('click', handleRemoveClick);
                document.querySelectorAll('.event-checkbox').forEach(checkbox => {
                    checkbox.addEventListener('change', () => {
                        const id = checkbox.dataset.id;
                        if (checkbox.checked) {
                            selectedEvents.add(id);
                        } else {
                            selectedEvents.delete(id);
                        }
                        render();
                    });
                });
            }

            if (showAddForm) {
                const form = document.getElementById('add-event-form');
                form?.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const formData = new FormData(form);
                    const newEvent = {
                        title: formData.get('title'),
                        date: formData.get('date'),
                        type: formData.get('type'),
                        description: formData.get('description'),
                    };
                    onAddEvent(newEvent);
                    // The parent component will handle re-render, but for a better UX, we can hide the form.
                    showAddForm = false; 
                });
            }
        }
    };

    render();
}
