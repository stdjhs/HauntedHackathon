/* ====================================
   微交互动画系统
   版本: v4.0.0
   目标: 提升交互体验，增加流畅动画
   特性: 按钮反馈、悬停效果、点击动画、过渡效果
   ==================================== */

// ====================================
// 按钮交互增强
// ====================================
class ButtonInteractions {
    constructor() {
        this.buttons = new Map();
        this.init();
    }

    init() {
        // 监听按钮创建
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList.contains('creepy-button')) {
                        this.enhanceButton(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // 为已有按钮应用效果
        document.querySelectorAll('.creepy-button').forEach(button => {
            this.enhanceButton(button);
        });
    }

    enhanceButton(button) {
        if (button.classList.contains('button-enhanced')) return;

        // 涟漪效果
        button.addEventListener('click', (e) => {
            this.createRippleEffect(e, button);
        });

        // 悬停光晕效果
        button.addEventListener('mouseenter', () => {
            this.createHoverGlow(button);
        });

        button.addEventListener('mouseleave', () => {
            this.removeHoverGlow(button);
        });

        // 按下动画
        button.addEventListener('mousedown', () => {
            button.style.transform = 'translateY(-1px) scale(0.98)';
        });

        button.addEventListener('mouseup', () => {
            button.style.transform = 'translateY(-3px) scale(1)';
        });

        // 磁吸效果（鼠标靠近时）
        this.addMagnetEffect(button);

        button.classList.add('button-enhanced');
    }

    createRippleEffect(event, button) {
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.6);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
            z-index: 1;
        `;

        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    createHoverGlow(button) {
        button.style.boxShadow = `
            0 0 20px rgba(248, 165, 28, 0.8),
            0 0 40px rgba(248, 165, 28, 0.6),
            0 15px 50px rgba(0, 0, 0, 0.3)
        `;

        // 添加脉动效果
        button.style.animation = 'buttonPulse 1.5s ease-in-out infinite';
    }

    removeHoverGlow(button) {
        button.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
        button.style.animation = '';
    }

    addMagnetEffect(button) {
        button.addEventListener('mousemove', (e) => {
            const rect = button.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const deltaX = (e.clientX - centerX) * 0.1;
            const deltaY = (e.clientY - centerY) * 0.1;

            button.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = '';
        });
    }
}

// ====================================
// 答案选项交互增强
// ====================================
class AnswerOptionInteractions {
    constructor() {
        this.init();
    }

    init() {
        // 监听问题容器
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                    const answersContainer = mutation.target.querySelector('#answers-container');
                    if (answersContainer) {
                        this.enhanceAnswerOptions(answersContainer);
                    }
                }
            });
        });

        observer.observe(document.getElementById('question-container'), {
            childList: true,
            subtree: true
        });
    }

    enhanceAnswerOptions(container) {
        const options = container.querySelectorAll('.answer-option');
        options.forEach((option, index) => {
            // 初始动画（交错显示）
            option.style.opacity = '0';
            option.style.transform = 'translateY(20px)';
            setTimeout(() => {
                option.style.transition = 'all 0.3s ease';
                option.style.opacity = '1';
                option.style.transform = 'translateY(0)';
            }, index * 100);

            // 悬停效果
            option.addEventListener('mouseenter', () => {
                option.style.transform = 'scale(1.05) translateY(-5px)';
                option.style.boxShadow = '0 10px 30px rgba(248, 165, 28, 0.4)';
            });

            option.addEventListener('mouseleave', () => {
                option.style.transform = '';
                option.style.boxShadow = '';
            });

            // 答案选项只增强视觉，不绑定事件
            // 原有click事件由halloween_script.js处理
            // 在增强完成后，尝试手动触发一次效果（如果已被选中）
            setTimeout(() => {
                if (option.classList.contains('selected')) {
                    this.createSelectionEffect(option);
                }
            }, 100);
        });
    }

    createSelectionEffect(option) {
        // 创建选中光效
        const glow = document.createElement('div');
        glow.className = 'selection-glow';
        glow.style.cssText = `
            position: absolute;
            inset: -5px;
            border-radius: inherit;
            background: linear-gradient(45deg,
                rgba(248, 165, 28, 0.6),
                rgba(107, 29, 158, 0.6),
                rgba(82, 89, 255, 0.6)
            );
            filter: blur(8px);
            animation: selectionGlow 0.5s ease-out;
            pointer-events: none;
            z-index: -1;
        `;

        option.style.position = 'relative';
        option.appendChild(glow);

        setTimeout(() => {
            glow.remove();
        }, 500);
    }
}

// ====================================
// 进度条增强
// ====================================
class ProgressBarEnhancer {
    constructor() {
        this.progressFill = null;
        this.init();
    }

    init() {
        const observer = new MutationObserver(() => {
            const progressFill = document.getElementById('progress-fill');
            if (progressFill && progressFill !== this.progressFill) {
                this.enhanceProgressBar(progressFill);
                this.progressFill = progressFill;
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    enhanceProgressBar(progressFill) {
        const progressBar = progressFill.parentElement;

        // 添加渐变动画
        progressFill.style.background = `
            linear-gradient(90deg,
                var(--halloween-orange) 0%,
                var(--pumpkin-glow) 50%,
                var(--halloween-orange) 100%
            )
        `;
        progressFill.style.backgroundSize = '200% 100%';
        progressFill.style.animation = 'gradientShift 3s ease infinite';

        // 添加脉动效果
        const originalUpdate = this.updateProgress.bind(this);
        this.updateProgress = (progress) => {
            originalUpdate(progress);

            // 当进度接近完成时添加特效
            if (progress >= 90) {
                progressFill.style.boxShadow = '0 0 20px var(--halloween-orange)';
                progressFill.style.animation = 'gradientShift 1s ease infinite, pulse 1s ease infinite';
            }
        };
    }

    updateProgress(progress) {
        if (!this.progressFill) return;

        this.progressFill.style.width = `${progress}%`;

        // 添加数字计数动画
        const progressText = document.getElementById('progress-text');
        if (progressText) {
            const targetValue = parseInt(progressText.textContent.split(' / ')[0]);
            if (targetValue !== progress) {
                this.animateNumber(progressText, targetValue, progress);
            }
        }
    }

    animateNumber(element, from, to) {
        const duration = 500;
        const start = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);

            const current = from + (to - from) * this.easeOutQuart(progress);
            const textParts = element.textContent.split(' / ');
            element.textContent = `${Math.round(current)} / ${textParts[1]}`;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    }
}

// ====================================
// 卡片翻转效果
// ====================================
class CardFlipEffect {
    constructor() {
        this.cards = [];
        this.init();
    }

    init() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList.contains('question-card')) {
                        this.addFlipEffect(node);
                    }
                });
            });
        });

        observer.observe(document.getElementById('question-container'), {
            childList: true,
            subtree: true
        });
    }

    addFlipEffect(card) {
        // 初始进入动画
        card.style.transform = 'perspective(1000px) rotateY(-90deg)';
        card.style.transition = 'transform 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';

        setTimeout(() => {
            card.style.transform = 'perspective(1000px) rotateY(0deg)';
        }, 100);

        // 添加3D阴影
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            card.style.transform = `
                perspective(1000px)
                rotateX(${rotateX}deg)
                rotateY(${rotateY}deg)
                translateZ(0)
            `;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
        });
    }
}

// ====================================
// 加载动画增强
// ====================================
class LoadingAnimationEnhancer {
    constructor() {
        this.loadingScreen = null;
        this.init();
    }

    init() {
        const observer = new MutationObserver(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen && loadingScreen !== this.loadingScreen) {
                this.enhanceLoading(loadingScreen);
                this.loadingScreen = loadingScreen;
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    enhanceLoading(loadingScreen) {
        // 添加更多粒子
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'loading-particle';
            particle.textContent = '✨';
            particle.style.cssText = `
                position: absolute;
                font-size: ${Math.random() * 15 + 10}px;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                opacity: 0;
                animation: particleFloat ${Math.random() * 2 + 2}s ease-in-out infinite;
                animation-delay: ${Math.random() * 2}s;
                pointer-events: none;
            `;
            loadingScreen.appendChild(particle);
        }

        // 增强南瓜动画
        const pumpkin = loadingScreen.querySelector('.pumpkin');
        if (pumpkin) {
            pumpkin.style.animation = 'pumpkinFloat 2s ease-in-out infinite';
        }

        // 添加打字机效果
        const loadingText = loadingScreen.querySelector('.loading-text');
        if (loadingText) {
            this.typeWriterEffect(loadingText, '正在唤醒黑暗力量...', 100);
        }
    }

    typeWriterEffect(element, text, speed) {
        element.textContent = '';
        let i = 0;

        const type = () => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        };

        type();
    }
}

// ====================================
// 结果页面特效
// ====================================
class ResultPageEffects {
    constructor() {
        this.resultContainer = null;
        this.init();
    }

    init() {
        const observer = new MutationObserver(() => {
            const resultContainer = document.getElementById('result-container');
            if (resultContainer && resultContainer !== this.resultContainer) {
                this.enhanceResultPage(resultContainer);
                this.resultContainer = resultContainer;
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    enhanceResultPage(container) {
        // 延迟显示各部分
        const title = container.querySelector('.result-title');
        const personalityType = container.querySelector('.personality-type');
        const description = container.querySelector('.personality-description');
        const traits = container.querySelector('.personality-traits');
        const compatibility = container.querySelector('.compatibility');
        const buttons = container.querySelector('.action-buttons');

        // 依次显示动画
        this.animateSequential([
            { element: title, delay: 200 },
            { element: personalityType, delay: 400 },
            { element: description, delay: 600 },
            { element: traits, delay: 800 },
            { element: compatibility, delay: 1000 },
            { element: buttons, delay: 1200 }
        ]);

        // 添加烟花效果
        setTimeout(() => {
            this.createFireworks(container);
        }, 1500);
    }

    animateSequential(animations) {
        animations.forEach(({ element, delay }) => {
            if (element) {
                element.style.opacity = '0';
                element.style.transform = 'translateY(30px)';
                element.style.transition = 'all 0.6s ease';

                setTimeout(() => {
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }, delay);
            }
        });
    }

    createFireworks(container) {
        const colors = ['#F8A51C', '#6b1d9e', '#5259FF', '#F25C5C', '#ff9900'];

        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const firework = document.createElement('div');
                firework.className = 'firework';
                firework.style.cssText = `
                    position: absolute;
                    left: ${Math.random() * 100}%;
                    top: ${Math.random() * 100}%;
                    width: 10px;
                    height: 10px;
                    background: ${colors[Math.floor(Math.random() * colors.length)]};
                    border-radius: 50%;
                    pointer-events: none;
                    animation: fireworkExplode 1s ease-out forwards;
                `;

                container.appendChild(firework);

                setTimeout(() => {
                    firework.remove();
                }, 1000);
            }, i * 200);
        }
    }
}

// ====================================
// 触摸反馈增强
// ====================================
class TouchFeedback {
    constructor() {
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this.init();
    }

    init() {
        if (this.isTouchDevice) {
            document.body.classList.add('touch-device');
            this.enhanceTouchInteractions();
        }
    }

    enhanceTouchInteractions() {
        // 为按钮添加触摸反馈
        document.querySelectorAll('.creepy-button, .answer-option').forEach(element => {
            element.addEventListener('touchstart', (e) => {
                element.style.transform = 'scale(0.95)';
                element.style.transition = 'transform 0.1s';

                // 创建触摸波纹
                const touch = e.touches[0];
                this.createTouchRipple(touch, element);
            });

            element.addEventListener('touchend', () => {
                setTimeout(() => {
                    element.style.transform = '';
                }, 100);
            });
        });
    }

    createTouchRipple(touch, element) {
        const ripple = document.createElement('div');
        const rect = element.getBoundingClientRect();
        const size = 50;

        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            animation: touchRipple 0.5s ease-out;
            z-index: 1;
        `;

        ripple.style.left = `${touch.clientX - rect.left}px`;
        ripple.style.top = `${touch.clientY - rect.top}px`;

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 500);
    }
}

// ====================================
// 键盘导航增强
// ====================================
class KeyboardNavigation {
    constructor() {
        this.focusableElements = [];
        this.currentFocus = 0;
        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.updateFocusableElements();
    }

    updateFocusableElements() {
        this.focusableElements = Array.from(
            document.querySelectorAll(
                '.creepy-button, .answer-option, .progress-container, .audio-control button'
            )
        );
    }

    handleKeyDown(e) {
        switch (e.key) {
            case 'Tab':
                this.handleTabNavigation(e);
                break;
            case 'Enter':
            case ' ':
                this.handleEnterKey(e);
                break;
            case 'ArrowLeft':
                this.handleArrowKey(e, -1);
                break;
            case 'ArrowRight':
                this.handleArrowKey(e, 1);
                break;
        }
    }

    handleTabNavigation(e) {
        this.updateFocusableElements();

        if (e.shiftKey) {
            this.currentFocus = (this.currentFocus - 1 + this.focusableElements.length) % this.focusableElements.length;
        } else {
            this.currentFocus = (this.currentFocus + 1) % this.focusableElements.length;
        }

        e.preventDefault();
        this.focusElement(this.focusableElements[this.currentFocus]);
    }

    handleEnterKey(e) {
        const focusedElement = document.activeElement;
        if (focusedElement.classList.contains('answer-option')) {
            focusedElement.click();
        } else if (focusedElement.classList.contains('creepy-button')) {
            focusedElement.click();
        }
    }

    handleArrowKey(e, direction) {
        const focusedElement = document.activeElement;
        if (focusedElement.classList.contains('answer-option')) {
            e.preventDefault();

            const answers = Array.from(document.querySelectorAll('.answer-option'));
            const currentIndex = answers.indexOf(focusedElement);
            const newIndex = (currentIndex + direction + answers.length) % answers.length;

            this.focusElement(answers[newIndex]);
        }
    }

    focusElement(element) {
        if (element) {
            element.focus();
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // 添加焦点指示器
            element.style.outline = '2px solid var(--halloween-orange)';
            element.style.outlineOffset = '4px';
        }
    }
}

// ====================================
// 初始化所有微交互
// ====================================
document.addEventListener('DOMContentLoaded', () => {
    // 创建交互增强实例
    const buttonInteractions = new ButtonInteractions();
    const answerOptionInteractions = new AnswerOptionInteractions();
    const progressBarEnhancer = new ProgressBarEnhancer();
    const cardFlipEffect = new CardFlipEffect();
    const loadingAnimationEnhancer = new LoadingAnimationEnhancer();
    const resultPageEffects = new ResultPageEffects();
    const touchFeedback = new TouchFeedback();
    const keyboardNavigation = new KeyboardNavigation();

    // 导出到全局
    window.MicroInteractions = {
        buttonInteractions,
        answerOptionInteractions,
        progressBarEnhancer,
        cardFlipEffect,
        loadingAnimationEnhancer,
        resultPageEffects,
        touchFeedback,
        keyboardNavigation
    };

    // 添加CSS动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }

        @keyframes buttonPulse {
            0%, 100% {
                box-shadow: 0 0 20px rgba(248, 165, 28, 0.8);
            }
            50% {
                box-shadow: 0 0 40px rgba(248, 165, 28, 1);
            }
        }

        @keyframes selectionGlow {
            0% {
                opacity: 0;
                transform: scale(0.8);
            }
            50% {
                opacity: 1;
                transform: scale(1.1);
            }
            100% {
                opacity: 0.6;
                transform: scale(1);
            }
        }

        @keyframes gradientShift {
            0% {
                background-position: 0% 50%;
            }
            50% {
                background-position: 100% 50%;
            }
            100% {
                background-position: 0% 50%;
            }
        }

        @keyframes pulse {
            0%, 100% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.05);
            }
        }

        @keyframes particleFloat {
            0%, 100% {
                opacity: 0;
                transform: translateY(0) scale(0);
            }
            50% {
                opacity: 1;
                transform: translateY(-20px) scale(1);
            }
        }

        @keyframes pumpkinFloat {
            0%, 100% {
                transform: translateY(0) rotate(0deg);
            }
            50% {
                transform: translateY(-10px) rotate(5deg);
            }
        }

        @keyframes fireworkExplode {
            0% {
                transform: scale(0);
                opacity: 1;
            }
            50% {
                transform: scale(1);
                opacity: 0.8;
            }
            100% {
                transform: scale(2);
                opacity: 0;
            }
        }

        @keyframes touchRipple {
            to {
                transform: translate(-50%, -50%) scale(4);
                opacity: 0;
            }
        }

        .touch-device .answer-option:active {
            transform: scale(0.95) !important;
        }

        .selection-glow {
            position: absolute;
            inset: -5px;
            border-radius: inherit;
            background: linear-gradient(45deg,
                rgba(248, 165, 28, 0.6),
                rgba(107, 29, 158, 0.6),
                rgba(82, 89, 255, 0.6)
            );
            filter: blur(8px);
            animation: selectionGlow 0.5s ease-out;
            pointer-events: none;
            z-index: -1;
        }
    `;
    document.head.appendChild(style);

    console.log('✨ 微交互动画系统已初始化');
});

// 延迟定义API，确保在DOMContentLoaded之后
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.MicroInteractionsAPI = {
            triggerAnswerSelection: (element) => {
                if (window.MicroInteractions?.answerOptionInteractions) {
                    window.MicroInteractions.answerOptionInteractions.createSelectionEffect(element);
                }
            }
        };
    }, 100);
});
