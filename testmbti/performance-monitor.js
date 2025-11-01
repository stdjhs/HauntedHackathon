/* ====================================
   性能监控工具 - Performance Monitor
   用于监测和分析应用性能
   ==================================== */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            fps: [],
            memory: [],
            loadTime: 0,
            interactions: [],
            errors: []
        };
        this.isMonitoring = false;
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
    }

    // 启动监控
    start() {
        if (this.isMonitoring) return;

        this.isMonitoring = true;
        this.startTime = performance.now();
        this.measureFPS();
        this.measureMemory();

        console.log('📊 性能监控已启动');
    }

    // 停止监控
    stop() {
        this.isMonitoring = false;
        console.log('📊 性能监控已停止');
        this.generateReport();
    }

    // FPS监控
    measureFPS() {
        if (!this.isMonitoring) return;

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;
        const fps = 1000 / deltaTime;

        this.metrics.fps.push({
            time: currentTime - this.startTime,
            value: fps
        });

        this.lastFrameTime = currentTime;
        this.frameCount++;

        requestAnimationFrame(() => this.measureFPS());
    }

    // 内存监控
    measureMemory() {
        if (!this.isMonitoring) return;

        if (performance.memory) {
            const memory = {
                used: (performance.memory.usedJSHeapSize / 1048576).toFixed(2),
                total: (performance.memory.totalJSHeapSize / 1048576).toFixed(2),
                limit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2)
            };

            this.metrics.memory.push({
                time: performance.now() - this.startTime,
                ...memory
            });
        }

        if (this.isMonitoring) {
            setTimeout(() => this.measureMemory(), 1000);
        }
    }

    // 记录交互
    recordInteraction(type, duration) {
        this.metrics.interactions.push({
            type,
            duration,
            timestamp: performance.now() - this.startTime
        });
    }

    // 记录错误
    recordError(error) {
        this.metrics.errors.push({
            message: error.message,
            stack: error.stack,
            timestamp: performance.now() - this.startTime
        });
    }

    // 生成报告
    generateReport() {
        const report = {
            总运行时间: `${((performance.now() - this.startTime) / 1000).toFixed(2)}秒`,
            平均FPS: this.calculateAverageFPS(),
            最低FPS: this.calculateMinFPS(),
            最高FPS: this.calculateMaxFPS(),
            内存使用: this.getMemoryStats(),
            交互次数: this.metrics.interactions.length,
            错误次数: this.metrics.errors.length
        };

        console.log('📊 性能报告', report);
        return report;
    }

    // 计算平均FPS
    calculateAverageFPS() {
        if (this.metrics.fps.length === 0) return 0;
        const sum = this.metrics.fps.reduce((acc, cur) => acc + cur.value, 0);
        return (sum / this.metrics.fps.length).toFixed(2);
    }

    // 计算最低FPS
    calculateMinFPS() {
        if (this.metrics.fps.length === 0) return 0;
        const min = Math.min(...this.metrics.fps.map(f => f.value));
        return min.toFixed(2);
    }

    // 计算最高FPS
    calculateMaxFPS() {
        if (this.metrics.fps.length === 0) return 0;
        const max = Math.max(...this.metrics.fps.map(f => f.value));
        return max.toFixed(2);
    }

    // 获取内存统计
    getMemoryStats() {
        if (this.metrics.memory.length === 0) return '不可用';

        const latest = this.metrics.memory[this.metrics.memory.length - 1];
        return `${latest.used}MB / ${latest.total}MB`;
    }

    // 获取完整数据
    getData() {
        return {
            ...this.metrics,
            report: this.generateReport()
        };
    }
}

// 创建全局实例
const performanceMonitor = new PerformanceMonitor();

// 开发模式自动启动
if (window.location.search.includes('debug=true')) {
    console.log('🐛 调试模式：性能监控已自动启动');
    performanceMonitor.start();

    // 添加快捷键停止并查看报告（Ctrl+Shift+P）
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'P') {
            performanceMonitor.stop();
        }
    });
}

// 暴露到window供调试使用
window.performanceMonitor = performanceMonitor;

console.log('💡 提示：在URL添加?debug=true启动性能监控');
console.log('💡 提示：使用window.performanceMonitor访问性能数据');
