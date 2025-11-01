/* ====================================
   智能性能适配系统
   版本: v4.0.0
   目标: 根据设备性能自动调整特效强度
   特性: 动态质量调节、性能监控、自动降级
   ==================================== */

// ====================================
// 设备性能检测器
// ====================================
class DevicePerformanceDetector {
    constructor() {
        this.metrics = {
            cpu: null,
            memory: null,
            gpu: null,
            network: null,
            screen: null,
            battery: null
        };

        this.deviceProfile = null;
        this.init();
    }

    async init() {
        // 检测屏幕信息
        this.metrics.screen = {
            width: window.innerWidth,
            height: window.innerHeight,
            pixelRatio: window.devicePixelRatio || 1,
            colorDepth: screen.colorDepth || 24
        };

        // 检测网络信息
        this.metrics.network = this.detectNetwork();

        // 检测内存信息
        this.metrics.memory = this.detectMemory();

        // GPU检测
        this.metrics.gpu = this.detectGPU();

        // CPU性能测试
        await this.benchmarkCPU();

        // 电池信息
        this.metrics.battery = await this.detectBattery();

        // 生成设备档案
        this.deviceProfile = this.generateProfile();
    }

    detectNetwork() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        return {
            effectiveType: connection?.effectiveType || 'unknown',
            downlink: connection?.downlink || null,
            rtt: connection?.rtt || null,
            saveData: connection?.saveData || false
        };
    }

    detectMemory() {
        const memory = navigator.deviceMemory || 4; // 默认4GB
        return {
            total: memory,
            available: memory * 0.8 // 估算可用内存
        };
    }

    detectGPU() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        const debugInfo = gl?.getExtension('WEBGL_debug_renderer_info');

        return {
            vendor: gl ? gl.getParameter(debugInfo?.UNMASKED_VENDOR_WEBGL) : 'unknown',
            renderer: gl ? gl.getParameter(debugInfo?.UNMASKED_RENDERER_WEBGL) : 'unknown',
            version: gl ? gl.getParameter(gl.VERSION) : 'unknown',
            antialias: gl?.getContextAttributes()?.antialias || false
        };
    }

    async benchmarkCPU() {
        const start = performance.now();

        // CPU密集型任务测试
        let result = 0;
        for (let i = 0; i < 1000000; i++) {
            result += Math.sqrt(i);
        }

        const end = performance.now();
        const duration = end - start;

        // 根据执行时间估算CPU性能
        if (duration < 50) {
            this.metrics.cpu = 'high';
        } else if (duration < 150) {
            this.metrics.cpu = 'medium';
        } else {
            this.metrics.cpu = 'low';
        }
    }

    async detectBattery() {
        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();
                return {
                    level: battery.level,
                    charging: battery.charging
                };
            } catch (error) {
                console.warn('Battery detection failed:', error);
            }
        }
        return null;
    }

    generateProfile() {
        let score = 0;

        // CPU评分 (40%)
        const cpuScore = this.metrics.cpu === 'high' ? 40 :
                         this.metrics.cpu === 'medium' ? 25 : 10;
        score += cpuScore;

        // 内存评分 (25%)
        const memoryScore = this.metrics.memory.total >= 8 ? 25 :
                           this.metrics.memory.total >= 4 ? 15 : 5;
        score += memoryScore;

        // GPU评分 (20%)
        const gpuScore = this.metrics.gpu.antialias ? 20 : 10;
        score += gpuScore;

        // 屏幕评分 (10%)
        const screenScore = (this.metrics.screen.width * this.metrics.screen.height * this.metrics.screen.pixelRatio) > 2000000 ? 10 : 5;
        score += screenScore;

        // 网络评分 (5%)
        const networkScore = this.metrics.network.effectiveType === '4g' ? 5 : 2;
        score += networkScore;

        // 确定设备等级
        let level = 'low';
        if (score >= 80) {
            level = 'ultra';
        } else if (score >= 60) {
            level = 'high';
        } else if (score >= 40) {
            level = 'medium';
        }

        return {
            score,
            level,
            metrics: this.metrics,
            recommendations: this.generateRecommendations(level)
        };
    }

    generateRecommendations(level) {
        const recommendations = {
            particleCount: 200,
            animationQuality: 'high',
            enableEffects: {
                aurora: true,
                parallax: true,
                3d: true,
                particles: true,
                glows: true,
                shadows: true
            },
            maxFps: 60,
            antialias: true,
            shadows: 'high'
        };

        switch (level) {
            case 'ultra':
                recommendations.particleCount = 300;
                recommendations.enableEffects.all = true;
                recommendations.maxFps = 60;
                break;

            case 'high':
                recommendations.particleCount = 200;
                recommendations.enableEffects.glows = false;
                recommendations.maxFps = 60;
                break;

            case 'medium':
                recommendations.particleCount = 100;
                recommendations.enableEffects.parallax = false;
                recommendations.enableEffects.glows = false;
                recommendations.maxFps = 30;
                recommendations.antialias = false;
                break;

            case 'low':
                recommendations.particleCount = 50;
                recommendations.enableEffects = {
                    aurora: false,
                    parallax: false,
                    3d: false,
                    particles: false,
                    glows: false,
                    shadows: false
                };
                recommendations.maxFps = 30;
                recommendations.animationQuality = 'low';
                break;
        }

        return recommendations;
    }

    getProfile() {
        return this.deviceProfile;
    }
}

// ====================================
// 动态质量调节器
// ====================================
class DynamicQualityController {
    constructor() {
        this.currentLevel = 'medium';
        this.performanceHistory = [];
        this.fpsHistory = [];
        this.lastAdjustment = 0;
        this.adjustmentInterval = 5000; // 5秒检查一次
        this.init();
    }

    init() {
        // 持续监控性能
        this.startMonitoring();
    }

    startMonitoring() {
        const monitor = () => {
            this.collectMetrics();
            this.adjustQualityIfNeeded();
            setTimeout(monitor, 1000);
        };
        monitor();
    }

    collectMetrics() {
        const fps = Math.round(1000 / (performance.now() - (window.lastFrameTime || performance.now())));
        window.lastFrameTime = performance.now();

        if (fps > 0 && fps < 120) { // 过滤异常值
            this.fpsHistory.push({
                time: performance.now(),
                fps: fps
            });

            // 只保留最近30秒的数据
            const thirtySecondsAgo = performance.now() - 30000;
            this.fpsHistory = this.fpsHistory.filter(m => m.time > thirtySecondsAgo);
        }
    }

    adjustQualityIfNeeded() {
        const now = performance.now();
        if (now - this.lastAdjustment < this.adjustmentInterval) return;

        const avgFps = this.getAverageFPS();
        const targetLevel = this.determineTargetLevel(avgFps);

        if (targetLevel !== this.currentLevel) {
            this.adjustQuality(targetLevel);
            this.lastAdjustment = now;
        }
    }

    getAverageFPS() {
        if (this.fpsHistory.length === 0) return 60;

        const sum = this.fpsHistory.reduce((acc, m) => acc + m.fps, 0);
        return sum / this.fpsHistory.length;
    }

    determineTargetLevel(avgFps) {
        // 根据平均FPS动态调整
        if (avgFps < 25) {
            return 'low';
        } else if (avgFps < 40) {
            return this.currentLevel === 'low' ? 'low' : 'medium';
        } else if (avgFps < 55) {
            return 'medium';
        } else {
            return 'high';
        }
    }

    adjustQuality(level) {
        console.log(`🎮 调整性能等级: ${this.currentLevel} → ${level}`);

        this.currentLevel = level;

        // 应用质量设置
        this.applyQualitySettings(level);

        // 通知其他系统
        this.notifyQualityChange(level);
    }

    applyQualitySettings(level) {
        const root = document.documentElement;

        switch (level) {
            case 'ultra':
                root.style.setProperty('--particle-density', '1.5');
                root.style.setProperty('--animation-speed', '1');
                root.style.setProperty('--shadow-quality', 'high');
                root.style.setProperty('--blur-amount', '10px');
                break;

            case 'high':
                root.style.setProperty('--particle-density', '1');
                root.style.setProperty('--animation-speed', '1');
                root.style.setProperty('--shadow-quality', 'medium');
                root.style.setProperty('--blur-amount', '8px');
                break;

            case 'medium':
                root.style.setProperty('--particle-density', '0.7');
                root.style.setProperty('--animation-speed', '0.8');
                root.style.setProperty('--shadow-quality', 'low');
                root.style.setProperty('--blur-amount', '5px');
                break;

            case 'low':
                root.style.setProperty('--particle-density', '0.3');
                root.style.setProperty('--animation-speed', '0.6');
                root.style.setProperty('--shadow-quality', 'off');
                root.style.setProperty('--blur-amount', '0');
                break;
        }
    }

    notifyQualityChange(level) {
        // 通知视觉特效系统
        if (window.VisualEffects?.particleSystem) {
            const particleCount = this.getParticleCount(level);
            window.VisualEffects.particleSystem.setParticleCount(particleCount);
        }

        // 通知动画优化器
        if (window.AnimationOptimizer?.optimizer) {
            window.AnimationOptimizer.optimizer.frameTime = 1000 / this.getTargetFPS(level);
        }

        // 发送质量变化事件
        window.dispatchEvent(new CustomEvent('qualityChange', {
            detail: { level, fps: this.getTargetFPS(level) }
        }));
    }

    getParticleCount(level) {
        const counts = {
            ultra: 300,
            high: 200,
            medium: 100,
            low: 50
        };
        return counts[level] || 100;
    }

    getTargetFPS(level) {
        const fps = {
            ultra: 60,
            high: 60,
            medium: 30,
            low: 30
        };
        return fps[level] || 60;
    }

    getCurrentLevel() {
        return this.currentLevel;
    }

    getPerformanceStats() {
        const avgFps = this.getAverageFPS();
        return {
            level: this.currentLevel,
            averageFPS: Math.round(avgFps),
            historyLength: this.fpsHistory.length,
            isStable: this.isStablePerformance()
        };
    }

    isStablePerformance() {
        if (this.fpsHistory.length < 10) return false;

        const recent = this.fpsHistory.slice(-10);
        const avgFps = recent.reduce((acc, m) => acc + m.fps, 0) / recent.length;
        const variance = recent.reduce((acc, m) => acc + Math.pow(m.fps - avgFps, 2), 0) / recent.length;

        return variance < 100; // 方差小于100认为稳定
    }
}

// ====================================
// 自动降级保护系统
// ====================================
class AutoDegradationProtector {
    constructor() {
        this.isEnabled = true;
        this.criticalThreshold = 15; // FPS低于15触发紧急降级
        this.degradedLevels = new Set();
        this.init();
    }

    init() {
        // 监听性能危机
        document.addEventListener('performanceCritical', () => {
            this.handlePerformanceCrisis();
        });

        // 监听内存警告
        if (window.performance?.memory) {
            setInterval(() => {
                this.checkMemoryUsage();
            }, 3000);
        }
    }

    handlePerformanceCrisis() {
        if (!this.isEnabled) return;

        console.warn('🚨 性能危机! 启动紧急保护模式');

        // 立即降级到最低质量
        this.emergencyDegrade();

        // 5分钟后尝试恢复
        setTimeout(() => {
            this.attemptRecovery();
        }, 300000);
    }

    emergencyDegrade() {
        const root = document.documentElement;

        // 禁用所有高级特效
        root.style.setProperty('--particle-density', '0.1');
        root.style.setProperty('--animation-speed', '0.5');
        root.style.setProperty('--animation-quality', 'low');

        // 隐藏非必要元素
        document.querySelectorAll('.floating-pumpkin, .floating-ghost, .floating-bat').forEach(elem => {
            elem.style.display = 'none';
        });

        this.degradedLevels.add('emergency');
    }

    attemptRecovery() {
        const avgFps = window.DynamicQualityController?.getAverageFPS() || 0;

        if (avgFps > 40) {
            console.log('✅ 性能恢复! 解除紧急保护模式');
            this.recoverFromDegradation();
        } else {
            console.log('⏳ 性能仍未恢复，保持保护模式');
            // 再次延迟尝试
            setTimeout(() => this.attemptRecovery(), 60000);
        }
    }

    recoverFromDegradation() {
        const root = document.documentElement;

        // 恢复质量设置
        root.style.setProperty('--particle-density', '');
        root.style.setProperty('--animation-speed', '');
        root.style.setProperty('--animation-quality', '');

        // 显示隐藏的元素
        document.querySelectorAll('.floating-pumpkin, .floating-ghost, .floating-bat').forEach(elem => {
            elem.style.display = '';
        });

        this.degradedLevels.clear();
    }

    checkMemoryUsage() {
        const memory = performance.memory;
        const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

        if (usageRatio > 0.9) {
            console.warn('🚨 内存使用过高! 启动垃圾回收');
            this.triggerGarbageCollection();
        }
    }

    triggerGarbageCollection() {
        // 清理未使用的视觉特效
        if (window.VisualEffects) {
            // 可以在这里添加清理逻辑
        }

        // 强制垃圾回收（如果支持）
        if (window.gc) {
            window.gc();
        }
    }

    disable() {
        this.isEnabled = false;
        this.recoverFromDegradation();
    }

    enable() {
        this.isEnabled = true;
    }
}

// ====================================
// 性能报告生成器
// ====================================
class PerformanceReporter {
    constructor() {
        this.reportData = {
            device: null,
            metrics: [],
            qualityChanges: [],
            recommendations: []
        };
        this.init();
    }

    init() {
        // 监听质量变化
        window.addEventListener('qualityChange', (e) => {
            this.recordQualityChange(e.detail);
        });

        // 定期生成报告
        setInterval(() => {
            this.generateReport();
        }, 30000);
    }

    recordQualityChange(detail) {
        this.reportData.qualityChanges.push({
            time: new Date().toISOString(),
            level: detail.level,
            fps: detail.fps,
            reason: 'automatic_adjustment'
        });
    }

    generateReport() {
        const deviceProfile = window.DevicePerformanceDetector?.getProfile();
        const qualityStats = window.DynamicQualityController?.getPerformanceStats();

        if (!deviceProfile || !qualityStats) return;

        const report = {
            timestamp: new Date().toISOString(),
            device: {
                level: deviceProfile.level,
                score: deviceProfile.score,
                cpu: deviceProfile.metrics.cpu,
                memory: deviceProfile.metrics.memory.total,
                gpu: deviceProfile.metrics.gpu.vendor
            },
            performance: {
                currentLevel: qualityStats.level,
                averageFPS: qualityStats.averageFPS,
                isStable: qualityStats.isStable
            },
            qualityChanges: this.reportData.qualityChanges.slice(-10), // 最近10次
            recommendations: this.generateRecommendations(deviceProfile, qualityStats)
        };

        this.reportData = report;
        return report;
    }

    generateRecommendations(deviceProfile, qualityStats) {
        const recommendations = [];

        if (qualityStats.averageFPS < 30) {
            recommendations.push({
                type: 'performance',
                priority: 'high',
                message: '当前FPS较低，建议降低动画质量'
            });
        }

        if (deviceProfile.metrics.memory.total < 4) {
            recommendations.push({
                type: 'hardware',
                priority: 'medium',
                message: '设备内存较低，部分特效可能被禁用'
            });
        }

        if (!deviceProfile.metrics.battery?.charging && deviceProfile.metrics.battery?.level < 0.3) {
            recommendations.push({
                type: 'battery',
                priority: 'low',
                message: '电量较低，已自动启用省电模式'
            });
        }

        return recommendations;
    }

    getReport() {
        return this.reportData;
    }

    exportReport() {
        const report = this.generateReport();
        const blob = new Blob([JSON.stringify(report, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance-report-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// ====================================
// 初始化智能性能适配系统
// ====================================
let devicePerformanceDetector = null;
let dynamicQualityController = null;
let autoDegradationProtector = null;
let performanceReporter = null;

async function initPerformanceAdapter() {
    console.log('🔧 初始化智能性能适配系统...');

    try {
        // 1. 检测设备性能
        devicePerformanceDetector = new DevicePerformanceDetector();
        await devicePerformanceDetector.init();

        const profile = devicePerformanceDetector.getProfile();
        console.log(`📱 设备性能等级: ${profile.level} (评分: ${profile.score}/100)`);

        // 2. 启动动态质量控制
        dynamicQualityController = new DynamicQualityController();

        // 3. 启动自动降级保护
        autoDegradationProtector = new AutoDegradationProtector();

        // 4. 启动性能报告
        performanceReporter = new PerformanceReporter();

        // 5. 应用初始质量设置
        applyInitialQualitySettings(profile);

        console.log('✅ 智能性能适配系统初始化完成');
        return {
            deviceProfile: profile,
            qualityController: dynamicQualityController,
            protector: autoDegradationProtector,
            reporter: performanceReporter
        };
    } catch (error) {
        console.error('❌ 性能适配系统初始化失败:', error);
        return null;
    }
}

function applyInitialQualitySettings(profile) {
    const root = document.documentElement;

    // 应用推荐设置
    Object.entries(profile.recommendations.enableEffects).forEach(([key, value]) => {
        root.style.setProperty(`--enable-${key}`, value ? '1' : '0');
    });

    root.style.setProperty('--particle-count', profile.recommendations.particleCount);
}

// 导出全局对象
window.PerformanceAdapter = {
    init: initPerformanceAdapter,
    getDeviceProfile: () => devicePerformanceDetector?.getProfile(),
    getQualityController: () => dynamicQualityController,
    getProtector: () => autoDegradationProtector,
    getReporter: () => performanceReporter,
    DevicePerformanceDetector,
    DynamicQualityController,
    AutoDegradationProtector,
    PerformanceReporter
};

console.log('⚡ 智能性能适配系统已加载');
