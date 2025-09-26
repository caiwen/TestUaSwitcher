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

function getAllStoragePromise() {
    return new Promise((resolve) => {
        chrome.storage.local.get(null, (items) => resolve(items || {}));
    });
}

function updateRulePromise(newUA) {
    return new Promise((resolve, reject) => {
        updateRule(newUA, (ok) => {
            if (ok) resolve();
            else reject(new Error('updateRule failed'));
        });
    });
}

function setStoragePromise(obj) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set(obj, () => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else resolve();
        });
    });
}
function clearStoragePromise() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.clear(() => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else resolve();
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

    if (msg.type === 'RESET_UA') {

        // 事务化重置：要么清空 storage + 恢复默认 UA，要么回滚不改变任何东西
        (async () => {
            const defaultUA = navigator.userAgent;
            const prevUA = currentUA || navigator.userAgent;
            const prevStorage = await getAllStoragePromise(); // 备份全部 storage

            try {
                // 1) 先尝试把请求头恢复到默认 UA（不触及 storage）
                await updateRulePromise(defaultUA);

                // 2) 然后清空 storage
                try {
                    await clearStoragePromise();
                    // 成功：重置完成
                    sendResponse({ success: true });
                } catch (clearErr) {
                    console.error('清空 storage 失败，尝试回滚:', clearErr);
                    // 尝试回滚：先恢复 storage 再恢复 UA
                    try {
                        await setStoragePromise(prevStorage);
                        await updateRulePromise(prevUA);
                        sendResponse({ success: false, message: '清空 storage 失败，已回滚' });
                    } catch (rollbackErr) {
                        console.error('回滚也失败:', rollbackErr);
                        sendResponse({ success: false, message: '重置失败且回滚失败，查看 background 日志' });
                    }
                }
            } catch (updateErr) {
                console.error('将请求头恢复为默认 UA 失败:', updateErr);
                // 不改变 storage，直接返回失败
                sendResponse({ success: false, message: '恢复默认 UA 失败' });
            }
        })();

        return true; // 表示会异步调用 sendResponse
    }


});
