document.addEventListener('DOMContentLoaded', async () => {
    const apiKeyInput = document.getElementById('api-key');
    const saveButton = document.getElementById('save');
    const testButton = document.getElementById('test');
    const statusDiv = document.getElementById('status');
    const themeToggle = document.getElementById('theme-toggle');
    const lightIcon = document.querySelector('.light-icon');
    const darkIcon = document.querySelector('.dark-icon');

    // Load saved API key
    const apiKey = await config.getApiKey();
    if (apiKey) {
        apiKeyInput.value = apiKey;
    }

    // Load and apply saved theme
    const savedTheme = await config.getTheme();
    applyTheme(savedTheme);

    // Function to show status message
    function showStatus(message, isError = false) {
        statusDiv.textContent = message;
        statusDiv.className = `status ${isError ? 'error' : 'success'}`;
        setTimeout(() => {
            statusDiv.className = 'status';
        }, 5000);
    }

    // Function to set loading state
    function setLoading(isLoading) {
        document.body.classList.toggle('loading', isLoading);
        saveButton.disabled = isLoading;
        testButton.disabled = isLoading;
    }

    // Function to validate API key format
    function isValidApiKeyFormat(apiKey) {
        // OpenAI API keys can start with different prefixes and are typically ~51 characters
        return /^(sk-|org-)[\w-]{30,}$/.test(apiKey);
    }

    // Function to test API key
    async function testApiKey(apiKey) {
        try {
            setLoading(true);
            await apiService.validateApiKey(apiKey);
            showStatus('API key is valid!');
            return true;
        } catch (error) {
            showStatus(error.message, true);
            return false;
        } finally {
            setLoading(false);
        }
    }

    // Function to apply theme
    function applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        lightIcon.style.display = theme === 'light' ? 'block' : 'none';
        darkIcon.style.display = theme === 'dark' ? 'block' : 'none';

        // Notify all tabs about theme change
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'themeChanged',
                    theme: theme
                }).catch(() => {
                    // Ignore errors for tabs where content script is not injected
                });
            });
        });
    }

    // Save API key
    saveButton.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();

        if (!apiKey) {
            showStatus('Please enter an API key', true);
            return;
        }

        if (!isValidApiKeyFormat(apiKey)) {
            showStatus('Invalid API key format. It should start with "sk-" or "org-" and be at least 32 characters long.', true);
            return;
        }

        try {
            setLoading(true);
            await config.setApiKey(apiKey);
            const isValid = await testApiKey(apiKey);
            if (isValid) {
                showStatus('API key saved and validated successfully');
            }
        } catch (error) {
            showStatus('Failed to save API key: ' + error.message, true);
            console.error('Error saving API key:', error);
        } finally {
            setLoading(false);
        }
    });

    // Test API key
    testButton.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();

        if (!apiKey) {
            showStatus('Please enter an API key to test', true);
            return;
        }

        if (!isValidApiKeyFormat(apiKey)) {
            showStatus('Invalid API key format. It should start with "sk-" or "org-" and be at least 32 characters long.', true);
            return;
        }

        await testApiKey(apiKey);
    });

    // Toggle theme
    themeToggle.addEventListener('click', async () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        applyTheme(newTheme);
        await config.setTheme(newTheme);
    });
}); 