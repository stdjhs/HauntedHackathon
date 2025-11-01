/* ====================================
   配置可视化编辑器 - Config Editor
   提供直观的界面调整游戏配置
   ==================================== */

class ConfigEditor {
    constructor() {
        this.originalConfig = JSON.parse(JSON.stringify(CONFIG)); // 深拷贝原始配置
        this.modal = null;
        this.previewMode = false;
    }

    // 打开配置编辑器
    open() {
        this.createModal();
        this.render();
        document.body.appendChild(this.modal);

        // 触发淡入动画
        requestAnimationFrame(() => {
            this.modal.classList.add('visible');
        });

        audioManager.playSound('notification');
    }

    // 关闭编辑器
    close() {
        this.modal.classList.remove('visible');
        setTimeout(() => {
            this.modal?.remove();
            this.modal = null;
        }, 300);
    }

    // 创建模态框
    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'config-editor-modal';
        this.modal.innerHTML = `
            <div class="config-editor-container">
                <div class="config-editor-header">
                    <h2 class="config-editor-title">⚙️ 游戏配置编辑器</h2>
                    <button class="config-close-btn" onclick="configEditor.close()">×</button>
                </div>
                <div class="config-editor-body" id="config-editor-body">
                    <!-- 动态生成配置表单 -->
                </div>
                <div class="config-editor-footer">
                    <button class="config-btn config-btn-secondary" onclick="configEditor.resetToDefault()">
                        🔄 重置默认
                    </button>
                    <button class="config-btn config-btn-secondary" onclick="configEditor.exportConfig()">
                        💾 导出配置
                    </button>
                    <button class="config-btn config-btn-secondary" onclick="configEditor.importConfig()">
                        📂 导入配置
                    </button>
                    <button class="config-btn config-btn-primary" onclick="configEditor.applyConfig()">
                        ✅ 应用配置
                    </button>
                </div>
            </div>
        `;
    }

    // 渲染配置表单
    render() {
        const body = this.modal.querySelector('#config-editor-body');
        body.innerHTML = '';

        // 配置分类说明
        const configCategories = {
            DELAYS: {
                title: '⏱️ 时间配置',
                desc: '控制各种延迟和动画时长（毫秒）',
                unit: 'ms'
            },
            GAME: {
                title: '🎮 游戏配置',
                desc: '调整游戏难度和机制参数',
                unit: ''
            },
            FEAR: {
                title: '😱 恐惧值系统',
                desc: '控制恐惧值增长和阈值',
                unit: ''
            },
            ACHIEVEMENT: {
                title: '🏆 成就配置',
                desc: '设置成就解锁条件',
                unit: ''
            },
            ANIMATION: {
                title: '✨ 动画配置',
                desc: '控制背景动画效果',
                unit: ''
            },
            AUDIO: {
                title: '🔊 音频配置',
                desc: '调整音量和音效参数',
                unit: ''
            },
            PERFORMANCE: {
                title: '⚡ 性能配置',
                desc: '优化性能相关参数',
                unit: 'ms'
            }
        };

        // 为每个配置类别生成UI
        Object.keys(CONFIG).forEach(categoryKey => {
            const category = configCategories[categoryKey];
            if (!category) return;

            const section = document.createElement('div');
            section.className = 'config-section';
            section.innerHTML = `
                <div class="config-section-header">
                    <h3 class="config-section-title">${category.title}</h3>
                    <p class="config-section-desc">${category.desc}</p>
                </div>
                <div class="config-section-body" id="config-${categoryKey}">
                    ${this.renderConfigItems(categoryKey, CONFIG[categoryKey], category.unit)}
                </div>
            `;
            body.appendChild(section);
        });
    }

    // 渲染配置项
    renderConfigItems(categoryKey, configObj, unit) {
        return Object.keys(configObj).map(key => {
            const value = configObj[key];
            const fullKey = `${categoryKey}.${key}`;
            const label = this.formatLabel(key);

            // 根据值类型生成不同的输入控件
            if (typeof value === 'number') {
                return this.renderNumberInput(fullKey, label, value, unit);
            } else if (typeof value === 'boolean') {
                return this.renderToggle(fullKey, label, value);
            } else {
                return this.renderTextInput(fullKey, label, value);
            }
        }).join('');
    }

    // 渲染数字输入（带滑块）
    renderNumberInput(key, label, value, unit) {
        const isDecimal = value % 1 !== 0;
        const step = isDecimal ? 0.1 : 1;
        const max = this.getMaxValue(key, value);

        return `
            <div class="config-item">
                <label class="config-label">
                    <span class="config-label-text">${label}</span>
                    <span class="config-label-hint">${this.getHint(key)}</span>
                </label>
                <div class="config-input-group">
                    <input type="range"
                           class="config-slider"
                           id="slider-${key}"
                           min="0"
                           max="${max}"
                           step="${step}"
                           value="${value}"
                           oninput="configEditor.updateValue('${key}', this.value)">
                    <input type="number"
                           class="config-number"
                           id="input-${key}"
                           min="0"
                           max="${max}"
                           step="${step}"
                           value="${value}"
                           oninput="configEditor.updateValue('${key}', this.value)">
                    <span class="config-unit">${unit}</span>
                </div>
                <div class="config-value-display">
                    <span class="config-current-value">${value}</span>
                    <span class="config-default-value">默认: ${this.getOriginalValue(key)}</span>
                </div>
            </div>
        `;
    }

    // 渲染开关
    renderToggle(key, label, value) {
        return `
            <div class="config-item">
                <label class="config-label">
                    <span class="config-label-text">${label}</span>
                    <span class="config-label-hint">${this.getHint(key)}</span>
                </label>
                <label class="config-toggle">
                    <input type="checkbox"
                           id="input-${key}"
                           ${value ? 'checked' : ''}
                           onchange="configEditor.updateValue('${key}', this.checked)">
                    <span class="config-toggle-slider"></span>
                </label>
            </div>
        `;
    }

    // 渲染文本输入
    renderTextInput(key, label, value) {
        return `
            <div class="config-item">
                <label class="config-label">
                    <span class="config-label-text">${label}</span>
                </label>
                <input type="text"
                       class="config-text"
                       id="input-${key}"
                       value="${value}"
                       oninput="configEditor.updateValue('${key}', this.value)">
            </div>
        `;
    }

    // 更新配置值
    updateValue(key, value) {
        const [category, configKey] = key.split('.');
        const numValue = parseFloat(value);

        // 更新CONFIG对象
        if (!isNaN(numValue)) {
            CONFIG[category][configKey] = numValue;
        } else if (typeof value === 'boolean') {
            CONFIG[category][configKey] = value;
        } else {
            CONFIG[category][configKey] = value;
        }

        // 同步滑块和数字输入
        const slider = document.getElementById(`slider-${key}`);
        const input = document.getElementById(`input-${key}`);

        if (slider && input && slider !== event.target && input !== event.target) {
            slider.value = value;
            input.value = value;
        }

        // 更新显示值
        const display = input?.parentElement?.nextElementSibling?.querySelector('.config-current-value');
        if (display) {
            display.textContent = value;
            display.classList.add('config-value-changed');
            setTimeout(() => display.classList.remove('config-value-changed'), 300);
        }

        // 播放音效
        audioManager.playSound('hover');
    }

    // 应用配置
    applyConfig() {
        this.close();

        // 显示确认提示
        this.showNotification('✅ 配置已应用！刷新页面生效。', 'success');

        // 保存到LocalStorage
        try {
            localStorage.setItem('halloweenMbtiConfig', JSON.stringify(CONFIG));
        } catch (error) {
            console.error('保存配置失败:', error);
        }

        audioManager.playSound('achievement');
    }

    // 重置为默认值
    resetToDefault() {
        if (!confirm('确定要重置所有配置为默认值吗？')) {
            return;
        }

        // 恢复原始配置
        Object.keys(CONFIG).forEach(category => {
            Object.keys(CONFIG[category]).forEach(key => {
                CONFIG[category][key] = this.originalConfig[category][key];
            });
        });

        // 重新渲染
        this.render();

        this.showNotification('🔄 已重置为默认配置', 'info');
        audioManager.playSound('notification');
    }

    // 导出配置
    exportConfig() {
        const configJson = JSON.stringify(CONFIG, null, 2);
        const blob = new Blob([configJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `halloween-mbti-config-${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);

        this.showNotification('💾 配置已导出', 'success');
        audioManager.playSound('talisman');
    }

    // 导入配置
    importConfig() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedConfig = JSON.parse(event.target.result);

                    // 验证配置结构
                    if (this.validateConfig(importedConfig)) {
                        Object.assign(CONFIG, importedConfig);
                        this.render();
                        this.showNotification('📂 配置已导入', 'success');
                        audioManager.playSound('achievement');
                    } else {
                        this.showNotification('❌ 配置文件格式错误', 'error');
                    }
                } catch (error) {
                    this.showNotification('❌ 无法解析配置文件', 'error');
                    console.error('导入配置失败:', error);
                }
            };

            reader.readAsText(file);
        };

        input.click();
    }

    // 验证配置
    validateConfig(config) {
        const requiredKeys = Object.keys(this.originalConfig);
        return requiredKeys.every(key => key in config);
    }

    // 显示通知
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `config-notification config-notification-${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('visible'), 10);

        setTimeout(() => {
            notification.classList.remove('visible');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // 工具方法：格式化标签
    formatLabel(key) {
        // 将SCREAMING_SNAKE_CASE转换为可读文本
        return key
            .split('_')
            .map(word => word.charAt(0) + word.slice(1).toLowerCase())
            .join(' ');
    }

    // 工具方法：获取提示文本
    getHint(key) {
        const hints = {
            'DELAYS.LOADING_SCREEN': '加载屏幕显示时长',
            'DELAYS.JUMPSCARE': '惊吓特效持续时间',
            'DELAYS.NEXT_QUESTION': '切换问题的延迟',
            'GAME.CHASE_DURATION': '追逐游戏总时长（秒）',
            'GAME.RIDDLE_DURATION': '谜题游戏总时长（秒）',
            'FEAR.INCREMENT_EXTREME': '极限模式恐惧值增量',
            'FEAR.INCREMENT_NORMAL': '标准模式恐惧值增量',
            'FEAR.THRESHOLD_FEARLESS': '无畏者成就阈值',
            'ANIMATION.PARTICLES_COUNT': '背景粒子数量',
            'AUDIO.MASTER_GAIN': '主音量（0-1）',
        };
        return hints[key] || '';
    }

    // 工具方法：获取最大值
    getMaxValue(key, currentValue) {
        if (key.includes('GAIN')) return 1;
        if (key.includes('COUNT')) return 200;
        if (key.includes('DURATION')) return 60;
        if (key.includes('INCREMENT')) return 10;
        if (key.includes('THRESHOLD')) return 100;
        return currentValue * 5 || 100;
    }

    // 工具方法：获取原始值
    getOriginalValue(key) {
        const [category, configKey] = key.split('.');
        return this.originalConfig[category][configKey];
    }
}

// 创建全局实例
const configEditor = new ConfigEditor();

// 从LocalStorage加载配置
try {
    const savedConfig = localStorage.getItem('halloweenMbtiConfig');
    if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        Object.assign(CONFIG, parsed);
        console.log('✅ 已加载保存的配置');
    }
} catch (error) {
    console.error('加载配置失败:', error);
}
