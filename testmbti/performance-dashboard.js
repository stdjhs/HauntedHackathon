/* ====================================
   实时性能监控仪表板 v4.0.0
   功能：可视化监控、性能分析、预警系统
   ==================================== */

class PerformanceDashboard {
    constructor() {
        this.charts = new Map();
        this.metrics = new Map();
        this.isVisible = false;
        this.refreshInterval = 1000; // 1秒刷新
        this.alertThresholds = {
            fps: { warning: 40, critical: 25 },
            memory: { warning: 70, critical: 85 },
            cpu: { warning: 60, critical: 80 }
        };
        this.init();
    }

    init() {
        this.setupMetricsCollection();
        this.createDashboardUI();
        console.log('📊 性能监控仪表板初始化完成');
    }

    setupMetricsCollection() {
        // FPS监控
        this.metrics.set('fps', {
            data: [],
            unit: 'fps',
            color: '#F8A51C'
        });

        // 内存使用监控
        this.metrics.set('memory', {
            data: [],
            unit: 'MB',
            color: '#6b1d9e'
        });

        // 响应时间监控
        this.metrics.set('responseTime', {
            data: [],
            unit: 'ms',
            color: '#5259FF'
        });

        // 错误率监控
        this.metrics.set('errorRate', {
            data: [],
            unit: '%',
            color: '#F25C5C'
        });

        // 网络延迟监控
        this.metrics.set('networkLatency', {
            data: [],
            unit: 'ms',
            color: '#00ff00'
        });
    }

    createDashboardUI() {
        const dashboard = document.createElement('div');
        dashboard.id = 'performance-dashboard';
        dashboard.innerHTML = `
            <div class="dashboard-header">
                <h3>📊 性能监控</h3>
                <div class="dashboard-controls">
                    <button id="toggle-dashboard" class="control-btn">🔽</button>
                    <button id="reset-metrics" class="control-btn">🔄</button>
                    <button id="export-data" class="control-btn">📤</button>
                    <button id="close-dashboard" class="control-btn">❌</button>
                </div>
            </div>
            <div class="dashboard-content">
                <div class="metrics-grid">
                    <div class="metric-card" data-metric="fps">
                        <div class="metric-header">
                            <span class="metric-icon">🎮</span>
                            <span class="metric-name">FPS</span>
                            <span class="metric-value">0</span>
                        </div>
                        <canvas class="metric-chart" width="200" height="80"></canvas>
                        <div class="metric-status status-good">正常</div>
                    </div>

                    <div class="metric-card" data-metric="memory">
                        <div class="metric-header">
                            <span class="metric-icon">💾</span>
                            <span class="metric-name">内存</span>
                            <span class="metric-value">0 MB</span>
                        </div>
                        <canvas class="metric-chart" width="200" height="80"></canvas>
                        <div class="metric-status status-good">正常</div>
                    </div>

                    <div class="metric-card" data-metric="responseTime">
                        <div class="metric-header">
                            <span class="metric-icon">⚡</span>
                            <span class="metric-name">响应时间</span>
                            <span class="metric-value">0 ms</span>
                        </div>
                        <canvas class="metric-chart" width="200" height="80"></canvas>
                        <div class="metric-status status-good">正常</div>
                    </div>

                    <div class="metric-card" data-metric="errorRate">
                        <div class="metric-header">
                            <span class="metric-icon">⚠️</span>
                            <span class="metric-name">错误率</span>
                            <span class="metric-value">0%</span>
                        </div>
                        <canvas class="metric-chart" width="200" height="80"></canvas>
                        <div class="metric-status status-good">正常</div>
                    </div>
                </div>

                <div class="system-info">
                    <h4>系统信息</h4>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">设备:</span>
                            <span class="info-value" id="device-info">-</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">浏览器:</span>
                            <span class="info-value" id="browser-info">-</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">屏幕分辨率:</span>
                            <span class="info-value" id="screen-info">-</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">运行时间:</span>
                            <span class="info-value" id="uptime-info">0s</span>
                        </div>
                    </div>
                </div>

                <div class="alerts-panel">
                    <h4>⚠️ 性能预警</h4>
                    <div id="alerts-list" class="alerts-list">
                        <div class="no-alerts">系统运行正常</div>
                    </div>
                </div>
            </div>
        `;

        // 添加样式
        this.addDashboardStyles();

        document.body.appendChild(dashboard);
        this.setupEventListeners();
        this.updateSystemInfo();
    }

    addDashboardStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #performance-dashboard {
                position: fixed;
                bottom: 20px;
                left: 20px;
                width: 350px;
                background: rgba(11, 12, 30, 0.95);
                border: 2px solid var(--halloween-orange);
                border-radius: 15px;
                backdrop-filter: blur(10px);
                color: white;
                font-family: 'Noto Sans SC', sans-serif;
                z-index: 10000;
                transition: all 0.3s ease;
                max-height: 600px;
                overflow: hidden;
            }

            #performance-dashboard.collapsed {
                height: 50px;
                overflow: hidden;
            }

            .dashboard-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px;
                background: rgba(248, 165, 28, 0.2);
                border-bottom: 1px solid var(--halloween-orange);
            }

            .dashboard-header h3 {
                margin: 0;
                font-size: 16px;
                color: var(--halloween-orange);
            }

            .dashboard-controls {
                display: flex;
                gap: 5px;
            }

            .control-btn {
                width: 30px;
                height: 30px;
                background: transparent;
                border: 1px solid var(--halloween-orange);
                border-radius: 5px;
                color: white;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s ease;
            }

            .control-btn:hover {
                background: var(--halloween-orange);
                transform: scale(1.1);
            }

            .dashboard-content {
                padding: 15px;
                max-height: 550px;
                overflow-y: auto;
            }

            .metrics-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-bottom: 20px;
            }

            .metric-card {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(248, 165, 28, 0.3);
                border-radius: 10px;
                padding: 10px;
            }

            .metric-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 5px;
            }

            .metric-name {
                font-size: 12px;
                color: var(--fog-gray);
            }

            .metric-value {
                font-size: 14px;
                font-weight: bold;
                color: var(--halloween-orange);
            }

            .metric-chart {
                width: 100%;
                height: 60px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 5px;
            }

            .metric-status {
                font-size: 10px;
                text-align: center;
                margin-top: 5px;
                padding: 2px 5px;
                border-radius: 3px;
            }

            .status-good {
                background: rgba(76, 175, 80, 0.3);
                color: #4CAF50;
            }

            .status-warning {
                background: rgba(255, 152, 0, 0.3);
                color: #FF9800;
            }

            .status-critical {
                background: rgba(244, 67, 54, 0.3);
                color: #F44336;
            }

            .system-info {
                margin-bottom: 20px;
            }

            .system-info h4 {
                margin: 0 0 10px 0;
                font-size: 14px;
                color: var(--halloween-orange);
            }

            .info-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 5px;
            }

            .info-item {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
            }

            .info-label {
                color: var(--fog-gray);
            }

            .info-value {
                color: white;
            }

            .alerts-panel h4 {
                margin: 0 0 10px 0;
                font-size: 14px;
                color: var(--halloween-orange);
            }

            .alerts-list {
                max-height: 100px;
                overflow-y: auto;
            }

            .alert-item {
                background: rgba(244, 67, 54, 0.2);
                border-left: 3px solid #F44336;
                padding: 8px;
                margin-bottom: 5px;
                border-radius: 3px;
                font-size: 11px;
            }

            .alert-item.warning {
                background: rgba(255, 152, 0, 0.2);
                border-left-color: #FF9800;
            }

            .alert-item.info {
                background: rgba(33, 150, 243, 0.2);
                border-left-color: #2196F3;
            }

            .no-alerts {
                text-align: center;
                color: var(--fog-gray);
                font-size: 12px;
                padding: 10px;
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // 切换仪表板显示/隐藏
        document.getElementById('toggle-dashboard').addEventListener('click', () => {
            const dashboard = document.getElementById('performance-dashboard');
            dashboard.classList.toggle('collapsed');
        });

        // 重置指标
        document.getElementById('reset-metrics').addEventListener('click', () => {
            this.resetMetrics();
        });

        // 导出数据
        document.getElementById('export-data').addEventListener('click', () => {
            this.exportMetrics();
        });

        // 关闭仪表板
        document.getElementById('close-dashboard').addEventListener('click', () => {
            this.hide();
        });
    }

    updateSystemInfo() {
        // 设备信息
        const deviceInfo = document.getElementById('device-info');
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        deviceInfo.textContent = isMobile ? '移动设备' : '桌面设备';

        // 浏览器信息
        const browserInfo = document.getElementById('browser-info');
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Chrome')) browserInfo.textContent = 'Chrome';
        else if (userAgent.includes('Firefox')) browserInfo.textContent = 'Firefox';
        else if (userAgent.includes('Safari')) browserInfo.textContent = 'Safari';
        else browserInfo.textContent = '未知';

        // 屏幕信息
        const screenInfo = document.getElementById('screen-info');
        screenInfo.textContent = `${screen.width}x${screen.height}`;

        // 运行时间
        const uptimeInfo = document.getElementById('uptime-info');
        const startTime = Date.now();
        setInterval(() => {
            const uptime = Math.floor((Date.now() - startTime) / 1000);
            const minutes = Math.floor(uptime / 60);
            const seconds = uptime % 60;
            uptimeInfo.textContent = `${minutes}m ${seconds}s`;
        }, 1000);
    }

    startMonitoring() {
        this.isVisible = true;
        this.monitorLoop();
    }

    stopMonitoring() {
        this.isVisible = false;
    }

    monitorLoop() {
        if (!this.isVisible) return;

        // 收集指标
        this.collectMetrics();

        // 更新图表
        this.updateCharts();

        // 检查预警
        this.checkAlerts();

        // 更新UI
        this.updateUI();

        setTimeout(() => this.monitorLoop(), this.refreshInterval);
    }

    collectMetrics() {
        // FPS指标
        const now = performance.now();
        const fps = Math.round(1000 / (now - (window.lastFrameTime || now)));
        this.addMetricData('fps', fps);

        // 内存指标
        if (performance.memory) {
            const memoryMB = Math.round(performance.memory.usedJSHeapSize / 1048576);
            this.addMetricData('memory', memoryMB);
        }

        // 响应时间指标
        const responseTime = Math.round(performance.now() - (performance.timing.navigationStart || now));
        this.addMetricData('responseTime', responseTime);

        // 错误率指标 (模拟)
        const errorRate = Math.random() * 5; // 模拟错误率
        this.addMetricData('errorRate', errorRate);

        // 网络延迟指标 (模拟)
        const networkLatency = Math.round(Math.random() * 100 + 50);
        this.addMetricData('networkLatency', networkLatency);
    }

    addMetricData(metricName, value) {
        const metric = this.metrics.get(metricName);
        if (!metric) return;

        metric.data.push({
            value,
            timestamp: Date.now()
        });

        // 保持最近60个数据点
        if (metric.data.length > 60) {
            metric.data.shift();
        }
    }

    updateCharts() {
        this.metrics.forEach((metric, metricName) => {
            const card = document.querySelector(`[data-metric="${metricName}"]`);
            if (!card) return;

            const canvas = card.querySelector('.metric-chart');
            this.drawChart(canvas, metric);
        });
    }

    drawChart(canvas, metric) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // 清空画布
        ctx.clearRect(0, 0, width, height);

        if (metric.data.length < 2) return;

        const data = metric.data;
        const maxValue = Math.max(...data.map(d => d.value));
        const minValue = Math.min(...data.map(d => d.value));
        const range = maxValue - minValue || 1;

        // 绘制线条
        ctx.beginPath();
        ctx.strokeStyle = metric.color;
        ctx.lineWidth = 2;

        data.forEach((point, index) => {
            const x = (index / (data.length - 1)) * width;
            const y = height - ((point.value - minValue) / range) * height;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // 绘制渐变填充
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, metric.color + '40');
        gradient.addColorStop(1, metric.color + '00');

        ctx.fillStyle = gradient;
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();
    }

    checkAlerts() {
        const alerts = [];

        // 检查FPS
        const fps = this.getLatestMetric('fps');
        if (fps < this.alertThresholds.fps.critical) {
            alerts.push({ type: 'critical', message: `FPS过低: ${fps}` });
        } else if (fps < this.alertThresholds.fps.warning) {
            alerts.push({ type: 'warning', message: `FPS较低: ${fps}` });
        }

        // 检查内存
        const memory = this.getLatestMetric('memory');
        if (memory > this.alertThresholds.memory.critical) {
            alerts.push({ type: 'critical', message: `内存使用过高: ${memory}MB` });
        } else if (memory > this.alertThresholds.memory.warning) {
            alerts.push({ type: 'warning', message: `内存使用较高: ${memory}MB` });
        }

        // 显示预警
        this.showAlerts(alerts);
    }

    getLatestMetric(metricName) {
        const metric = this.metrics.get(metricName);
        if (!metric || metric.data.length === 0) return 0;
        return metric.data[metric.data.length - 1].value;
    }

    showAlerts(alerts) {
        const alertsList = document.getElementById('alerts-list');
        alertsList.innerHTML = '';

        if (alerts.length === 0) {
            alertsList.innerHTML = '<div class="no-alerts">系统运行正常</div>';
            return;
        }

        alerts.forEach(alert => {
            const alertItem = document.createElement('div');
            alertItem.className = `alert-item ${alert.type}`;
            alertItem.textContent = alert.message;
            alertsList.appendChild(alertItem);
        });
    }

    updateUI() {
        // 更新指标值和状态
        this.metrics.forEach((metric, metricName) => {
            const card = document.querySelector(`[data-metric="${metricName}"]`);
            if (!card) return;

            const valueElement = card.querySelector('.metric-value');
            const statusElement = card.querySelector('.metric-status');

            const latestValue = this.getLatestMetric(metricName);
            valueElement.textContent = `${latestValue} ${metric.unit}`;

            // 更新状态
            let status = 'good';
            let statusText = '正常';

            if (metricName === 'fps' && latestValue < this.alertThresholds.fps.warning) {
                status = latestValue < this.alertThresholds.fps.critical ? 'critical' : 'warning';
                statusText = latestValue < this.alertThresholds.fps.critical ? '严重' : '警告';
            } else if (metricName === 'memory' && latestValue > this.alertThresholds.memory.warning) {
                status = latestValue > this.alertThresholds.memory.critical ? 'critical' : 'warning';
                statusText = latestValue > this.alertThresholds.memory.critical ? '严重' : '警告';
            }

            statusElement.className = `metric-status status-${status}`;
            statusElement.textContent = statusText;
        });
    }

    resetMetrics() {
        this.metrics.forEach(metric => {
            metric.data = [];
        });
        console.log('📊 性能指标已重置');
    }

    exportMetrics() {
        const data = {};
        this.metrics.forEach((metric, name) => {
            data[name] = metric.data;
        });

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance-metrics-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('📊 性能数据已导出');
    }

    show() {
        const dashboard = document.getElementById('performance-dashboard');
        dashboard.style.display = 'block';
        this.startMonitoring();
    }

    hide() {
        const dashboard = document.getElementById('performance-dashboard');
        dashboard.style.display = 'none';
        this.stopMonitoring();
    }
}

export default PerformanceDashboard;
