// Create context menu items when extension is installed
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'summarize',
        title: 'Summarize Selection',
        contexts: ['selection']
    });

    chrome.contextMenus.create({
        id: 'chat',
        title: 'Chat About Selection',
        contexts: ['selection']
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (!tab || !tab.id) return;

    try {
        // Check if we can access the tab
        const tabInfo = await chrome.tabs.get(tab.id);
        if (!tabInfo.url.startsWith('chrome://') && !tabInfo.url.startsWith('edge://')) {
            // Send message to content script
            chrome.tabs.sendMessage(tab.id, {
                action: info.menuItemId,
                text: info.selectionText
            }).catch((error) => {
                // If content script is not yet injected, inject it first
                if (error.message.includes('Receiving end does not exist')) {
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ['config.js', 'api-service.js', 'content.js']
                    }).then(() => {
                        // After injection, try sending the message again
                        setTimeout(() => {
                            chrome.tabs.sendMessage(tab.id, {
                                action: info.menuItemId,
                                text: info.selectionText
                            });
                        }, 100);
                    });
                }
            });
        }
    } catch (error) {
        console.error('Error in context menu handler:', error);
    }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getSelectedText') {
        chrome.tabs.sendMessage(sender.tab.id, {
            action: 'getSelectedText'
        }, sendResponse);
        return true;
    }
}); 