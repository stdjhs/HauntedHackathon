/* ====================================
   动画性能优化系统
   版本: v4.0.0
   目标: 优化动画性能，提升流畅度
   特性: requestAnimationFrame、GPU加速、动画池
   ==================================== */

// ====================================
// 动画优化器
// ====================================
class AnimationOptimizer {
    constructor() {
        this.animations = new Map();
        this.running = false;
        this.lastFrameTime = 0;
        this.fps = 60;
        this.frameTime = 1000 / 60; // 16.67ms for 60fps
        this.isPageVisible = !document.hidden;

        this.init();
    }

    init() {
        // 页面可见性检测
        document.addEventListener('visibilitychange', () => {
            this.isPageVisible = !document.hidden;
            if (this.isPageVisible) {
                this.start();
            } else {
                this.stop();
            }
        });

        // 监听窗口焦点
        window.addEventListener('blur', () => this.stop());
        window.addEventListener('focus', () => this.start());

        // 自适应帧率
        this.adaptiveFrameRate();
    }

    // 注册动画
    register(id, animationFunction, priority = 0) {
        this.animations.set(id, {
            func: animationFunction,
            priority: priority,
            lastRun: 0,
            enabled: true
        });

        if (!this.running) {
            this.start();
        }
    }

    // 注销动画
    unregister(id) {
        this.animations.delete(id);
        if (this.animations.size === 0) {
            this.stop();
        }
    }

    // 启动动画循环
    start() {
        if (this.running || this.animations.size === 0) return;
        this.running = true;
        this.lastFrameTime = performance.now();
        this.loop();
    }

    // 停止动画循环
    stop() {
        this.running = false;
    }

    // 动画主循环
    loop() {
        if (!this.running) return;

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;

        // FPS控制
        if (deltaTime >= this.frameTime) {
            // 清理过期任务
            this.lastFrameTime = currentTime - (deltaTime % this.frameTime);

            // 按优先级排序
            const sortedAnimations = Array.from(this.animations.entries())
                .filter(([_, anim]) => anim.enabled)
                .sort((a, b) => b[1].priority - a[1].priority);

            // 执行动画
            sortedAnimations.forEach(([id, animation]) => {
                try {
                    animation.func(currentTime, deltaTime);
                    animation.lastRun = currentTime;
                } catch (error) {
                    console.error(`Animation ${id} error:`, error);
                }
            });

            // 更新FPS
            this.updateFPS(deltaTime);
        }

        requestAnimationFrame(() => this.loop());
    }

    // 更新FPS计算
    updateFPS(deltaTime) {
        this.fps = 1000 / deltaTime;
    }

    // 自适应帧率
    adaptiveFrameRate() {
        setInterval(() => {
            if (this.fps < 30) {
                // 降低帧率以节省性能
                this.frameTime = 1000 / 30;
            } else if (this.fps > 50) {
                // 恢复高帧率
                this.frameTime = 1000 / 60;
            }
        }, 2000);
    }

    // 获取当前FPS
    getFPS() {
        return Math.round(this.fps);
    }

    // 暂停所有动画
    pauseAll() {
        this.animations.forEach(anim => anim.enabled = false);
    }

    // 恢复所有动画
    resumeAll() {
        this.animations.forEach(anim => anim.enabled = true);
    }

    // 暂停指定动画
    pause(id) {
        const animation = this.animations.get(id);
        if (animation) {
            animation.enabled = false;
        }
    }

    // 恢复指定动画
    resume(id) {
        const animation = this.animations.get(id);
        if (animation) {
            animation.enabled = true;
        }
    }
}

// ====================================
// GPU加速工具
// ====================================
class GPUAccelerator {
    constructor() {
        this.supported = this.checkSupport();
    }

    checkSupport() {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    }

    // 启用GPU加速
    enableGPUAcceleration(element) {
        if (!element) return;

        // 强制GPU合成层
        element.style.transform = 'translateZ(0)';
        element.style.willChange = 'transform, opacity';
        element.style.backfaceVisibility = 'hidden';

        // 添加合成层提示
        element.style.webkitTransformStyle = 'preserve-3d';
    }

    // 批量启用GPU加速
    enableGPUAccelerationBatch(elements) {
        elements.forEach(element => this.enableGPUAcceleration(element));
    }

    // 为动画元素启用硬件加速
    enableForAnimations(selector) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            this.enableGPUAcceleration(element);

            // 监听动画开始
            element.addEventListener('animationstart', () => {
                element.style.transform = 'translateZ(0) scale(1.001)';
            });

            // 监听动画结束
            element.addEventListener('animationend', () => {
                element.style.transform = 'translateZ(0)';
            });
        });
    }
}

// ====================================
// 动画池管理系统
// ====================================
class AnimationPool {
    constructor() {
        this.pools = new Map();
    }

    // 创建对象池
    createPool(name, createFn, resetFn, initialSize = 10) {
        const pool = {
            available: [],
            inUse: new Set(),
            createFn,
            resetFn
        };

        // 预填充对象
        for (let i = 0; i < initialSize; i++) {
            pool.available.push(createFn());
        }

        this.pools.set(name, pool);
        return pool;
    }

    // 获取对象
    acquire(name) {
        const pool = this.pools.get(name);
        if (!pool) return null;

        let obj = pool.available.pop();
        if (!obj) {
            obj = pool.createFn();
        }

        pool.inUse.add(obj);
        return obj;
    }

    // 释放对象
    release(name, obj) {
        const pool = this.pools.get(name);
        if (!pool) return;

        if (pool.inUse.has(obj)) {
            pool.inUse.delete(obj);
            pool.resetFn(obj);
            pool.available.push(obj);
        }
    }

    // 清空池
    clear(name) {
        const pool = this.pools.get(name);
        if (pool) {
            pool.available.length = 0;
            pool.inUse.clear();
        }
    }

    // 获取池状态
    getStatus(name) {
        const pool = this.pools.get(name);
        if (!pool) return null;

        return {
            available: pool.available.length,
            inUse: pool.inUse.size,
            total: pool.available.length + pool.inUse.size
        };
    }
}

// ====================================
// 高性能滚动优化
// ====================================
class ScrollOptimizer {
    constructor() {
        this.scrollY = window.scrollY;
        this.lastScrollY = 0;
        this.ticking = false;
        this.callbacks = new Set();

        this.init();
    }

    init() {
        // 使用passive监听器提升滚动性能
        window.addEventListener('scroll', this.onScroll.bind(this), { passive: true });
    }

    onScroll() {
        this.scrollY = window.scrollY;

        if (!this.ticking) {
            requestAnimationFrame(() => {
                this.notifyCallbacks();
                this.ticking = false;
            });
            this.ticking = true;
        }
    }

    // 注册滚动回调
    addCallback(callback) {
        this.callbacks.add(callback);
    }

    // 移除滚动回调
    removeCallback(callback) {
        this.callbacks.delete(callback);
    }

    // 通知所有回调
    notifyCallbacks() {
        this.callbacks.forEach(callback => {
            try {
                callback(this.scrollY, this.scrollY - this.lastScrollY);
            } catch (error) {
                console.error('Scroll callback error:', error);
            }
        });
        this.lastScrollY = this.scrollY;
    }

    // 获取滚动方向
    getScrollDirection() {
        return this.scrollY > this.lastScrollY ? 'down' : 'up';
    }

    // 获取滚动速度
    getScrollSpeed() {
        return Math.abs(this.scrollY - this.lastScrollY);
    }
}

// ====================================
// CSS动画优化器
// ====================================
class CSSAnimationOptimizer {
    constructor() {
        this.keyframes = new Map();
        this.init();
    }

    init() {
        // 预定义常用动画的GPU优化版本
        this.createOptimizedKeyframes();
    }

    createOptimizedKeyframes() {
        // GPU优化的淡入动画
        this.addOptimizedKeyframes('fadeIn', [
            { transform: 'translateZ(0) scale(0.98)', opacity: 0 },
            { transform: 'translateZ(0) scale(1)', opacity: 1 }
        ], { duration: '0.3s', easing: 'ease-out', fill: 'both' });

        // GPU优化的滑入动画
        this.addOptimizedKeyframes('slideInUp', [
            { transform: 'translateZ(0) translateY(20px)', opacity: 0 },
            { transform: 'translateZ(0) translateY(0)', opacity: 1 }
        ], { duration: '0.4s', easing: 'ease-out', fill: 'both' });

        // GPU优化的缩放动画
        this.addOptimizedKeyframes('scaleIn', [
            { transform: 'translateZ(0) scale(0.8)', opacity: 0 },
            { transform: 'translateZ(0) scale(1.05)', opacity: 1 },
            { transform: 'translateZ(0) scale(1)', opacity: 1 }
        ], { duration: '0.35s', easing: 'ease-out', fill: 'both' });
    }

    addOptimizedKeyframes(name, frames, options) {
        const style = document.createElement('style');
        let cssFrames = '@keyframes ' + name + ' {\n';

        frames.forEach((frame, index) => {
            const percentage = (index / (frames.length - 1)) * 100;
            cssFrames += `  ${percentage}% { `;

            // 确保transform包含translateZ(0)以启用GPU加速
            if (frame.transform && !frame.transform.includes('translateZ')) {
                frame.transform += ' translateZ(0)';
            }

            Object.entries(frame).forEach(([prop, value]) => {
                cssFrames += `${prop}: ${value}; `;
            });

            cssFrames += '}\n';
        });

        cssFrames += '}';

        style.textContent = cssFrames;
        document.head.appendChild(style);

        this.keyframes.set(name, options);
    }

    // 应用优化动画
    applyAnimation(element, animationName, delay = 0) {
        const options = this.keyframes.get(animationName);
        if (!options) return;

        element.style.animation = `${animationName} ${options.duration}`;
        element.style.animationTimingFunction = options.easing;
        element.style.animationFillMode = options.fill;
        element.style.animationDelay = `${delay}ms`;
        element.style.animationDuration = options.duration;

        // 确保GPU加速
        element.style.willChange = 'transform, opacity';
        element.style.backfaceVisibility = 'hidden';
    }

    // 批量应用动画
    applyAnimationBatch(elements, animationName, stagger = 0) {
        elements.forEach((element, index) => {
            this.applyAnimation(element, animationName, index * stagger);
        });
    }
}

// ====================================
// 内存优化管理器
// ====================================
class MemoryOptimizer {
    constructor() {
        this.intervals = new Map();
        this.timeouts = new Map();
        this.eventListeners = new Map();

        this.init();
    }

    init() {
        // 页面卸载时清理所有资源
        window.addEventListener('beforeunload', () => this.cleanupAll());
    }

    // 安全设置Interval
    safeSetInterval(callback, delay, id) {
        const intervalId = setInterval(() => {
            try {
                callback();
            } catch (error) {
                console.error(`Interval ${id} error:`, error);
                this.clearInterval(id);
            }
        }, delay);

        this.intervals.set(id, intervalId);
        return intervalId;
    }

    // 安全清除Interval
    clearInterval(id) {
        const intervalId = this.intervals.get(id);
        if (intervalId) {
            clearInterval(intervalId);
            this.intervals.delete(id);
        }
    }

    // 安全设置Timeout
    safeSetTimeout(callback, delay, id) {
        const timeoutId = setTimeout(() => {
            try {
                callback();
            } catch (error) {
                console.error(`Timeout ${id} error:`, error);
            }
        }, delay);

        this.timeouts.set(id, timeoutId);
        return timeoutId;
    }

    // 安全清除Timeout
    clearTimeout(id) {
        const timeoutId = this.timeouts.get(id);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.timeouts.delete(id);
        }
    }

    // 添加事件监听器（自动清理）
    addEventListener(element, event, callback, options, id) {
        const listener = (e) => {
            try {
                callback(e);
            } catch (error) {
                console.error(`Event listener ${id} error:`, error);
            }
        };

        element.addEventListener(event, listener, options);

        if (!this.eventListeners.has(id)) {
            this.eventListeners.set(id, []);
        }

        this.eventListeners.get(id).push({ element, event, listener, options });
    }

    // 移除事件监听器
    removeEventListener(id) {
        const listeners = this.eventListeners.get(id);
        if (listeners) {
            listeners.forEach(({ element, event, listener, options }) => {
                element.removeEventListener(event, listener, options);
            });
            this.eventListeners.delete(id);
        }
    }

    // 清理所有资源
    cleanupAll() {
        // 清理Intervals
        this.intervals.forEach(id => clearInterval(id));
        this.intervals.clear();

        // 清理Timeouts
        this.timeouts.forEach(id => clearTimeout(id));
        this.timeouts.clear();

        // 清理EventListeners
        this.eventListeners.forEach((_, id) => this.removeEventListener(id));
    }
}

// ====================================
// 性能监控集成
// ====================================
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            fps: [],
            memory: [],
            animations: new Map(),
            lastUpdate: performance.now()
        };

        this.init();
    }

    init() {
        // 如果有性能监控工具，集成它
        if (window.performanceMonitor) {
            this.integrateWithPerformanceMonitor();
        }

        // 启动指标收集
        this.startCollecting();
    }

    integrateWithPerformanceMonitor() {
        const perfMon = window.performanceMonitor;

        // 添加动画性能跟踪
        AnimationOptimizer.prototype.recordAnimationPerformance = function(id, startTime, endTime) {
            const duration = endTime - startTime;
            perfMon.recordInteraction(`animation_${id}`, duration);
        };
    }

    startCollecting() {
        const collectMetrics = () => {
            const now = performance.now();

            // FPS监控
            this.metrics.fps.push({
                time: now,
                value: Math.round(1000 / (now - this.metrics.lastUpdate))
            });

            // 只保留最近5秒的数据
            const fiveSecondsAgo = now - 5000;
            this.metrics.fps = this.metrics.fps.filter(m => m.time > fiveSecondsAgo);

            // 内存监控
            if (performance.memory) {
                this.metrics.memory.push({
                    time: now,
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize
                });
            }

            this.metrics.lastUpdate = now;

            setTimeout(collectMetrics, 1000);
        };

        collectMetrics();
    }

    // 获取平均FPS
    getAverageFPS() {
        if (this.metrics.fps.length === 0) return 0;
        const sum = this.metrics.fps.reduce((acc, m) => acc + m.value, 0);
        return Math.round(sum / this.metrics.fps.length);
    }

    // 获取动画性能报告
    getAnimationReport() {
        const report = {};
        this.metrics.animations.forEach((data, name) => {
            report[name] = {
                average: data.total / data.count,
                min: data.min,
                max: data.max,
                count: data.count
            };
        });
        return report;
    }
}

// ====================================
// 初始化优化器
// ====================================
const animationOptimizer = new AnimationOptimizer();
const gpuAccelerator = new GPUAccelerator();
const animationPool = new AnimationPool();
const scrollOptimizer = new ScrollOptimizer();
const cssAnimationOptimizer = new CSSAnimationOptimizer();
const memoryOptimizer = new MemoryOptimizer();
const performanceMonitor = new PerformanceMonitor();

// 导出全局对象
window.AnimationOptimizer = {
    optimizer: animationOptimizer,
    gpuAccelerator,
    animationPool,
    scrollOptimizer,
    cssAnimationOptimizer,
    memoryOptimizer,
    performanceMonitor
};

// 自动优化现有动画
document.addEventListener('DOMContentLoaded', () => {
    // 为动画元素启用GPU加速
    gpuAccelerator.enableForAnimations('.fade-in, .slide-in, .question-card, .result-card, .creepy-button');

    // 优化滚动性能
    scrollOptimizer.addCallback((scrollY) => {
        // 可以在这里添加基于滚动的动画
    });

    // 创建常用对象池
    animationPool.createPool('particles', () => ({
        x: 0, y: 0, size: 0, opacity: 0, color: ''
    }), (particle) => {
        particle.opacity = 0;
    }, 50);

    animationPool.createPool('floatingText', () => ({
        text: '', x: 0, y: 0, opacity: 0, duration: 0
    }), (text) => {
        text.opacity = 0;
    }, 20);
});

console.log('🎬 动画性能优化器已初始化');
