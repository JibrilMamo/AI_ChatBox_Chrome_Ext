// OpenAI API Configuration
window.config = {
    API_URL: 'https://api.openai.com/v1/chat/completions',
    MODEL: 'gpt-3.5-turbo',
    MAX_TOKENS: 500,
    TEMPERATURE: 0.7,
    // Store API key in chrome.storage.local
    getApiKey: async () => {
        const result = await chrome.storage.local.get(['openai_api_key']);
        return result.openai_api_key;
    },
    setApiKey: async (apiKey) => {
        await chrome.storage.local.set({ openai_api_key: apiKey });
    },
    // Theme settings
    getTheme: async () => {
        const result = await chrome.storage.local.get(['theme']);
        return result.theme || 'light';
    },
    setTheme: async (theme) => {
        await chrome.storage.local.set({ theme });
    }
};

// Message templates for different actions
window.templates = {
    summarize: (text) => `Please provide a concise summary of the following text:\n\n${text}`,
    chat: (text) => `Context: ${text}\n\nUser: `,
    error: {
        noApiKey: 'Please set your OpenAI API key in the extension settings.',
        invalidApiKey: 'Invalid API key. Please check your OpenAI API key.',
        apiError: 'Error communicating with the AI service. Please try again.',
        emptyInput: 'Please enter some text to process.'
    }
}; 