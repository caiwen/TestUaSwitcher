let currentUA = '';

// 初始化时获取UA并更新规则
chrome.storage.local.get('userAgent', (data) => {
    currentUA = data.userAgent || navigator.userAgent;
    updateRule(); // 在获取到UA后立即更新规则
});

function updateRule() {
    // 使用单一规则匹配所有 testhomary.com 域名
    const rule = {
        id: 1,
        priority: 1,
        action: {
            type: "modifyHeaders",
            requestHeaders: [{ header: "User-Agent", operation: "set", value: currentUA }]
        },
        condition: {
            "urlFilter": "testhomary.com",
            "resourceTypes": ["main_frame", "sub_frame", "xmlhttprequest", "script", "stylesheet", "image", "font", "other"]
        }
    };

    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [1, 2],
        addRules: [rule]
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
