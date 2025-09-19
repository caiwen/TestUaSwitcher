// background.js

let currentUA = '';
let lastAppliedUA = ''; // 记录上一次成功应用的 UA
const ruleId = 1001; // 动态规则 ID，避免冲突

// 初始化：从存储获取 UA 或使用浏览器默认 UA
chrome.storage.local.get('userAgent', (data) => {
    currentUA = data.userAgent || navigator.userAgent;
    lastAppliedUA = currentUA;
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
            console.error('规则更新失败:', chrome.runtime.lastError);
            // 回退内存 UA 保持一致
            currentUA = lastAppliedUA;
        } else {
            console.log('规则更新成功，当前 UA:', currentUA);
            // 记录成功应用的 UA
            lastAppliedUA = currentUA;
        }
    });
}

// 可选：重试机制，避免偶发错误导致 UA 不一致
function retryUpdateRule(retries = 3, delay = 1000) {
    updateRule();
    if (chrome.runtime.lastError && retries > 0) {
        setTimeout(() => retryUpdateRule(retries - 1, delay), delay);
    }
}

// 监听 popup 消息，更新 UA
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'SET_UA') {
        currentUA = msg.ua;
        chrome.storage.local.set({ userAgent: currentUA }, () => {
            updateRule();
            sendResponse({ success: true });
        });
        // 返回 true 表示异步响应
        return true;
    }
});
