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
        if(!targetNav) return; // invalid page

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

    // Prevent errors: Disable button when input is empty
    taskInput.addEventListener('input', (e) => {
        if (e.target.value.trim().length > 0) {
            addTaskBtn.removeAttribute('disabled');
        } else {
            addTaskBtn.setAttribute('disabled', 'true');
        }
    });

    addTaskBtn.addEventListener('click', () => {
        const text = taskInput.value.trim();
        if (text) {
            addTask(text);
            taskInput.value = '';
            addTaskBtn.setAttribute('disabled', 'true'); // reset
            showToast('Task added successfully', 'success');
        }
    });

    function addTask(text) {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.innerHTML = `
            <span>${text}</span>
            <button class="delete-btn"><i class="ri-delete-bin-line"></i></button>
        `;
        
        // Attach delete event
        li.querySelector('.delete-btn').addEventListener('click', () => {
            li.remove();
            // User Control and Freedom: Provide an Undo option in the toast
            showToast(`Task Deleted`, 'warning', true, () => {
                taskList.appendChild(li); // Re-add the element on undo
            });
        });

        taskList.appendChild(li);
    }

    // Setup initial delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const li = e.target.closest('.task-item');
            li.remove();
            showToast(`Task Deleted`, 'warning', true, () => {
                taskList.appendChild(li); 
            });
        });
    });

    // --- Toast Notification System ---
    const toastContainer = document.getElementById('toast-container');

    function showToast(message, type = 'info', setupUndo = false, undoCallback = null) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        
        // Dynamic border color based on type
        let borderColor = 'var(--neon-primary)';
        if(type === 'success') borderColor = 'var(--neon-success)';
        if(type === 'warning') borderColor = 'var(--neon-warning)';
        
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

        recognition.onstart = function() {
            voiceBtn.classList.add('listening');
            voiceStatus.textContent = 'Listening...';
            voiceStatus.classList.add('visible');
            showToast('Voice navigation listening', 'info');
        };

        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript.toLowerCase();
            voiceStatus.textContent = `You said: "${transcript}"`;
            
            // Artificial intelligence parsing! (Pattern matching)
            processVoiceCommand(transcript);
            
            setTimeout(() => {
                voiceStatus.classList.remove('visible');
            }, 3000);
        };

        recognition.onerror = function(event) {
            console.error(event.error);
            voiceStatus.textContent = 'Error: Could not understand.';
            voiceBtn.classList.remove('listening');
            showToast(`Voice Error: ${event.error}`, 'warning');
            setTimeout(() => {
                voiceStatus.classList.remove('visible');
            }, 3000);
        };

        recognition.onend = function() {
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
