document.addEventListener('DOMContentLoaded', () => {
    const uaSelect = document.getElementById('uaSelect');
    const uaInput = document.getElementById('uaInput');
    const saveBtn = document.getElementById('saveBtn');
    const resetBtn = document.getElementById('resetBtn'); // 新增重置按钮引用
    const mobileCheckbox = document.getElementById('mobileCheckbox'); // 新增复选框引用

    // 读取当前 UA 和移动端状态
    chrome.storage.local.get(['userAgent', 'isMobile'], (data) => {
        const ua = data.userAgent || navigator.userAgent;
        // 如果之前保存的是 *.mobile，就去掉 .mobile 后显示在输入框
        uaInput.value = ua.replace(/\.mobile$/, '');
        uaSelect.value = uaInput.value;
        // 如果保存的 UA 以 .mobile 结尾或者保存了 isMobile，则勾选复选框
        mobileCheckbox.checked =  /\.mobile$/.test(ua);
    });

    // 下拉框改变时自动填充输入框
    uaSelect.addEventListener('change', () => {
        if (uaSelect.value) {
            uaInput.value = uaSelect.value;
        }
    });

    // 保存 UA
    saveBtn.addEventListener('click', () => {
        let ua = uaInput.value.trim();
        const isMobile = mobileCheckbox.checked;

        if (ua) {
            saveBtn.disabled = true;
            saveBtn.textContent = '切换中...';
            // 勾选移动端则拼接 .mobile
            if (isMobile && !ua.endsWith('.mobile')) {
                ua += '.mobile';
            }
            chrome.runtime.sendMessage({ type: 'SET_UA', ua }, (response) => {
                if (response.success) {
                    const statusMessage = document.getElementById('statusMessage');
                    saveBtn.disabled = false;
                    saveBtn.textContent = '保存';
                    statusMessage.textContent = '测试环境已更新！正在刷新页面...';
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        if (tabs.length > 0) {
                            chrome.tabs.reload(tabs[0].id);
                        }
                    });
                    setTimeout(() => {
                        statusMessage.textContent = '';
                    }, 2000);
                }
            });
        }
    });

    resetBtn.addEventListener('click', () => {
        resetBtn.disabled = true;
        resetBtn.textContent = '重置中...';
        chrome.runtime.sendMessage({ type: 'RESET_UA' }, (response) => {
            resetBtn.disabled = false;
            resetBtn.textContent = '重置';
            if (response.success) {
                statusMessage.textContent = '已恢复默认 UA，正在刷新页面...';
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs.length > 0) {
                        chrome.tabs.reload(tabs[0].id);
                    }
                });
                setTimeout(() => statusMessage.textContent = '', 2000);
            } else {
                statusMessage.textContent = '重置失败，请重试';
            }
        });
    });


});
