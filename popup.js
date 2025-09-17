document.addEventListener('DOMContentLoaded', () => {
    const uaSelect = document.getElementById('uaSelect');
    const uaInput = document.getElementById('uaInput');
    const saveBtn = document.getElementById('saveBtn');

    // 读取当前 UA
    chrome.storage.local.get('userAgent', (data) => {
        const ua = data.userAgent || navigator.userAgent;
        uaInput.value = ua;
    });

    // 下拉框改变时自动填充输入框
    uaSelect.addEventListener('change', () => {
        if (uaSelect.value) {
            uaInput.value = uaSelect.value;
        }
    });

    // 保存 UA
    saveBtn.addEventListener('click', () => {
        const ua = uaInput.value.trim();
        if (ua) {
            chrome.runtime.sendMessage({ type: 'SET_UA', ua }, (response) => {
                if (response.success) {
                    alert('测试环境 已更新！刷新页面生效');
                }
            });
        }
    });
});
