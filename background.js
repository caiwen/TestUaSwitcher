let currentUA = '';
let ruleId = 1001; // 动态规则 ID，避免和其他规则冲突

// 初始化时获取 UA 并更新规则
chrome.storage.local.get('userAgent', (data) => {
    currentUA = data.userAgent || navigator.userAgent;
    updateRule();
});

// 更新或新增动态规则
function updateRule() {
    const rule = {
        id: ruleId,
        priority: 1,
        action: {
            type: "modifyHeaders",
            requestHeaders: [
                { header: "User-Agent", operation: "set", value: currentUA }
            ]
        },
        condition: {
            // 使用正则匹配所有子域名
            regexFilter: "https?://([a-z0-9-]+\\.)*testhomary\\.com/.*",
            resourceTypes: [
                "main_frame", "sub_frame", "xmlhttprequest", "script",
                "stylesheet", "image", "font", "other"
            ]
        }
    };

    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [ruleId],
        addRules: [rule]
    }, () => {
        if (chrome.runtime.lastError) {
            console.error('规则更新失败:', chrome.runtime.lastError);
        } else {
            console.log('规则更新成功，当前 UA:', currentUA);
        }
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
