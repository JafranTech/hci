// HCI Principle Implementation
// 1. Visiblity of System Status (Navigation highlights, active pages)
// 2. Error Prevention (Disabling buttons)
// 3. User Control & Freedom (Voice commands, Undo capabilities)

document.addEventListener('DOMContentLoaded', () => {

    // --- Navigation Logic ---
    const navLinks = document.querySelectorAll('.nav-links li');
    const pages = document.querySelectorAll('.page');
    const pageTitle = document.getElementById('page-title');
    const breadcrumbCurrent = document.getElementById('breadcrumb-current');

    const pageTitles = {
        'home': 'Dashboard',
        'tasks': 'Task Management',
        'profile': 'User Profile',
        'settings': 'Settings'
    };

    function navigateTo(pageId) {
        // Find the matching nav link
        let targetNav = Array.from(navLinks).find(nav => nav.dataset.page === pageId);
        if (!targetNav) return; // invalid page

        // Update Nav UI
        navLinks.forEach(link => link.classList.remove('active'));
        targetNav.classList.add('active');

        // Update Pages
        pages.forEach(page => page.classList.remove('active'));
        document.getElementById(`page-${pageId}`).classList.add('active');

        // Update Titles
        const displayTitle = pageTitles[pageId];
        pageTitle.textContent = displayTitle;
        breadcrumbCurrent.textContent = displayTitle;

        // Visual feedback through toast
        showToast(`Navigated to ${displayTitle}`, 'info');
    }

    // Attach click events mapped to the navigation function
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navigateTo(link.dataset.page);
        });
    });

    // --- Task Form Logic (Error Prevention) ---
    const taskInput = document.getElementById('new-task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');

    // --- State Management ---
    let savedTasks = JSON.parse(localStorage.getItem('hciTasks')) || [];
    // Migration for backwards compatibility (string -> object)
    savedTasks = savedTasks.map(task => {
        return typeof task === 'string' ? { text: task, completed: false } : task;
    });

    const defaultAvatar = "https://i.pravatar.cc/150?img=11";

    function saveTasksToStorage() {
        localStorage.setItem('hciTasks', JSON.stringify(savedTasks));
    }

    function updateDashboardStats() {
        const totalCount = savedTasks.length;
        const completedCount = savedTasks.filter(t => t.completed).length;

        const totalEl = document.getElementById('total-tasks-count');
        const completedEl = document.getElementById('completed-tasks-count');

        if (totalEl) totalEl.textContent = totalCount;
        if (completedEl) completedEl.textContent = completedCount;
    }

    function renderTasks() {
        taskList.innerHTML = '';
        savedTasks.forEach((taskObj, index) => {
            const li = document.createElement('li');
            li.className = `task-item ${taskObj.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <span>${taskObj.text}</span>
                <div class="task-actions">
                    <button class="task-btn complete-btn" aria-label="Toggle Complete" data-index="${index}">
                        <i class="${taskObj.completed ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'}"></i>
                    </button>
                    <button class="task-btn delete-btn" aria-label="Delete Task" data-index="${index}">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                </div>
            `;

            li.querySelector('.complete-btn').addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.index);
                savedTasks[idx].completed = !savedTasks[idx].completed;
                saveTasksToStorage();
                renderTasks();
            });

            li.querySelector('.delete-btn').addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.index);
                const deletedTask = savedTasks.splice(idx, 1)[0];
                saveTasksToStorage();
                renderTasks();

                showToast(`Task Deleted`, 'warning', true, () => {
                    savedTasks.splice(idx, 0, deletedTask); // insert it back
                    saveTasksToStorage();
                    renderTasks();
                });
            });

            taskList.appendChild(li);
        });
        updateDashboardStats();
    }

    // Initial render
    renderTasks();

    // Prevent errors: Disable button when input is empty
    taskInput.addEventListener('input', (e) => {
        if (e.target.value.trim().length > 0) {
            addTaskBtn.removeAttribute('disabled');
        } else {
            addTaskBtn.setAttribute('disabled', 'true');
        }
    });

    addTaskBtn.addEventListener('click', () => {
        handleAddTask();
    });

    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAddTask();
        }
    });

    function handleAddTask() {
        const text = taskInput.value.trim();
        if (text) {
            savedTasks.push({ text: text, completed: false });
            saveTasksToStorage();
            renderTasks();
            taskInput.value = '';
            addTaskBtn.setAttribute('disabled', 'true'); // reset
            showToast('Task added successfully', 'success');
        }
    }

    // --- Profile Logic ---
    const profileImageUpload = document.getElementById('profile-image-upload');
    const profilePreview = document.getElementById('profile-preview');
    const headerAvatar = document.getElementById('header-avatar');
    const profileNameInput = document.getElementById('profile-name');
    const saveProfileBtn = document.getElementById('save-profile-btn');

    // Load profile from storage
    const storedProfile = JSON.parse(localStorage.getItem('hciProfile')) || { name: '', image: defaultAvatar };
    profileNameInput.value = storedProfile.name;
    profilePreview.src = storedProfile.image;
    headerAvatar.src = storedProfile.image;

    profileImageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                profilePreview.src = event.target.result;
            }
            reader.readAsDataURL(file);
        }
    });

    saveProfileBtn.addEventListener('click', () => {
        const newProfile = {
            name: profileNameInput.value.trim(),
            image: profilePreview.src
        };
        localStorage.setItem('hciProfile', JSON.stringify(newProfile));
        headerAvatar.src = newProfile.image;
        showToast('Profile saved successfully', 'success');
    });

    // --- Toast Notification System ---
    const toastContainer = document.getElementById('toast-container');

    function showToast(message, type = 'info', setupUndo = false, undoCallback = null) {
        const toast = document.createElement('div');
        toast.className = 'toast';

        // Dynamic border color based on type
        let borderColor = 'var(--neon-primary)';
        if (type === 'success') borderColor = 'var(--neon-success)';
        if (type === 'warning') borderColor = 'var(--neon-warning)';

        toast.style.borderLeftColor = borderColor;

        let innerHTML = `<span class="toast-message">${message}</span>`;
        if (setupUndo) {
            innerHTML += `<button class="toast-undo">Undo</button>`;
        }

        toast.innerHTML = innerHTML;
        toastContainer.appendChild(toast);

        if (setupUndo && undoCallback) {
            toast.querySelector('.toast-undo').addEventListener('click', () => {
                undoCallback();
                toast.classList.add('hiding');
                setTimeout(() => toast.remove(), 400);
            });
        }

        // Auto remove after 3s
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('hiding');
                setTimeout(() => {
                    if (toast.parentElement) toast.remove();
                }, 400); // Wait for hiding animation to complete
            }
        }, 3000);
    }

    // --- Voice Navigation Logic ---
    const voiceBtn = document.getElementById('voice-btn');
    const voiceStatus = document.getElementById('voice-status');

    // Check if browser supports speech recognition
    const windowSpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (windowSpeechRecognition) {
        const recognition = new windowSpeechRecognition();
        recognition.continuous = false; // Stop after a command
        recognition.interimResults = false;
        recognition.lang = 'en-US'; // English, but handles approximations of "home ku po"

        recognition.onstart = function () {
            voiceBtn.classList.add('listening');
            voiceStatus.textContent = 'Listening...';
            voiceStatus.classList.add('visible');
            showToast('Voice navigation listening', 'info');
        };

        recognition.onresult = function (event) {
            const transcript = event.results[0][0].transcript.toLowerCase();
            voiceStatus.textContent = `You said: "${transcript}"`;

            // Artificial intelligence parsing! (Pattern matching)
            processVoiceCommand(transcript);

            setTimeout(() => {
                voiceStatus.classList.remove('visible');
            }, 3000);
        };

        recognition.onerror = function (event) {
            console.error(event.error);
            voiceStatus.textContent = 'Error: Could not understand.';
            voiceBtn.classList.remove('listening');
            showToast(`Voice Error: ${event.error}`, 'warning');
            setTimeout(() => {
                voiceStatus.classList.remove('visible');
            }, 3000);
        };

        recognition.onend = function () {
            voiceBtn.classList.remove('listening');
        };

        voiceBtn.addEventListener('click', () => {
            if (voiceBtn.classList.contains('listening')) {
                recognition.stop();
            } else {
                recognition.start();
            }
        });

    } else {
        voiceBtn.addEventListener('click', () => {
            showToast('Voice navigation not supported in this browser.', 'warning');
        });
    }

    function processVoiceCommand(text) {
        console.log("Processing command: ", text);

        let navigatedToTask = false;
        // Check if the command matches any task name globally
        for (let taskObj of savedTasks) {
            if (text.includes(taskObj.text.toLowerCase())) {
                navigateTo('tasks');
                showToast(`Navigated to tasks for: ${taskObj.text}`, 'success');
                navigatedToTask = true;
                break;
            }
        }

        if (navigatedToTask) return;

        // Command mappings covering both English and Tamil transliteration heuristics
        // "home ku ponom", "go to home", "show home"
        if (text.includes('home')) {
            navigateTo('home');
        }
        else if (text.includes('task') || text.includes('work') || text.includes('todo') || text.includes('to-do')) {
            navigateTo('tasks');
        }
        else if (text.includes('profile') || text.includes('user') || text.includes('account')) {
            navigateTo('profile');
        }
        else if (text.includes('setting') || text.includes('option') || text.includes('config')) {
            navigateTo('settings');
        }
        else {
            showToast('Command not recognized. Try "Go to Tasks"', 'warning');
        }
    }

});
