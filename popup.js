document.addEventListener('DOMContentLoaded', () => {
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const messages = document.getElementById('messages');

    // Function to add a message to the chat
    function addMessage(text, isUser = false) {
        const message = document.createElement('div');
        message.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        message.textContent = text;
        messages.appendChild(message);
        messages.scrollTop = messages.scrollHeight;
    }

    // Function to handle sending messages
    async function handleSend() {
        const text = userInput.value.trim();
        if (!text) return;

        userInput.value = '';
        addMessage(text, true);

        try {
            // TODO: Replace with actual API call
            const response = await mockAIResponse(text);
            addMessage(response);
        } catch (error) {
            addMessage('Sorry, I encountered an error. Please try again.');
            console.error('Error:', error);
        }
    }

    // Mock AI response for testing (replace with actual API call)
    async function mockAIResponse(text) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(`This is a mock response to: "${text}". Replace this with actual API integration.`);
            }, 1000);
        });
    }

    // Add event listeners
    sendButton.addEventListener('click', handleSend);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    // Focus input on popup open
    userInput.focus();
}); 