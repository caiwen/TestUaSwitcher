// background.js
let currentUA = '';
const ruleId = 1001;
chrome.storage.local.get('userAgent', (data) => {
    currentUA = data.userAgent || navigator.userAgent;
});

// 更新或新增动态规则
function updateRule(newUA,callback) {
    const rule = {
        id: ruleId,
        priority: 1,
        action: {
            type: "modifyHeaders",
            requestHeaders: [
                { header: "User-Agent", operation: "set", value: newUA }
            ]
        },
        condition: {
            // 匹配 testhomary.com 及所有子域名
            regexFilter: "https?://([a-z0-9-]+\\.)*testhomary\\.com/.*",
            resourceTypes: [
                "main_frame","sub_frame","xmlhttprequest","script",
                "stylesheet","image","font","other"
            ]
        }
    };
    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [ruleId],
        addRules: [rule]
    }, () => {
        if (chrome.runtime.lastError) {
            console.error('规则更新失败:', chrome.runtime.lastError.message);
            callback(false);
        } else {
            currentUA = newUA; // 更新内存
            callback(true);
        }
    });
}
function setUAAtomically(newUA) {
    return new Promise((resolve, reject) => {
        // 先写入 storage
        chrome.storage.local.set({ userAgent: newUA }, () => {
            if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
            // 再更新 UA 头
            updateRule(newUA, (success) => {
                if (success) {
                    resolve(true);  // 都成功
                } else {
                    // 回退 storage
                    chrome.storage.local.set({ userAgent: currentUA }, () => {
                        reject(new Error('更新 UA 失败，已回退 storage'));
                    });
                }
            });
        });
    });
}

// 监听 popup 消息，更新 UA
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'SET_UA') {
        setUAAtomically(msg.ua)
            .then(() => sendResponse({ success: true }))
            .catch(err => console.error(err.message))
        return true;
    }
});
