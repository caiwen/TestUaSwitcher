(function() {
    chrome.storage.local.get('userAgent', (data) => {
        const ua = data.userAgent;
        if (!ua) return;
        // 覆盖 navigator.userAgent
        Object.defineProperty(navigator, 'userAgent', {
            value: ua,
            configurable: false
        });
        if (ua.toLowerCase().startsWith('test')) {
            // 页面加载后显示红字标记
            window.addEventListener('DOMContentLoaded', () => {
                const div = document.createElement('div');
                div.textContent = `当前环境: ${ua}`;
                Object.assign(div.style, {
                    position: 'fixed',
                    top: '10px',
                    right: '10px',
                    color: 'red',
                    background: 'rgba(255,255,255,0.8)',
                    padding: '5px',
                    zIndex: 99999,
                    fontSize: '14px'
                });
                document.body.appendChild(div);
            });
        }
    });
})();
