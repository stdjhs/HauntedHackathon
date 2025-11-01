/* ====================================
   性能监控可视化 - Performance Visualizer
   实时图表展示性能数据
   ==================================== */

class PerformanceVisualizer {
    constructor() {
        this.modal = null;
        this.isVisible = false;
        this.charts = {
            fpsCanvas: null,
            memoryCanvas: null
        };
        this.animationFrameId = null;
    }

    // 打开可视化面板
    open() {
        if (!window.performanceMonitor) {
            alert('性能监控未启动！请在URL添加 ?debug=true 启动监控。');
            return;
        }

        if (!performanceMonitor.isMonitoring) {
            performanceMonitor.start();
        }

        this.createModal();
        document.body.appendChild(this.modal);

        requestAnimationFrame(() => {
            this.modal.classList.add('visible');
            this.isVisible = true;
            this.startRendering();
        });

        audioManager.playSound('notification');
    }

    // 关闭面板
    close() {
        this.isVisible = false;
        this.stopRendering();

        this.modal.classList.remove('visible');
        setTimeout(() => {
            this.modal?.remove();
            this.modal = null;
        }, 300);
    }

    // 创建模态框
    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'perf-visualizer-modal';
        this.modal.innerHTML = `
            <div class="perf-visualizer-container">
                <div class="perf-visualizer-header">
                    <h2 class="perf-visualizer-title">📊 性能监控面板</h2>
                    <div class="perf-header-controls">
                        ${performanceMonitor.isMonitoring
                            ? '<button class="perf-control-btn" onclick="performanceVisualizer.pauseMonitoring()">⏸️ 暂停</button>'
                            : '<button class="perf-control-btn" onclick="performanceVisualizer.resumeMonitoring()">▶️ 继续</button>'
                        }
                        <button class="perf-control-btn" onclick="performanceVisualizer.exportReport()">📥 导出报告</button>
                        <button class="perf-close-btn" onclick="performanceVisualizer.close()">×</button>
                    </div>
                </div>

                <!-- 仪表盘 -->
                <div class="perf-dashboard">
                    <div class="perf-metric-card">
                        <div class="perf-metric-icon">⚡</div>
                        <div class="perf-metric-content">
                            <div class="perf-metric-label">当前FPS</div>
                            <div class="perf-metric-value" id="perf-fps-current">60</div>
                        </div>
                    </div>
                    <div class="perf-metric-card">
                        <div class="perf-metric-icon">📈</div>
                        <div class="perf-metric-content">
                            <div class="perf-metric-label">平均FPS</div>
                            <div class="perf-metric-value" id="perf-fps-avg">60</div>
                        </div>
                    </div>
                    <div class="perf-metric-card">
                        <div class="perf-metric-icon">💾</div>
                        <div class="perf-metric-content">
                            <div class="perf-metric-label">内存使用</div>
                            <div class="perf-metric-value" id="perf-memory-used">0 MB</div>
                        </div>
                    </div>
                    <div class="perf-metric-card">
                        <div class="perf-metric-icon">⏱️</div>
                        <div class="perf-metric-content">
                            <div class="perf-metric-label">运行时间</div>
                            <div class="perf-metric-value" id="perf-runtime">0s</div>
                        </div>
                    </div>
                </div>

                <!-- 图表区域 -->
                <div class="perf-charts">
                    <div class="perf-chart-container">
                        <h3 class="perf-chart-title">FPS 实时监控</h3>
                        <canvas id="perf-fps-chart" width="600" height="200"></canvas>
                        <div class="perf-chart-legend">
                            <span class="perf-legend-item">
                                <span class="perf-legend-dot" style="background: #F8A51C;"></span>
                                实时FPS
                            </span>
                            <span class="perf-legend-item">
                                <span class="perf-legend-line" style="background: #F25C5C;"></span>
                                60 FPS基准线
                            </span>
                        </div>
                    </div>

                    <div class="perf-chart-container">
                        <h3 class="perf-chart-title">内存使用监控</h3>
                        <canvas id="perf-memory-chart" width="600" height="200"></canvas>
                        <div class="perf-chart-legend">
                            <span class="perf-legend-item">
                                <span class="perf-legend-dot" style="background: #5259FF;"></span>
                                已用内存
                            </span>
                            <span class="perf-legend-item">
                                <span class="perf-legend-dot" style="background: #6b1d9e;"></span>
                                总分配内存
                            </span>
                        </div>
                    </div>
                </div>

                <!-- 详细统计 -->
                <div class="perf-details">
                    <div class="perf-detail-section">
                        <h3 class="perf-detail-title">📋 性能统计</h3>
                        <div class="perf-stats-grid" id="perf-stats-grid">
                            <!-- 动态生成 -->
                        </div>
                    </div>

                    <div class="perf-detail-section">
                        <h3 class="perf-detail-title">🎮 交互记录</h3>
                        <div class="perf-interactions-list" id="perf-interactions-list">
                            <!-- 动态生成 -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 获取Canvas元素
        setTimeout(() => {
            this.charts.fpsCanvas = this.modal.querySelector('#perf-fps-chart');
            this.charts.memoryCanvas = this.modal.querySelector('#perf-memory-chart');
        }, 0);
    }

    // 开始渲染
    startRendering() {
        this.render();
    }

    // 停止渲染
    stopRendering() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    // 渲染循环
    render() {
        if (!this.isVisible) return;

        this.updateMetrics();
        this.drawFPSChart();
        this.drawMemoryChart();
        this.updateStats();
        this.updateInteractionsList();

        this.animationFrameId = requestAnimationFrame(() => this.render());
    }

    // 更新指标卡片
    updateMetrics() {
        if (!performanceMonitor.metrics) return;

        const data = performanceMonitor.metrics;

        // 当前FPS
        if (data.fps.length > 0) {
            const currentFps = data.fps[data.fps.length - 1].value;
            const fpsElement = document.getElementById('perf-fps-current');
            if (fpsElement) {
                fpsElement.textContent = currentFps.toFixed(1);
                fpsElement.className = 'perf-metric-value ' + this.getFPSClass(currentFps);
            }
        }

        // 平均FPS
        const avgFps = this.calculateAverage(data.fps.map(f => f.value));
        const avgElement = document.getElementById('perf-fps-avg');
        if (avgElement) {
            avgElement.textContent = avgFps.toFixed(1);
        }

        // 内存使用
        if (data.memory.length > 0) {
            const latestMemory = data.memory[data.memory.length - 1];
            const memoryElement = document.getElementById('perf-memory-used');
            if (memoryElement) {
                memoryElement.textContent = `${latestMemory.used} MB`;
            }
        }

        // 运行时间
        const runtime = performance.now() - performanceMonitor.startTime;
        const runtimeElement = document.getElementById('perf-runtime');
        if (runtimeElement) {
            runtimeElement.textContent = (runtime / 1000).toFixed(1) + 's';
        }
    }

    // 绘制FPS图表
    drawFPSChart() {
        const canvas = this.charts.fpsCanvas;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const data = performanceMonitor.metrics.fps.slice(-60); // 最近60帧

        // 清空画布
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, width, height);

        // 绘制网格
        ctx.strokeStyle = 'rgba(176, 179, 193, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = (height / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // 绘制60FPS基准线
        ctx.strokeStyle = '#F25C5C';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, height - (60 / 120) * height);
        ctx.lineTo(width, height - (60 / 120) * height);
        ctx.stroke();
        ctx.setLineDash([]);

        if (data.length < 2) return;

        // 绘制FPS曲线
        ctx.strokeStyle = '#F8A51C';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        data.forEach((point, index) => {
            const x = (index / (data.length - 1)) * width;
            const y = height - (Math.min(point.value, 120) / 120) * height;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        // 绘制发光效果
        ctx.shadowColor = '#F8A51C';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 绘制Y轴标签
        ctx.fillStyle = '#B0B3C1';
        ctx.font = '12px monospace';
        ctx.textAlign = 'right';
        ['120', '90', '60', '30', '0'].forEach((label, i) => {
            ctx.fillText(label, width - 5, (height / 4) * i + 15);
        });
    }

    // 绘制内存图表
    drawMemoryChart() {
        const canvas = this.charts.memoryCanvas;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const data = performanceMonitor.metrics.memory.slice(-60);

        // 清空画布
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, width, height);

        // 绘制网格
        ctx.strokeStyle = 'rgba(176, 179, 193, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = (height / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        if (data.length < 2) return;

        // 找到最大值用于缩放
        const maxMemory = Math.max(...data.map(d => parseFloat(d.total)));

        // 绘制总内存曲线
        ctx.strokeStyle = '#6b1d9e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        data.forEach((point, index) => {
            const x = (index / (data.length - 1)) * width;
            const y = height - (parseFloat(point.total) / maxMemory) * height;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        // 绘制已用内存曲线
        ctx.strokeStyle = '#5259FF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        data.forEach((point, index) => {
            const x = (index / (data.length - 1)) * width;
            const y = height - (parseFloat(point.used) / maxMemory) * height;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        // 绘制发光效果
        ctx.shadowColor = '#5259FF';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 绘制Y轴标签
        ctx.fillStyle = '#B0B3C1';
        ctx.font = '12px monospace';
        ctx.textAlign = 'right';
        const labels = [maxMemory, maxMemory * 0.75, maxMemory * 0.5, maxMemory * 0.25, 0];
        labels.forEach((label, i) => {
            ctx.fillText(label.toFixed(0) + 'MB', width - 5, (height / 4) * i + 15);
        });
    }

    // 更新统计信息
    updateStats() {
        const statsGrid = document.getElementById('perf-stats-grid');
        if (!statsGrid) return;

        const data = performanceMonitor.metrics;
        const report = performanceMonitor.generateReport();

        statsGrid.innerHTML = `
            <div class="perf-stat-item">
                <span class="perf-stat-label">平均FPS</span>
                <span class="perf-stat-value">${report.平均FPS}</span>
            </div>
            <div class="perf-stat-item">
                <span class="perf-stat-label">最低FPS</span>
                <span class="perf-stat-value">${report.最低FPS}</span>
            </div>
            <div class="perf-stat-item">
                <span class="perf-stat-label">最高FPS</span>
                <span class="perf-stat-value">${report.最高FPS}</span>
            </div>
            <div class="perf-stat-item">
                <span class="perf-stat-label">内存使用</span>
                <span class="perf-stat-value">${report.内存使用}</span>
            </div>
            <div class="perf-stat-item">
                <span class="perf-stat-label">帧数记录</span>
                <span class="perf-stat-value">${data.fps.length}</span>
            </div>
            <div class="perf-stat-item">
                <span class="perf-stat-label">交互次数</span>
                <span class="perf-stat-value">${report.交互次数}</span>
            </div>
            <div class="perf-stat-item">
                <span class="perf-stat-label">错误次数</span>
                <span class="perf-stat-value">${report.错误次数}</span>
            </div>
            <div class="perf-stat-item">
                <span class="perf-stat-label">内存样本</span>
                <span class="perf-stat-value">${data.memory.length}</span>
            </div>
        `;
    }

    // 更新交互列表
    updateInteractionsList() {
        const list = document.getElementById('perf-interactions-list');
        if (!list) return;

        const interactions = performanceMonitor.metrics.interactions.slice(-10).reverse();

        if (interactions.length === 0) {
            list.innerHTML = '<div class="perf-empty-state">暂无交互记录</div>';
            return;
        }

        list.innerHTML = interactions.map(interaction => `
            <div class="perf-interaction-item">
                <span class="perf-interaction-type">${interaction.type}</span>
                <span class="perf-interaction-duration">${interaction.duration.toFixed(2)}ms</span>
                <span class="perf-interaction-time">${(interaction.timestamp / 1000).toFixed(1)}s</span>
            </div>
        `).join('');
    }

    // 暂停监控
    pauseMonitoring() {
        performanceMonitor.stop();
        this.updateControlButton('resume');
    }

    // 继续监控
    resumeMonitoring() {
        performanceMonitor.start();
        this.updateControlButton('pause');
    }

    // 更新控制按钮
    updateControlButton(state) {
        const btn = this.modal.querySelector('.perf-header-controls .perf-control-btn');
        if (btn) {
            if (state === 'pause') {
                btn.textContent = '⏸️ 暂停';
                btn.onclick = () => this.pauseMonitoring();
            } else {
                btn.textContent = '▶️ 继续';
                btn.onclick = () => this.resumeMonitoring();
            }
        }
    }

    // 导出报告
    exportReport() {
        const report = performanceMonitor.getData();
        const reportText = this.generateReportText(report);

        const blob = new Blob([reportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `performance-report-${Date.now()}.txt`;
        a.click();

        URL.revokeObjectURL(url);

        this.showNotification('📥 性能报告已导出');
        audioManager.playSound('talisman');
    }

    // 生成报告文本
    generateReportText(data) {
        const report = data.report;
        return `
万圣节MBTI测试 - 性能监控报告
========================================

📊 基本信息
----------------------------------------
总运行时间: ${report.总运行时间}
平均FPS: ${report.平均FPS}
最低FPS: ${report.最低FPS}
最高FPS: ${report.最高FPS}
内存使用: ${report.内存使用}
交互次数: ${report.交互次数}
错误次数: ${report.错误次数}

📈 FPS详细数据
----------------------------------------
${data.fps.slice(-20).map((f, i) =>
    `[${i}] 时间: ${(f.time/1000).toFixed(1)}s, FPS: ${f.value.toFixed(2)}`
).join('\n')}

💾 内存详细数据
----------------------------------------
${data.memory.slice(-10).map((m, i) =>
    `[${i}] 时间: ${(m.time/1000).toFixed(1)}s, 已用: ${m.used}MB, 总计: ${m.total}MB`
).join('\n')}

🎮 交互记录
----------------------------------------
${data.interactions.slice(-10).map((i, idx) =>
    `[${idx}] ${i.type}: ${i.duration.toFixed(2)}ms @ ${(i.timestamp/1000).toFixed(1)}s`
).join('\n')}

报告生成时间: ${new Date().toLocaleString()}
========================================
        `.trim();
    }

    // 显示通知
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'perf-notification';
        notification.textContent = message;

        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('visible'), 10);
        setTimeout(() => {
            notification.classList.remove('visible');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // 工具方法
    calculateAverage(arr) {
        if (arr.length === 0) return 0;
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    getFPSClass(fps) {
        if (fps >= 55) return 'perf-value-good';
        if (fps >= 30) return 'perf-value-warning';
        return 'perf-value-bad';
    }
}

// 创建全局实例
const performanceVisualizer = new PerformanceVisualizer();
