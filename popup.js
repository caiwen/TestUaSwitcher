document.addEventListener('DOMContentLoaded', () => {
    const uaSelect = document.getElementById('uaSelect');
    const uaInput = document.getElementById('uaInput');
    const saveBtn = document.getElementById('saveBtn');
    const mobileCheckbox = document.getElementById('mobileCheckbox'); // 新增复选框引用

    // 读取当前 UA 和移动端状态
    chrome.storage.local.get(['userAgent', 'isMobile'], (data) => {
        const ua = data.userAgent || navigator.userAgent;
        // 如果之前保存的是 *.mobile，就去掉 .mobile 后显示在输入框
        uaInput.value = ua.replace(/\.mobile$/, '');
        // 如果保存的 UA 以 .mobile 结尾或者保存了 isMobile，则勾选复选框
        mobileCheckbox.checked = data.isMobile || /\.mobile$/.test(ua);
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
            // 勾选移动端则拼接 .mobile
            if (isMobile && !ua.endsWith('.mobile')) {
                ua += '.mobile';
            }

            chrome.storage.local.set({ isMobile }); // 保存复选框状态

            chrome.runtime.sendMessage({ type: 'SET_UA', ua }, (response) => {
                if (response.success) {
                    const statusMessage = document.getElementById('statusMessage');
                    statusMessage.textContent = '测试环境已更新！刷新页面生效';

                    // 获取当前活动标签页并刷新
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
});
