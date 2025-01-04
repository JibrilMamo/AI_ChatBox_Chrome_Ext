let chatbox = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

// Store event listener references
let dragListener = null;
let stopDragListener = null;

// Create and inject the chatbox
async function createChatbox() {
    // If chatbox exists but is not in DOM, reset it to null
    if (chatbox && !chatbox.parentElement) {
        chatbox = null;
    }

    // Return if chatbox already exists and is in DOM
    if (chatbox && chatbox.parentElement) return;

    // Create chatbox container
    chatbox = document.createElement('div');
    chatbox.id = 'chatbox';
    
    // Reset any existing classes that might persist
    chatbox.className = '';
    
    // Rest of the HTML content...
    chatbox.innerHTML = `
        <div id="header">
            <h1>AI Chat</h1>
            <div class="header-buttons">
                <button id="theme-toggle" class="icon-button">
                    <svg class="theme-icon light-icon" viewBox="0 0 24 24">
                        <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"/>
                        <path d="M12 2V4M12 20V22M4 12H2M6.31412 6.31412L4.8999 4.8999M17.6859 6.31412L19.1001 4.8999M6.31412 17.69L4.8999 19.1042M17.6859 17.69L19.1001 19.1042M22 12H20"/>
                    </svg>
                    <svg class="theme-icon dark-icon" style="display: none;" viewBox="0 0 24 24">
                        <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/>
                    </svg>
                </button>
                <button id="clear">Clear</button>
                <button id="minimize">−</button>
                <button id="close" class="close-button">×</button>
            </div>
        </div>
        <div id="messages"></div>
        <div id="input-area">
            <textarea id="user-input" placeholder="Ask me anything about this page..."></textarea>
            <button id="send-button" class="send-button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2"/>
                </svg>
                <div class="loading-spinner" style="display: none"></div>
            </button>
        </div>
    `;

    // Store event listeners for later cleanup
    dragListener = drag.bind(this);
    stopDragListener = stopDragging.bind(this);

    // Add dragging functionality
    const header = chatbox.querySelector('#header');
    header.addEventListener('mousedown', startDragging);
    document.addEventListener('mousemove', dragListener);
    document.addEventListener('mouseup', stopDragListener);

    // Add minimize functionality
    const minimizeBtn = chatbox.querySelector('#minimize');
    minimizeBtn.addEventListener('click', toggleMinimize);

    // Add clear functionality
    const clearBtn = chatbox.querySelector('#clear');
    clearBtn.addEventListener('click', clearChat);

    // Add close functionality
    const closeBtn = chatbox.querySelector('#close');
    closeBtn.addEventListener('click', closeChatbox);

    // Add theme toggle functionality
    const themeToggle = chatbox.querySelector('#theme-toggle');
    themeToggle.addEventListener('click', toggleTheme);

    // Add send functionality
    const sendButton = chatbox.querySelector('#send-button');
    const userInput = chatbox.querySelector('#user-input');
    
    sendButton.addEventListener('click', () => sendMessage(userInput.value));
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(userInput.value);
        }
    });

    // Append to DOM first
    document.body.appendChild(chatbox);

    // Apply saved theme
    const savedTheme = await config.getTheme();
    applyTheme(savedTheme);

    // Force a reflow before adding the visible class
    chatbox.offsetHeight;

    // Add visible class to trigger animation
    chatbox.classList.add('chatbox-visible');
}

// Close chatbox with animation
function closeChatbox() {
    if (!chatbox) return;

    // Add closing animation class
    chatbox.classList.remove('chatbox-visible');
    chatbox.classList.add('chatbox-hidden');

    // Remove document-level event listeners first
    if (dragListener) {
        document.removeEventListener('mousemove', dragListener);
    }
    if (stopDragListener) {
        document.removeEventListener('mouseup', stopDragListener);
    }

    // Set a timeout to ensure animation completes
    setTimeout(() => {
        if (chatbox && chatbox.parentElement) {
            // Remove the chatbox from DOM
            chatbox.parentElement.removeChild(chatbox);
            
            // Clear chat history
            apiService.clearHistory();
            
            // Reset chatbox variable and event listeners
            chatbox = null;
            dragListener = null;
            stopDragListener = null;
        }
    }, 300); // Match this with the animation duration in CSS
}

// Handle dragging
function startDragging(e) {
    if (e.target.tagName === 'BUTTON') return;
    isDragging = true;
    chatbox.classList.add('dragging');
    const rect = chatbox.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
}

function drag(e) {
    if (!isDragging) return;

    const x = e.clientX - dragOffset.x;
    const y = e.clientY - dragOffset.y;

    // Keep chatbox within viewport
    const box = chatbox.getBoundingClientRect();
    const maxX = window.innerWidth - box.width;
    const maxY = window.innerHeight - box.height;

    chatbox.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
    chatbox.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
    chatbox.style.right = 'auto';
    chatbox.style.bottom = 'auto';
}

function stopDragging() {
    isDragging = false;
    chatbox.classList.remove('dragging');
}

// Toggle minimize
function toggleMinimize() {
    const messages = chatbox.querySelector('#messages');
    const inputArea = chatbox.querySelector('#input-area');
    const minimizeBtn = chatbox.querySelector('#minimize');

    if (messages.style.display === 'none') {
        messages.style.display = 'flex';
        inputArea.style.display = 'flex';
        minimizeBtn.textContent = '−';
        chatbox.style.height = '500px';
    } else {
        messages.style.display = 'none';
        inputArea.style.display = 'none';
        minimizeBtn.textContent = '+';
        chatbox.style.height = 'auto';
    }
}

// Clear chat
function clearChat() {
    const messages = chatbox.querySelector('#messages');
    messages.innerHTML = '';
    apiService.clearHistory();
}

// Add a message to the chat
function addMessage(text, isUser = false, isError = false) {
    const messages = chatbox.querySelector('#messages');
    const message = document.createElement('div');
    message.className = `message ${isUser ? 'user-message' : isError ? 'error-message' : 'ai-message'}`;
    message.textContent = text;
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
}

// Set loading state
function setLoading(isLoading) {
    const sendButton = chatbox.querySelector('#send-button');
    const spinner = sendButton.querySelector('.loading-spinner');
    const svg = sendButton.querySelector('svg');
    
    if (isLoading) {
        spinner.style.display = 'block';
        svg.style.display = 'none';
        sendButton.disabled = true;
    } else {
        spinner.style.display = 'none';
        svg.style.display = 'block';
        sendButton.disabled = false;
    }
}

// Apply theme
function applyTheme(theme) {
    if (!chatbox) return;
    
    chatbox.setAttribute('data-theme', theme);
    const lightIcon = chatbox.querySelector('.light-icon');
    const darkIcon = chatbox.querySelector('.dark-icon');
    
    if (lightIcon && darkIcon) {
        lightIcon.style.display = theme === 'light' ? 'block' : 'none';
        darkIcon.style.display = theme === 'dark' ? 'block' : 'none';
    }
}

// Toggle theme
async function toggleTheme() {
    const currentTheme = chatbox.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    applyTheme(newTheme);
    await config.setTheme(newTheme);
}

// Send a message
async function sendMessage(text, context = '') {
    if (!text.trim()) return;

    const userInput = chatbox.querySelector('#user-input');
    userInput.value = '';

    addMessage(text, true);
    setLoading(true);

    try {
        const response = await apiService.chat(text, context);
        addMessage(response);
    } catch (error) {
        addMessage(error.message, false, true);
        console.error('Error:', error);
    } finally {
        setLoading(false);
    }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'summarize') {
        createChatbox();
        sendMessage('Please summarize the selected text.', request.text);
    } else if (request.action === 'chat') {
        createChatbox();
        sendMessage('Let\'s discuss the selected text.', request.text);
    } else if (request.action === 'themeChanged') {
        applyTheme(request.theme);
    }
}); 