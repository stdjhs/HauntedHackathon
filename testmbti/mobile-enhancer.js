/* ====================================
   移动端体验增强系统
   版本: v4.0.0
   目标: 优化移动端体验和响应式设计
   特性: 触摸优化、手势支持、响应式布局、视口适配
   ==================================== */

// ====================================
// 移动设备检测器
// ====================================
class MobileDeviceDetector {
    constructor() {
        this.deviceInfo = {
            isMobile: this.checkIsMobile(),
            isTablet: this.checkIsTablet(),
            isIOS: this.checkIsIOS(),
            isAndroid: this.checkIsAndroid(),
            hasNotch: this.checkHasNotch(),
            screenSize: this.getScreenSize(),
            orientation: this.getOrientation(),
            pixelRatio: window.devicePixelRatio || 1,
            touchPoints: navigator.maxTouchPoints || 0
        };
    }

    checkIsMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768;
    }

    checkIsTablet() {
        return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent) ||
               (window.innerWidth > 768 && window.innerWidth <= 1024);
    }

    checkIsIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent);
    }

    checkIsAndroid() {
        return /Android/.test(navigator.userAgent);
    }

    checkHasNotch() {
        return this.isIOS && (window.screen.height !== window.innerHeight);
    }

    getScreenSize() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            availWidth: screen.availWidth,
            availHeight: screen.availHeight
        };
    }

    getOrientation() {
        return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    }

    getInfo() {
        return this.deviceInfo;
    }
}

// ====================================
// 视口适配器
// ====================================
class ViewportAdapter {
    constructor() {
        this.init();
    }

    init() {
        this.setupViewportMeta();
        this.handleViewportChanges();
        this.adaptToScreenSize();
    }

    setupViewportMeta() {
        let viewport = document.querySelector('meta[name=viewport]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }

        // 移动端视口设置
        viewport.content = [
            'width=device-width',
            'initial-scale=1.0',
            'maximum-scale=5.0',
            'minimum-scale=1.0',
            'user-scalable=yes',
            'viewport-fit=cover'
        ].join(',');
    }

    handleViewportChanges() {
        window.addEventListener('resize', () => {
            this.handleResize();
            this.adaptToScreenSize();
        });

        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
                this.adaptToScreenSize();
            }, 100);
        });

        // iOS Safari 地址栏隐藏/显示
        window.addEventListener('scroll', this.throttle(() => {
            this.handleScroll();
        }, 100));
    }

    handleResize() {
        document.body.classList.toggle('is-landscape', window.innerWidth > window.innerHeight);
        document.body.classList.toggle('is-portrait', window.innerWidth <= window.innerHeight);
    }

    handleOrientationChange() {
        // 强制重新计算布局
        document.body.style.display = 'none';
        document.body.offsetHeight; // 触发重排
        document.body.style.display = '';
    }

    handleScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        document.body.classList.toggle('is-scrolled', scrollTop > 50);
    }

    adaptToScreenSize() {
        const width = window.innerWidth;
        const root = document.documentElement;

        // 动态调整根字体大小（响应式文字）
        const baseSize = Math.min(width / 375 * 16, 20); // 以375px为基准，最大20px
        root.style.fontSize = `${baseSize}px`;

        // 动态调整间距
        const spacing = Math.min(width / 375 * 20, 30);
        root.style.setProperty('--spacing-mobile', `${spacing}px`);

        // 隐藏/显示移动端特定元素
        this.toggleMobileElements(width <= 768);
    }

    toggleMobileElements(isMobile) {
        document.body.classList.toggle('is-mobile', isMobile);
        document.body.classList.toggle('is-desktop', !isMobile);
    }
}

// ====================================
// 触摸交互增强器
// ====================================
class TouchInteractionEnhancer {
    constructor() {
        this.touchStartY = 0;
        this.touchStartX = 0;
        this.swipeThreshold = 50;
        this.init();
    }

    init() {
        this.enhanceTouchTargets();
        this.addSwipeGestures();
        this.addPullToRefresh();
        this.addLongPress();
        this.addHapticFeedback();
    }

    enhanceTouchTargets() {
        // 确保所有可点击元素满足最小44px触摸目标
        const style = document.createElement('style');
        style.textContent = `
            .creepy-button,
            .answer-option,
            .admin-fab-btn {
                min-height: 44px;
                min-width: 44px;
                touch-action: manipulation;
                -webkit-tap-highlight-color: transparent;
            }

            @media (max-width: 768px) {
                .creepy-button {
                    padding: 14px 32px;
                    font-size: 16px;
                }

                .question-text {
                    font-size: 18px;
                    line-height: 1.6;
                }

                .answer-option {
                    padding: 16px 20px;
                    margin-bottom: 12px;
                    font-size: 16px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    addSwipeGestures() {
        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;

        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            endY = e.changedTouches[0].clientY;
            this.handleSwipe(startX, startY, endX, endY);
        }, { passive: true });
    }

    handleSwipe(startX, startY, endX, endY) {
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        // 检查是否是有效滑动
        if (Math.max(absDeltaX, absDeltaY) < this.swipeThreshold) {
            return;
        }

        // 水平滑动
        if (absDeltaX > absDeltaY) {
            if (deltaX > 0) {
                this.handleSwipeRight();
            } else {
                this.handleSwipeLeft();
            }
        }
        // 垂直滑动
        else {
            if (deltaY > 0) {
                this.handleSwipeDown();
            } else {
                this.handleSwipeUp();
            }
        }
    }

    handleSwipeLeft() {
        // 左滑：上一题
        if (currentQuestionIndex > 0) {
            this.triggerHapticFeedback();
            // 可以触发上一题逻辑
        }
    }

    handleSwipeRight() {
        // 右滑：下一题或提交
        if (currentQuestionIndex < totalQuestions - 1) {
            this.triggerHapticFeedback();
            // 可以触发下一题逻辑
        }
    }

    handleSwipeUp() {
        // 上滑：显示更多选项或信息
        this.triggerHapticFeedback();
    }

    handleSwipeDown() {
        // 下滑：刷新或返回顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    addPullToRefresh() {
        let startY = 0;
        let currentY = 0;
        let pullDistance = 0;
        let isPulling = false;

        document.addEventListener('touchstart', (e) => {
            if (window.pageYOffset === 0) {
                startY = e.touches[0].clientY;
                isPulling = true;
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!isPulling) return;

            currentY = e.touches[0].clientY;
            pullDistance = currentY - startY;

            if (pullDistance > 0 && pullDistance < 100) {
                // 显示下拉刷新提示
                this.showPullToRefreshIndicator(pullDistance);
                e.preventDefault();
            }
        }, { passive: false });

        document.addEventListener('touchend', () => {
            if (isPulling && pullDistance > 80) {
                this.triggerRefresh();
            }
            this.hidePullToRefreshIndicator();
            isPulling = false;
            pullDistance = 0;
        }, { passive: true });
    }

    showPullToRefreshIndicator(distance) {
        let indicator = document.getElementById('pull-to-refresh');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'pull-to-refresh';
            indicator.style.cssText = `
                position: fixed;
                top: 0;
                left: 50%;
                transform: translateX(-50%);
                background: var(--halloween-orange);
                color: white;
                padding: 10px 20px;
                border-radius: 0 0 20px 20px;
                font-size: 14px;
                z-index: 10000;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(indicator);
        }

        indicator.textContent = '👻 释放以刷新';
        indicator.style.opacity = Math.min(distance / 80, 1);
    }

    hidePullToRefreshIndicator() {
        const indicator = document.getElementById('pull-to-refresh');
        if (indicator) {
            indicator.remove();
        }
    }

    triggerRefresh() {
        this.showRefreshAnimation();
        setTimeout(() => {
            location.reload();
        }, 1000);
    }

    showRefreshAnimation() {
        const spinner = document.createElement('div');
        spinner.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 48px;
            animation: spin 1s linear infinite;
            z-index: 10001;
        `;
        spinner.textContent = '🎃';
        document.body.appendChild(spinner);
    }

    addLongPress() {
        let pressTimer = null;

        document.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                pressTimer = setTimeout(() => {
                    this.handleLongPress(e);
                }, 800);
            }
        }, { passive: true });

        document.addEventListener('touchend', () => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
        }, { passive: true });

        document.addEventListener('touchmove', () => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
        }, { passive: true });
    }

    handleLongPress(e) {
        this.triggerHapticFeedback();
        // 长按功能：显示快捷菜单或帮助信息
        this.showContextMenu(e);
    }

    showContextMenu(e) {
        const menu = document.createElement('div');
        menu.style.cssText = `
            position: fixed;
            background: rgba(11, 12, 30, 0.95);
            border: 2px solid var(--halloween-orange);
            border-radius: 10px;
            padding: 10px;
            z-index: 10000;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        `;

        const items = [
            { text: '🏠 返回首页', action: () => location.reload() },
            { text: '⚙️ 设置', action: () => this.showSettings() },
            { text: '❓ 帮助', action: () => this.showHelp() }
        ];

        items.forEach(item => {
            const button = document.createElement('button');
            button.textContent = item.text;
            button.style.cssText = `
                display: block;
                width: 100%;
                padding: 10px 20px;
                margin: 5px 0;
                background: transparent;
                border: none;
                color: var(--ghost-white);
                font-size: 14px;
                text-align: left;
                cursor: pointer;
            `;
            button.addEventListener('click', () => {
                item.action();
                menu.remove();
            });
            menu.appendChild(button);
        });

        const rect = e.target.getBoundingClientRect();
        menu.style.left = `${rect.left}px`;
        menu.style.top = `${rect.bottom + 5}px`;

        document.body.appendChild(menu);

        setTimeout(() => {
            menu.remove();
        }, 3000);
    }

    showSettings() {
        console.log('显示设置');
    }

    showHelp() {
        console.log('显示帮助');
    }

    addHapticFeedback() {
        // 模拟触觉反馈（视觉反馈作为替代）
        this.vibratePattern = [10, 10, 10];
    }

    triggerHapticFeedback() {
        // 如果支持震动API，使用真实震动
        if ('vibrate' in navigator) {
            navigator.vibrate(this.vibratePattern);
        } else {
            // 否则使用视觉反馈
            document.body.style.animation = 'hapticFeedback 0.1s ease';
            setTimeout(() => {
                document.body.style.animation = '';
            }, 100);
        }
    }
}

// ====================================
// 响应式布局优化器
// ====================================
class ResponsiveLayoutOptimizer {
    constructor() {
        this.breakpoints = {
            mobile: 768,
            tablet: 1024,
            desktop: 1200
        };
        this.init();
    }

    init() {
        this.optimizeLayout();
        this.optimizeTypography();
        this.optimizeSpacing();
        this.optimizeImages();
        this.addLayoutAnimations();
    }

    optimizeLayout() {
        const style = document.createElement('style');
        style.textContent = `
            /* 移动端布局 */
            @media (max-width: ${this.breakpoints.mobile}px) {
                .question-card {
                    margin: 10px;
                    padding: 20px;
                    border-radius: 15px;
                }

                .result-card {
                    margin: 10px;
                    padding: 20px;
                }

                .action-buttons {
                    flex-direction: column;
                    gap: 10px;
                }

                .action-buttons .creepy-button {
                    width: 100%;
                }

                .progress-container {
                    padding: 10px;
                }

                .floating-elements {
                    display: none;
                }

                .parallax-layer {
                    opacity: 0.5;
                }
            }

            /* 平板布局 */
            @media (min-width: ${this.breakpoints.mobile + 1}px) and (max-width: ${this.breakpoints.tablet}px) {
                .question-card,
                .result-card {
                    max-width: 600px;
                    margin: 0 auto;
                }
            }

            /* 横屏适配 */
            @media (orientation: landscape) and (max-height: 500px) {
                .question-card {
                    padding: 15px;
                }

                .question-text {
                    font-size: 16px;
                }

                .answer-option {
                    padding: 12px 16px;
                }

                .floating-elements {
                    display: none;
                }
            }

            /* iPhone X及以上适配 */
            @supports (padding: max(0px)) {
                .question-card,
                .result-card {
                    padding-left: max(20px, env(safe-area-inset-left));
                    padding-right: max(20px, env(safe-area-inset-right));
                    padding-bottom: max(20px, env(safe-area-inset-bottom));
                }

                .action-buttons {
                    padding-bottom: max(20px, env(safe-area-inset-bottom));
                }
            }
        `;
        document.head.appendChild(style);
    }

    optimizeTypography() {
        const style = document.createElement('style');
        style.textContent = `
            /* 响应式字体 */
            .question-text {
                font-size: clamp(18px, 4vw, 24px);
                line-height: 1.6;
            }

            .creepy-title {
                font-size: clamp(32px, 8vw, 80px);
            }

            .creepy-subtitle {
                font-size: clamp(18px, 4vw, 36px);
            }

            .type-name {
                font-size: clamp(24px, 6vw, 48px);
            }

            @media (max-width: 768px) {
                .question-text {
                    font-size: 18px;
                }

                .creepy-title {
                    font-size: 36px;
                }

                .creepy-subtitle {
                    font-size: 24px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    optimizeSpacing() {
        const style = document.createElement('style');
        style.textContent = `
            /* 响应式间距 */
            :root {
                --spacing-xs: clamp(5px, 1.5vw, 8px);
                --spacing-sm: clamp(8px, 2vw, 12px);
                --spacing-md: clamp(15px, 4vw, 20px);
                --spacing-lg: clamp(30px, 6vw, 40px);
                --spacing-xl: clamp(45px, 8vw, 60px);
            }

            .question-card {
                padding: var(--spacing-lg);
            }

            .answer-option {
                margin-bottom: var(--spacing-sm);
            }
        `;
        document.head.appendChild(style);
    }

    optimizeImages() {
        // 为所有图片添加响应式属性
        document.querySelectorAll('img').forEach(img => {
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.loading = 'lazy';
        });
    }

    addLayoutAnimations() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes hapticFeedback {
                0%, 100% {
                    transform: scale(1);
                }
                50% {
                    transform: scale(0.98);
                }
            }

            .layout-transition {
                transition: all 0.3s ease;
            }

            @media (max-width: 768px) {
                .slide-in,
                .fade-in {
                    animation-duration: 0.2s;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// ====================================
// 移动端性能优化器
// ====================================
class MobilePerformanceOptimizer {
    constructor() {
        this.isLowPowerMode = this.detectLowPowerMode();
        this.init();
    }

    init() {
        if (this.isLowPowerMode) {
            this.enableLowPowerMode();
        }

        this.optimizeAnimations();
        this.optimizeScroll();
        this.optimizeTouch();
    }

    detectLowPowerMode() {
        // 检测低电量模式或省电模式
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                return !battery.charging && battery.level < 0.2;
            }).catch(() => false);
        }
        return false;
    }

    enableLowPowerMode() {
        console.log('🔋 启用移动端省电模式');

        document.body.classList.add('low-power-mode');

        // 减少动画
        document.documentElement.style.setProperty('--animation-speed', '0.5');
        document.documentElement.style.setProperty('--particle-density', '0.3');

        // 禁用部分特效
        document.querySelectorAll('.floating-pumpkin, .floating-ghost').forEach(elem => {
            elem.style.display = 'none';
        });
    }

    optimizeAnimations() {
        // 在移动端使用更高效的动画
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                * {
                    animation-duration: 0.3s !important;
                    transition-duration: 0.3s !important;
                }

                .particle-system {
                    display: none;
                }

                .parallax-layer {
                    transform: none !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    optimizeScroll() {
        // 移动端滚动优化
        let isScrolling = false;

        document.addEventListener('scroll', () => {
            if (!isScrolling) {
                window.requestAnimationFrame(() => {
                    // 滚动时的优化逻辑
                    isScrolling = false;
                });
                isScrolling = true;
            }
        }, { passive: true });
    }

    optimizeTouch() {
        // 触摸事件防抖
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (event) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }
}

// ====================================
// 移动端导航增强
// ====================================
class MobileNavigationEnhancer {
    constructor() {
        this.init();
    }

    init() {
        this.addBottomNav();
        this.addFloatingButton();
        this.addKeyboardShortcuts();
        this.addBackButtonHandler();
    }

    addBottomNav() {
        // 在移动端添加底部导航
        if (window.innerWidth <= 768) {
            const bottomNav = document.createElement('div');
            bottomNav.id = 'mobile-bottom-nav';
            bottomNav.style.cssText = `
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: rgba(11, 12, 30, 0.95);
                backdrop-filter: blur(10px);
                padding: 10px max(10px, env(safe-area-inset-left)) calc(10px + env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-right));
                display: flex;
                justify-content: space-around;
                align-items: center;
                z-index: 1000;
                border-top: 1px solid var(--halloween-orange);
            `;

            const navItems = [
                { icon: '🏠', label: '首页', action: () => location.reload() },
                { icon: '🔄', label: '刷新', action: () => location.reload() },
                { icon: '⚙️', label: '设置', action: () => this.showSettings() },
                { icon: '❓', label: '帮助', action: () => this.showHelp() }
            ];

            navItems.forEach(item => {
                const button = document.createElement('button');
                button.style.cssText = `
                    background: transparent;
                    border: none;
                    color: var(--ghost-white);
                    font-size: 20px;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    padding: 8px;
                `;
                button.innerHTML = `<div>${item.icon}</div><div style="font-size: 10px">${item.label}</div>`;
                button.addEventListener('click', item.action);
                bottomNav.appendChild(button);
            });

            document.body.appendChild(bottomNav);
        }
    }

    addFloatingButton() {
        // 添加浮动按钮（如果不存在）
        if (!document.querySelector('.admin-panel-fab') && window.innerWidth <= 768) {
            const fab = document.createElement('div');
            fab.className = 'admin-panel-fab';
            fab.style.cssText = `
                position: fixed;
                bottom: 100px;
                right: 20px;
                z-index: 1000;
            `;

            fab.innerHTML = `
                <button class="admin-fab-btn" style="
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--halloween-orange), var(--blood-red));
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    box-shadow: 0 4px 16px rgba(248, 165, 28, 0.4);
                ">⚙️</button>
            `;

            fab.querySelector('button').addEventListener('click', () => {
                this.showMobileMenu();
            });

            document.body.appendChild(fab);
        }
    }

    addKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (window.innerWidth > 768) return;

            switch (e.key) {
                case 'Home':
                    e.preventDefault();
                    location.reload();
                    break;
                case 'Escape':
                    this.closeMobileMenu();
                    break;
            }
        });
    }

    addBackButtonHandler() {
        // 处理Android返回按钮
        if ('history' in window && window.innerWidth <= 768) {
            window.addEventListener('popstate', () => {
                if (currentQuestionIndex > 0) {
                    // 返回上一题
                    // 可以在这里添加返回逻辑
                }
            });
        }
    }

    showMobileMenu() {
        const menu = document.createElement('div');
        menu.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(11, 12, 30, 0.98);
            z-index: 10000;
            padding: 50px 20px 20px;
            animation: slideIn 0.3s ease;
        `;

        menu.innerHTML = `
            <h2 style="color: var(--halloween-orange); margin-bottom: 30px;">菜单</h2>
            <button onclick="location.reload()" style="
                display: block;
                width: 100%;
                padding: 15px;
                margin: 10px 0;
                background: linear-gradient(135deg, var(--spooky-purple), var(--magic-blue));
                border: none;
                border-radius: 10px;
                color: white;
                font-size: 16px;
            ">🔄 重新开始</button>
            <button onclick="window.performanceMonitor?.stop()" style="
                display: block;
                width: 100%;
                padding: 15px;
                margin: 10px 0;
                background: linear-gradient(135deg, var(--spooky-purple), var(--magic-blue));
                border: none;
                border-radius: 10px;
                color: white;
                font-size: 16px;
            ">📊 性能报告</button>
        `;

        menu.addEventListener('click', (e) => {
            if (e.target === menu) {
                menu.remove();
            }
        });

        document.body.appendChild(menu);
    }

    closeMobileMenu() {
        const menu = document.querySelector('#mobile-bottom-nav + div');
        if (menu) {
            menu.remove();
        }
    }

    showSettings() {
        console.log('显示设置');
    }

    showHelp() {
        console.log('显示帮助');
    }
}

// ====================================
// 初始化移动端增强系统
// ====================================
document.addEventListener('DOMContentLoaded', () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     window.innerWidth <= 768;

    if (!isMobile) {
        console.log('💻 桌面端，跳过移动端增强');
        return;
    }

    console.log('📱 初始化移动端增强系统...');

    try {
        // 1. 检测移动设备
        const deviceDetector = new MobileDeviceDetector();
        console.log('📱 设备信息:', deviceDetector.getInfo());

        // 2. 适配视口
        const viewportAdapter = new ViewportAdapter();

        // 3. 增强触摸交互
        const touchEnhancer = new TouchInteractionEnhancer();

        // 4. 优化响应式布局
        const layoutOptimizer = new ResponsiveLayoutOptimizer();

        // 5. 移动端性能优化
        const performanceOptimizer = new MobilePerformanceOptimizer();

        // 6. 增强移动导航
        const navigationEnhancer = new MobileNavigationEnhancer();

        // 导出到全局
        window.MobileEnhancer = {
            deviceDetector,
            viewportAdapter,
            touchEnhancer,
            layoutOptimizer,
            performanceOptimizer,
            navigationEnhancer
        };

        console.log('✅ 移动端增强系统初始化完成');
    } catch (error) {
        console.error('❌ 移动端增强系统初始化失败:', error);
    }
});

console.log('📱 移动端增强系统已加载');
