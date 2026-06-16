
import { Card } from '../../components/ui/Card.js';
import { UserRole } from '../../types.js';

export function renderFacultyManagement(rootElement, props) {
    const { user, faculty, onAddFaculty, onRemoveFaculty, onUpdateFaculty, setActiveComponent } = props;

    const renderFacultyView = () => {
        const facultyUser = faculty.find(f => f.name === user.name);
        if (!facultyUser) {
             rootElement.innerHTML = Card({ title: "My Profile", children: `<p>Your faculty profile could not be found.</p>` });
             return;
        }

        const quickLinks = [
            { name: 'Upload Syllabus', component: 'SyllabusUploads', icon: '📄' },
            { name: 'Upload Results', component: 'UploadResults', icon: '📈' },
            { name: 'Use Document AI', component: 'DocumentAI', icon: '🤖' },
            { name: 'Manage Final Marks', component: 'FinalMarks', icon: '📊' }
        ];

        const content = `
            <div class="space-y-6">
                ${Card({
                    title: "My Profile",
                    children: `
                        <div class="flex items-center p-4">
                            <img src="https://picsum.photos/seed/${facultyUser.id}/150" alt="${facultyUser.name}" class="w-24 h-24 rounded-full mr-6 border-4 border-primary" />
                            <div>
                                <h2 class="text-3xl font-bold text-primary">${facultyUser.name}</h2>
                                <p class="text-lg text-gray-600">${facultyUser.designation}</p>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 border-t">
                            <p><strong class="text-gray-600">Username:</strong> ${facultyUser.username}</p>
                            <p><strong class="text-gray-600">Email:</strong> ${facultyUser.email}</p>
                            <p><strong class="text-gray-600">Specialization:</strong> ${facultyUser.specialization}</p>
                            <p><strong class="text-gray-600">Research Papers:</strong> ${facultyUser.researchPapers}</p>
                        </div>
                    `
                })}
                ${Card({
                    title: "Faculty Actions",
                    children: `
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                            ${quickLinks.map(link => `
                                <button data-component="${link.component}" class="quick-action-btn flex flex-col items-center justify-center p-6 bg-gray-50 hover:bg-blue-100 rounded-lg transition-colors border-2 border-transparent hover:border-primary">
                                    <span class="text-4xl mb-2">${link.icon}</span>
                                    <span class="font-semibold text-gray-700">${link.name}</span>
                                </button>
                            `).join('')}
                        </div>
                    `
                })}
            </div>
        `;
        rootElement.innerHTML = content;
        rootElement.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                setActiveComponent(btn.dataset.component);
            });
        });
    };
    
    const renderHodView = () => {
        let showAddForm = false;
        let isRemoveMode = false;
        let selectedFaculty = new Set();
        let editingFacultyId = null;

        const handleRemoveClick = () => {
            if (selectedFaculty.size === 0) {
                alert('Please select at least one faculty member to remove.');
                return;
            }
            const idsToRemove = Array.from(selectedFaculty);
            const confirmation = confirm(`Are you sure you want to remove ${idsToRemove.length} faculty member(s)? This action cannot be undone.`);
            if (confirmation) {
                onRemoveFaculty(idsToRemove);
            }
        };
        
        const handleSaveEdit = (facultyId) => {
            const form = document.getElementById(`edit-form-${facultyId}`);
            if (!form) return;
            const formData = new FormData(form);
            const updatedData = {
                name: formData.get('name'),
                username: formData.get('username'),
                email: formData.get('email'),
                designation: formData.get('designation'),
                specialization: formData.get('specialization'),
                researchPapers: formData.get('researchPapers'),
            };
            onUpdateFaculty(facultyId, updatedData);
        };

        const render = () => {
            const isEditing = editingFacultyId !== null;

            const facultyContent = faculty.map(f => {
                if (f.id === editingFacultyId) {
                    return `
                        <div class="bg-blue-50 rounded-lg p-6 border-2 border-primary col-span-1 md:col-span-2 lg:col-span-3 shadow-lg transition-all duration-300">
                            <form id="edit-form-${f.id}" class="space-y-4">
                                <h4 class="text-xl font-bold text-primary mb-2">Editing: ${f.name}</h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label class="block text-sm font-medium text-gray-700">Name</label><input type="text" name="name" class="mt-1 w-full p-2 border rounded-lg focus:ring-primary focus:border-primary" value="${f.name}" required /></div>
                                    <div><label class="block text-sm font-medium text-gray-700">Username</label><input type="text" name="username" class="mt-1 w-full p-2 border rounded-lg focus:ring-primary focus:border-primary" value="${f.username}" required /></div>
                                    <div><label class="block text-sm font-medium text-gray-700">Email</label><input type="email" name="email" class="mt-1 w-full p-2 border rounded-lg focus:ring-primary focus:border-primary" value="${f.email}" required /></div>
                                    <div><label class="block text-sm font-medium text-gray-700">Designation</label><input type="text" name="designation" class="mt-1 w-full p-2 border rounded-lg focus:ring-primary focus:border-primary" value="${f.designation}" required/></div>
                                    <div><label class="block text-sm font-medium text-gray-700">Specialization</label><input type="text" name="specialization" class="mt-1 w-full p-2 border rounded-lg focus:ring-primary focus:border-primary" value="${f.specialization}" required /></div>
                                    <div><label class="block text-sm font-medium text-gray-700">Research Papers</label><input type="number" name="researchPapers" class="mt-1 w-full p-2 border rounded-lg focus:ring-primary focus:border-primary" value="${f.researchPapers}" required /></div>
                                </div>
                                <div class="flex justify-end gap-3 pt-2">
                                    <button type="button" class="cancel-edit-btn bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
                                    <button type="submit" class="save-edit-btn bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    `;
                }
                
                return `
                    <div class="relative group ${isEditing ? 'opacity-50 pointer-events-none' : ''}">
                        ${!isRemoveMode && !isEditing ? `
                            <button data-id="${f.id}" class="edit-faculty-btn absolute top-3 right-3 bg-white p-2 rounded-full shadow-md text-gray-500 hover:bg-gray-100 hover:text-primary transition-all opacity-0 group-hover:opacity-100 z-10" aria-label="Edit ${f.name}">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg>
                            </button>
                        ` : ''}
                        ${isRemoveMode ? `
                            <input type="checkbox" class="faculty-checkbox absolute top-3 right-3 h-6 w-6 text-primary focus:ring-primary border-gray-400 rounded z-10 cursor-pointer" data-id="${f.id}" ${selectedFaculty.has(f.id) ? 'checked' : ''}>
                        ` : ''}
                        <div class="bg-gray-50 rounded-lg p-4 border ${selectedFaculty.has(f.id) ? 'border-primary ring-2 ring-primary' : 'border-gray-200'} hover:shadow-lg transition-all h-full ${isRemoveMode ? 'cursor-pointer' : ''}" data-id="${f.id}">
                            <div class="flex items-center mb-3">
                                <img src="https://picsum.photos/seed/${f.id}/100" alt="${f.name}" class="w-16 h-16 rounded-full mr-4" />
                                <div>
                                    <h4 class="text-lg font-bold text-primary">${f.name}</h4>
                                    <p class="text-sm text-gray-600">${f.designation}</p>
                                </div>
                            </div>
                            <p class="text-sm text-gray-700"><strong>Username:</strong> ${f.username}</p>
                            <p class="text-sm text-gray-700"><strong>Specialization:</strong> ${f.specialization}</p>
                            <p class="text-sm text-gray-700"><strong>Email:</strong> ${f.email}</p>
                            <p class="text-sm text-gray-700"><strong>Research Papers:</strong> ${f.researchPapers}</p>
                        </div>
                    </div>
                `;
            }).join('');
            
            const facultyGrid = faculty.length > 0
                ? `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${facultyContent}</div>`
                : `<div class="text-center p-8 text-gray-500">
                       <h3 class="text-xl font-semibold mb-2">No Faculty Found</h3>
                       <p>Get started by adding the first faculty member to the system.</p>
                   </div>`;

            const content = Card({
                title: "Faculty Management",
                children: `
                    <div class="mb-4 flex justify-end gap-2">
                         ${isRemoveMode ? `
                            <button id="confirm-remove-btn" class="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-all duration-200 disabled:bg-red-300" ${selectedFaculty.size === 0 ? 'disabled' : ''}>
                                Confirm & Delete (${selectedFaculty.size})
                            </button>
                        ` : ''}
                        <button id="toggle-remove-mode-btn" class="${isRemoveMode ? 'bg-gray-500' : 'bg-red-500'} text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors" ${isEditing || faculty.length === 0 ? 'disabled' : ''}>
                            ${isRemoveMode ? 'Cancel Removal' : 'Remove Faculty'}
                        </button>
                        <button id="toggle-add-faculty-form-btn" class="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-800 transition-colors" ${isRemoveMode || isEditing ? 'disabled' : ''}>
                            ${showAddForm ? 'Cancel' : 'Add Faculty'}
                        </button>
                    </div>

                    ${showAddForm ? `
                        <div class="my-4 p-4 bg-gray-50 rounded-lg border">
                            <form id="add-faculty-form" class="space-y-4">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <input type="text" name="name" class="p-2 border rounded-lg" placeholder="Full Name" required />
                                     <input type="text" name="username" class="p-2 border rounded-lg" placeholder="Username (for login)" required />
                                     <input type="email" name="email" class="p-2 border rounded-lg" placeholder="Email Address" required />
                                     <input type="text" name="designation" class="p-2 border rounded-lg" placeholder="Designation (e.g., Professor)" required/>
                                     <input type="text" name="specialization" class="p-2 border rounded-lg" placeholder="Specialization" required />
                                     <input type="number" name="researchPapers" class="p-2 border rounded-lg" placeholder="Research Papers" value="0" required />
                                </div>
                                <button type="submit" class="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">Save Faculty Member</button>
                            </form>
                        </div>
                    ` : ''}

                    ${facultyGrid}
                `
            });

            rootElement.innerHTML = content;
            attachEventListeners();
        };

        const attachEventListeners = () => {
            document.getElementById('toggle-add-faculty-form-btn')?.addEventListener('click', () => {
                if (editingFacultyId) return;
                showAddForm = !showAddForm;
                render();
            });

            document.getElementById('toggle-remove-mode-btn')?.addEventListener('click', () => {
                if (editingFacultyId) return;
                isRemoveMode = !isRemoveMode;
                if (!isRemoveMode) selectedFaculty.clear();
                render();
            });
            
            if (isRemoveMode) {
                document.getElementById('confirm-remove-btn')?.addEventListener('click', handleRemoveClick);
                document.querySelectorAll('.faculty-checkbox, .bg-gray-50.cursor-pointer').forEach(el => {
                    el.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const id = el.dataset.id;
                        if (selectedFaculty.has(id)) selectedFaculty.delete(id);
                        else selectedFaculty.add(id);
                        render();
                    });
                });
            }

            if (showAddForm) {
                document.getElementById('add-faculty-form').addEventListener('submit', (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    onAddFaculty({
                        name: formData.get('name'),
                        username: formData.get('username'),
                        email: formData.get('email'),
                        designation: formData.get('designation'),
                        specialization: formData.get('specialization'),
                        researchPapers: parseInt(formData.get('researchPapers'), 10),
                    });
                });
            }
            
            document.querySelectorAll('.edit-faculty-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    editingFacultyId = e.currentTarget.dataset.id;
                    isRemoveMode = false;
                    selectedFaculty.clear();
                    render();
                });
            });

            if (editingFacultyId) {
                const form = document.getElementById(`edit-form-${editingFacultyId}`);
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    handleSaveEdit(editingFacultyId);
                });
                form.querySelector('.cancel-edit-btn').addEventListener('click', () => {
                    editingFacultyId = null;
                    render();
                });
            }
        };

        render();
    }

    if (user.role === UserRole.HOD) {
        renderHodView();
    } else {
        renderFacultyView();
    }
}
