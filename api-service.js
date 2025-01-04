// ApiService class definition
class ApiService {
    constructor() {
        this.messageHistory = [];
    }

    async getApiKey() {
        const apiKey = await config.getApiKey();
        if (!apiKey) {
            throw new Error(templates.error.noApiKey);
        }
        return apiKey;
    }

    async validateApiKey(apiKey) {
        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error(templates.error.invalidApiKey);
                }
                throw new Error(templates.error.apiError);
            }

            return true;
        } catch (error) {
            console.error('API Key validation error:', error);
            throw error;
        }
    }

    async callApi(messages) {
        const apiKey = await this.getApiKey();

        try {
            const response = await fetch(config.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: config.MODEL,
                    messages: messages,
                    max_tokens: config.MAX_TOKENS,
                    temperature: config.TEMPERATURE
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (response.status === 401) {
                    throw new Error(templates.error.invalidApiKey);
                } else if (errorData.error?.message) {
                    throw new Error(errorData.error.message);
                }
                throw new Error(templates.error.apiError);
            }

            const data = await response.json();
            if (!data.choices || !data.choices[0]?.message?.content) {
                throw new Error(templates.error.apiError);
            }

            return data.choices[0].message.content;
        } catch (error) {
            console.error('API call error:', error);
            throw error;
        }
    }

    async chat(userInput, context = '') {
        if (!userInput.trim()) {
            throw new Error(templates.error.emptyInput);
        }

        // Add context if provided
        if (context) {
            this.messageHistory = [{
                role: 'system',
                content: templates.chat(context)
            }];
        }

        // Add user message to history
        this.messageHistory.push({
            role: 'user',
            content: userInput
        });

        try {
            // Get AI response
            const response = await this.callApi(this.messageHistory);

            // Add AI response to history
            this.messageHistory.push({
                role: 'assistant',
                content: response
            });

            return response;
        } catch (error) {
            // If there's an API key error, clear the message history
            if (error.message.includes('API key')) {
                this.clearHistory();
            }
            throw error;
        }
    }

    async summarize(text) {
        if (!text.trim()) {
            throw new Error(templates.error.emptyInput);
        }

        const messages = [{
            role: 'user',
            content: templates.summarize(text)
        }];

        return await this.callApi(messages);
    }

    clearHistory() {
        this.messageHistory = [];
    }
}

// Create global instance
window.apiService = new ApiService(); 