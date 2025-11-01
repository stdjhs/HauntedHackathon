/* ====================================
   PWA离线支持系统 v4.0.0
   功能：Service Worker、离线缓存、应用安装
   ==================================== */

class PWAOfflineSystem {
    constructor() {
        this.serviceWorker = null;
        this.isInstalled = false;
        this.updateAvailable = false;
        this.cacheName = 'halloween-mbti-v4.0.0';
        this.init();
    }

    async init() {
        // 检查PWA支持
        if ('serviceWorker' in navigator) {
            await this.registerServiceWorker();
        }

        // 检查是否已安装
        this.checkInstallationStatus();

        // 监听安装提示
        this.setupInstallPrompt();

        console.log('📱 PWA离线系统初始化完成');
    }

    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            this.serviceWorker = registration;

            // 检查更新
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.updateAvailable = true;
                        this.showUpdateNotification();
                    }
                });
            });

            console.log('✅ Service Worker注册成功');
        } catch (error) {
            console.error('Service Worker注册失败:', error);
        }
    }

    checkInstallationStatus() {
        // 检查是否以独立模式运行
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.isInstalled = true;
        }

        // 检查iOS Safari添加到主屏幕
        if (window.navigator.standalone === true) {
            this.isInstalled = true;
        }
    }

    setupInstallPrompt() {
        let deferredPrompt = null;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            this.showInstallButton();
        });

        // 处理安装
        window.addEventListener('appinstalled', () => {
            this.isInstalled = true;
            console.log('🎉 应用已安装到设备');
            this.hideInstallButton();
        });

        // 保存安装提示以便后续使用
        this.deferredPrompt = deferredPrompt;
    }

    showInstallButton() {
        // 创建安装按钮
        const installButton = document.createElement('button');
        installButton.id = 'pwa-install-button';
        installButton.innerHTML = '📱 安装应用';
        installButton.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 20px;
            padding: 12px 24px;
            background: linear-gradient(135deg, var(--halloween-orange), var(--blood-red));
            color: white;
            border: none;
            border-radius: 25px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(248, 165, 28, 0.4);
            z-index: 10000;
            transition: all 0.3s ease;
        `;

        installButton.addEventListener('click', () => this.promptInstall());

        document.body.appendChild(installButton);

        // 自动隐藏按钮
        setTimeout(() => {
            if (installButton.parentNode) {
                installButton.style.opacity = '0';
                setTimeout(() => installButton.remove(), 300);
            }
        }, 10000);
    }

    async promptInstall() {
        if (!this.deferredPrompt) return;

        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('✅ 用户接受了安装提示');
        } else {
            console.log('❌ 用户拒绝了安装提示');
        }

        this.deferredPrompt = null;
        this.hideInstallButton();
    }

    hideInstallButton() {
        const button = document.getElementById('pwa-install-button');
        if (button) {
            button.remove();
        }
    }

    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.id = 'pwa-update-notification';
        notification.innerHTML = `
            <div class="update-content">
                <h3>🔄 应用有更新</h3>
                <p>新版本已就绪，是否现在更新？</p>
                <div class="update-buttons">
                    <button id="update-now" class="creepy-button">立即更新</button>
                    <button id="update-later" class="creepy-button secondary">稍后</button>
                </div>
            </div>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(11, 12, 30, 0.95);
            border: 2px solid var(--halloween-orange);
            border-radius: 15px;
            padding: 30px;
            z-index: 10001;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        `;

        document.body.appendChild(notification);

        // 绑定按钮事件
        document.getElementById('update-now').addEventListener('click', () => {
            this.applyUpdate();
            notification.remove();
        });

        document.getElementById('update-later').addEventListener('click', () => {
            notification.remove();
        });
    }

    applyUpdate() {
        if (this.serviceWorker && this.serviceWorker.waiting) {
            this.serviceWorker.waiting.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
        }
    }

    // 缓存管理
    async cacheResource(url) {
        if (!this.serviceWorker) return;

        const cache = await caches.open(this.cacheName);
        try {
            await cache.add(url);
            console.log(`📦 已缓存: ${url}`);
        } catch (error) {
            console.error(`缓存失败: ${url}`, error);
        }
    }

    // 预缓存关键资源
    async precacheResources() {
        const resources = [
            '/',
            '/halloween_mbti.html',
            '/styles/base.css',
            '/styles/layout.css',
            '/styles/components.css',
            '/styles/animations.css',
            '/halloween_script.js',
            '/halloween_styles.css'
        ];

        await Promise.all(resources.map(url => this.cacheResource(url)));
        console.log('✅ 关键资源预缓存完成');
    }

    // 检查网络状态
    checkNetworkStatus() {
        const updateOnlineStatus = () => {
            const status = navigator.onLine ? 'online' : 'offline';
            console.log(`🌐 网络状态: ${status}`);

            if (!navigator.onLine) {
                this.showOfflineMessage();
            } else {
                this.hideOfflineMessage();
            }
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        updateOnlineStatus();
    }

    showOfflineMessage() {
        const message = document.createElement('div');
        message.id = 'offline-message';
        message.innerHTML = '📴 您当前处于离线状态';
        message.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #f57c00;
            color: white;
            padding: 10px;
            text-align: center;
            z-index: 10000;
            font-weight: bold;
        `;

        document.body.appendChild(message);
    }

    hideOfflineMessage() {
        const message = document.getElementById('offline-message');
        if (message) {
            message.remove();
        }
    }
}

// Service Worker内容 (生成sw.js文件内容)
const generateServiceWorkerContent = () => `
const CACHE_NAME = 'halloween-mbti-v4.0.0';
const urlsToCache = [
    '/',
    '/halloween_mbti.html',
    '/styles/base.css',
    '/styles/layout.css',
    '/styles/components.css',
    '/styles/animations.css',
    '/halloween_script.js',
    '/halloween_styles.css'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            }
        )
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
`;

// 创建manifest.json内容
const generateManifestContent = () => ({
    name: "万圣节惊吓版 MBTI 测试",
    short_name: "万圣节MBTI",
    description: "沉浸式万圣节主题MBTI人格测试",
    start_url: "/halloween_mbti.html",
    display: "standalone",
    background_color: "#0B0C1E",
    theme_color: "#F8A51C",
    icons: [
        {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png"
        },
        {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png"
        }
    ],
    categories: ["entertainment", "games", "lifestyle"]
});

// 导出
export { PWAOfflineSystem, generateServiceWorkerContent, generateManifestContent };
