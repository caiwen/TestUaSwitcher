let currentUA = '';

chrome.storage.local.get('userAgent', (data) => {
    currentUA = data.userAgent || navigator.userAgent;
});

function updateRule() {
    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [1],
        addRules: [
            {
                id: 1,
                priority: 1,
                action: {
                    type: "modifyHeaders",
                    requestHeaders: [{ header: "User-Agent", operation: "set", value: currentUA }]
                },
                condition: { urlFilter: "|testhomary.com" }
            }
        ]
    });
}

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'SET_UA') {
        currentUA = msg.ua;
        chrome.storage.local.set({ userAgent: currentUA }, updateRule);
        sendResponse({ success: true });
    }
});
