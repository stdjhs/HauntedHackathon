/* ====================================
   万圣节惊吓版 MBTI 测试脚本 - 完整版
   ==================================== */

// ====================================
// 常量配置 - 集中管理魔法数字
// ====================================
const CONFIG = {
    // 时间常量（毫秒）
    DELAYS: {
        LOADING_SCREEN: 3000,
        JUMPSCARE: 1000,
        JUMPSCARE_TRIGGER: 500,
        NEXT_QUESTION: 800,
        TRANSITION: 3000,
        CLUE_DISPLAY: 2000,
        GAME_SUCCESS: 3000,
        MESSAGE_INTERVAL: 1000,
        ACHIEVEMENT_DISPLAY: 3000
    },

    // 游戏配置
    GAME: {
        CHASE_DURATION: 15,        // 追逐游戏时长（秒）
        CHASE_MOVE_INTERVAL: 50,   // 移动更新间隔（毫秒）
        CHASE_COLLISION_DISTANCE: 50,  // 碰撞检测距离（像素）
        RIDDLE_DURATION: 20,       // 谜题游戏时长（秒）
        RIDDLE_MATCH_COUNT: 3,     // 需要匹配的符号数量
        QUESTION_TRIGGER_CHASE: 4, // 触发追逐游戏的题目序号
        QUESTION_TRIGGER_RIDDLE: 9 // 触发谜题游戏的题目序号
    },

    // 恐惧值配置
    FEAR: {
        INCREMENT_EXTREME: 3,
        INCREMENT_NORMAL: 2,
        INCREMENT_MILD: 1,
        INCREMENT_COLLISION: 5,
        INCREMENT_WRONG_ANSWER: 2,
        THRESHOLD_FEARLESS: 50
    },

    // 成就配置
    ACHIEVEMENT: {
        SPEED_THRESHOLD: 5000,     // 速度之王时间阈值（毫秒）
        PERFECT_COUNT: 10,         // 完美主义者连续次数
        MAX_CLUES: 3,              // 最大线索数量
        INITIAL_TALISMANS: 3       // 初始护身符数量
    },

    // 动画配置
    ANIMATION: {
        STARS_COUNT: 100,
        PARTICLES_COUNT: 50,
        WISPS_COUNT: 5,
        PARTICLE_MIN_DURATION: 10,
        PARTICLE_MAX_DURATION: 20
    },

    // 音频配置
    AUDIO: {
        MASTER_GAIN: 0.5,
        BACKGROUND_GAIN: 0.3,
        EFFECTS_GAIN: 0.6,
        HEARTBEAT_BPM: 60,
        HEARTBEAT_INTERVAL: 1000
    },

    // 性能配置
    PERFORMANCE: {
        THROTTLE_UPDATE: 100,      // 节流更新间隔（毫秒）
        DEBOUNCE_DELAY: 300        // 防抖延迟（毫秒）
    }
};

// ====================================
// 全局变量
// ====================================
let currentQuestionIndex = 0;
let answers = [];
let soundEnabled = true;
let fearLevel = 'normal'; // mild, normal, extreme
let fearValue = 0;
let talismans = CONFIG.ACHIEVEMENT.INITIAL_TALISMANS;
let collectedClues = 0;
let hasChaseGame = false;
let hasRiddleGame = false;
let secretEnding = false;

// DOM缓存 - 提升性能
const domCache = {
    // 基础元素
    progressContainer: null,
    questionContainer: null,
    resultContainer: null,
    currentQuestion: null,
    questionText: null,
    answersContainer: null,
    progressFill: null,
    progressText: null,

    // 获取缓存的DOM元素
    get(id) {
        const element = document.getElementById(id);
        if (element && !this[id]) {
            this[id] = element;
        }
        return this[id] || element;
    },

    // 清除缓存
    clear() {
        Object.keys(this).forEach(key => {
            if (key !== 'get' && key !== 'clear') {
                this[key] = null;
            }
        });
    }
};

// 错误处理系统
const ErrorHandler = {
    // 记录错误
    log(error, context = '') {
        console.error(`[万圣节MBTI测试] 错误 ${context}:`, error);
        // 在实际项目中可以发送到错误监控服务
    },

    // 尝试执行函数，捕获错误
    try(fn, context = '') {
        try {
            return fn();
        } catch (error) {
            this.log(error, context);
            return null;
        }
    },

    // 异步错误处理
    async tryAsync(fn, context = '') {
        try {
            return await fn();
        } catch (error) {
            this.log(error, context);
            return null;
        }
    }
};

// 防抖函数 - 优化性能
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            ErrorHandler.try(() => func(...args), 'debounce');
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// 节流函数 - 优化性能
const throttle = (func, limit) => {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            ErrorHandler.try(() => func.apply(context, args), 'throttle');
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
};

// 成就系统
let achievements = {
    // 基础成就
    firstTest: { unlocked: false, name: '初来乍到', desc: '完成首次测试', icon: '🎃' },
    braveSoul: { unlocked: false, name: '勇敢的灵魂', desc: '选择极限模式', icon: '💀' },
    gentleHeart: { unlocked: false, name: '温柔之心', desc: '选择温和模式', icon: '🌙' },

    // 游戏成就
    speedRunner: { unlocked: false, name: '速度之王', desc: '5秒内完成选择', icon: '⚡' },
    perfectClimber: { unlocked: false, name: '完美主义者', desc: '连续10题无犹豫', icon: '💎' },
    clueMaster: { unlocked: false, name: '线索大师', desc: '找到所有隐藏线索', icon: '🔍' },

    // 小游戏成就
    ghostDancer: { unlocked: false, name: '幽灵舞者', desc: '成功逃脱幽魂追逐', icon: '👻' },
    riddleSword: { unlocked: false, name: '破谜之剑', desc: '解开符号之谜', icon: '🗝️' },
    gameMaster: { unlocked: false, name: '游戏大师', desc: '完成所有小游戏', icon: '🏆' },

    // 特殊成就
   Fearless: { unlocked: false, name: '无畏者', desc: '恐惧值达到50', icon: '🛡️' },
    explorer: { unlocked: false, name: '探索者', desc: '解锁神秘结局', icon: '🗺️' },
    collector: { unlocked: false, name: '收藏家', desc: '收集3个护身符', icon: '💰' },

    // 社交成就
    sharer: { unlocked: false, name: '分享达人', desc: '分享测试结果', icon: '📤' },
    socialButterfly: { unlocked: false, name: '社交达人', desc: '被分享3次', icon: '🦋' },

    // 隐藏成就
    darkLord: { unlocked: false, name: '暗黑君主', desc: '获得INTJ人格', icon: '👑' },
    insaneScientist: { unlocked: false, name: '疯狂科学家', desc: '获得INTP人格', icon: '⚗️' },
    jester: { unlocked: false, name: '万圣节小丑', desc: '获得ENFP人格', icon: '🎭' },

    // 终极成就
    halloweenLegend: { unlocked: false, name: '万圣节传说', desc: '解锁所有成就', icon: '🌟' }
};

let unlockedAchievements = [];

// 音频相关
let audioContext = null;
let backgroundMusic = null;
let masterGain = null;

// 资源清理管理器 - 防止内存泄漏
const ResourceManager = {
    timers: [],      // 存储所有定时器ID
    intervals: [],   // 存储所有interval ID
    listeners: [],   // 存储事件监听器信息

    // 添加定时器
    addTimer(timerId) {
        this.timers.push(timerId);
        return timerId;
    },

    // 添加interval
    addInterval(intervalId) {
        this.intervals.push(intervalId);
        return intervalId;
    },

    // 添加事件监听器
    addListener(element, event, handler, options) {
        element.addEventListener(event, handler, options);
        this.listeners.push({ element, event, handler, options });
    },

    // 清理所有资源
    cleanupAll() {
        // 清理所有定时器
        this.timers.forEach(id => clearTimeout(id));
        this.timers = [];

        // 清理所有interval
        this.intervals.forEach(id => clearInterval(id));
        this.intervals = [];

        // 移除所有事件监听器
        this.listeners.forEach(({ element, event, handler, options }) => {
            element.removeEventListener(event, handler, options);
        });
        this.listeners = [];
    },

    // 清理特定定时器
    clearTimer(timerId) {
        clearTimeout(timerId);
        const index = this.timers.indexOf(timerId);
        if (index > -1) {
            this.timers.splice(index, 1);
        }
    },

    // 清理特定interval
    clearInterval(intervalId) {
        clearInterval(intervalId);
        const index = this.intervals.indexOf(intervalId);
        if (index > -1) {
            this.intervals.splice(index, 1);
        }
    }
};

// 页面卸载时清理所有资源
window.addEventListener('beforeunload', () => {
    ResourceManager.cleanupAll();
});

// ====================================
// 音效系统 (Web Audio API)
// ====================================
class AudioManager {
    constructor() {
        this.sounds = {};
        this.initialized = false;
        this.backgroundMusicGain = null;
        this.effectsGain = null;
    }

    async init() {
        try {
            // 创建AudioContext
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = audioContext.createGain();
            masterGain.gain.value = CONFIG.AUDIO.MASTER_GAIN;
            masterGain.connect(audioContext.destination);

            this.backgroundMusicGain = audioContext.createGain();
            this.backgroundMusicGain.gain.value = CONFIG.AUDIO.BACKGROUND_GAIN;
            this.backgroundMusicGain.connect(masterGain);

            this.effectsGain = audioContext.createGain();
            this.effectsGain.gain.value = CONFIG.AUDIO.EFFECTS_GAIN;
            this.effectsGain.connect(masterGain);

            this.initialized = true;

            // 启动背景音乐
            this.startBackgroundMusic();

        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }
    }

    // 创建背景音乐（心跳 + 风声）
    startBackgroundMusic() {
        if (!this.initialized) return;

        // 心跳节拍
        const createHeartbeat = () => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.frequency.value = CONFIG.AUDIO.HEARTBEAT_BPM; // 60 BPM
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.05, audioContext.currentTime + 0.1);

            oscillator.connect(gainNode);
            gainNode.connect(this.backgroundMusicGain);
            oscillator.start();

            const timerId = ResourceManager.addTimer(setTimeout(() => {
                oscillator.stop();
                oscillator.disconnect();
                gainNode.disconnect();
                ResourceManager.clearTimer(timerId);
            }, 200));
        };

        // 风声（白噪声）
        const createWindSound = () => {
            const bufferSize = audioContext.sampleRate * 2;
            const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.02;
            }

            const noise = audioContext.createBufferSource();
            noise.buffer = buffer;
            noise.loop = true;

            const filter = audioContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 800;

            noise.connect(filter);
            filter.connect(this.backgroundMusicGain);
            noise.start();
        };

        // 定期播放心跳 - 存储interval ID以便清理
        const heartbeatInterval = setInterval(() => {
            if (soundEnabled && fearLevel !== 'mild') {
                createHeartbeat();
            }
        }, CONFIG.AUDIO.HEARTBEAT_INTERVAL);
        ResourceManager.addInterval(heartbeatInterval);

        // 播放风声
        if (fearLevel !== 'mild') {
            createWindSound();
        }
    }

    // 音效配置 - 配置驱动设计，减少代码重复
    getSoundConfig() {
        return {
            // 单音符音效（带频率扫描）
            jumpscare: {
                type: 'single',
                waveType: 'sawtooth',
                frequencies: [
                    { value: 100, time: 0 },
                    { value: 800, time: 0.1, ramp: 'exponential' },
                    { value: 50, time: 0.3, ramp: 'exponential' }
                ],
                gain: { start: 0.3, end: 0.01 },
                duration: 0.3
            },
            hover: {
                type: 'single',
                waveType: 'sine',
                frequencies: [
                    { value: 300, time: 0 },
                    { value: 400, time: 0.1, ramp: 'exponential' }
                ],
                gain: { start: 0.05, end: 0.01 },
                duration: 0.1
            },
            select: {
                type: 'single',
                waveType: 'sine',
                frequencies: [
                    { value: 400, time: 0 },
                    { value: 600, time: 0.1, ramp: 'exponential' }
                ],
                gain: { start: 0.1, end: 0.01 },
                duration: 0.1
            },
            talisman: {
                type: 'single',
                waveType: 'sine',
                frequencies: [
                    { value: 200, time: 0 },
                    { value: 300, time: 0.1 },
                    { value: 400, time: 0.2 }
                ],
                gain: { start: 0.15, end: 0.01 },
                duration: 0.3
            },
            'chase-start': {
                type: 'single',
                waveType: 'sawtooth',
                frequencies: [
                    { value: 200, time: 0 },
                    { value: 100, time: 0.5, ramp: 'exponential' }
                ],
                gain: { start: 0.2, end: 0.01 },
                duration: 0.5
            },
            'riddle-start': {
                type: 'single',
                waveType: 'sine',
                frequencies: [
                    { value: 440, time: 0 },
                    { value: 554, time: 0.2 },
                    { value: 659, time: 0.4 }
                ],
                gain: { start: 0.1, end: 0.01 },
                duration: 0.5
            },
            'page-turn': {
                type: 'single',
                waveType: 'sine',
                frequencies: [
                    { value: 800, time: 0 },
                    { value: 400, time: 0.2, ramp: 'exponential' }
                ],
                gain: { start: 0.05, end: 0.01 },
                duration: 0.2
            },
            countdown: {
                type: 'single',
                waveType: 'square',
                frequencies: [{ value: 800, time: 0 }],
                gain: { start: 0.08, end: 0.01 },
                duration: 0.1
            },

            // 序列音效（多音符和弦）
            error: {
                type: 'sequence',
                waveType: 'square',
                frequencies: [150, 100],
                gain: { start: 0.1, end: 0.01 },
                duration: 0.2,
                delay: 100
            },
            warning: {
                type: 'sequence',
                waveType: 'triangle',
                frequencies: [440, 554, 659],
                gain: { start: 0.08, end: 0.01 },
                duration: 0.15,
                delay: 80
            },
            notification: {
                type: 'sequence',
                waveType: 'sine',
                frequencies: [523, 659, 784],
                gain: { start: 0.1, end: 0.01 },
                duration: 0.1,
                delay: 60
            },
            achievement: {
                type: 'sequence',
                waveType: 'triangle',
                frequencies: [262, 330, 392, 523, 659],
                gain: { start: 0.15, end: 0.01 },
                duration: 0.3,
                delay: 120
            },
            'chase-success': {
                type: 'sequence',
                waveType: 'triangle',
                frequencies: [220, 330, 440],
                gain: { start: 0.15, end: 0.01 },
                duration: 0.2,
                delay: 100
            },
            'riddle-success': {
                type: 'sequence',
                waveType: 'sine',
                frequencies: [262, 330, 392, 523],
                gain: { start: 0.12, end: 0.01 },
                duration: 0.15,
                delay: 80
            },
            finale: {
                type: 'sequence',
                waveType: 'sawtooth',
                frequencies: [196, 262, 330, 392, 523, 659],
                gain: { start: 0.15, end: 0.01 },
                duration: 0.5,
                delay: 100
            },
            'secret-reveal': {
                type: 'sequence',
                waveType: 'sawtooth',
                frequencies: [262, 262, 262, 523],
                gain: { start: 0.2, end: 0.01 },
                duration: 0.3,
                delay: 150
            },
            sparkle: {
                type: 'sequence',
                waveType: 'sine',
                frequencies: [1047, 1319, 1568],
                gain: { start: 0.08, end: 0.01 },
                duration: 0.1,
                delay: 30
            }
        };
    }

    // 创建单音符音效
    createSingleSound(config, now) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = config.waveType;

        // 设置频率扫描
        config.frequencies.forEach((freq, index) => {
            const time = now + freq.time;
            if (index === 0) {
                oscillator.frequency.setValueAtTime(freq.value, time);
            } else if (freq.ramp === 'exponential') {
                oscillator.frequency.exponentialRampToValueAtTime(freq.value, time);
            } else {
                oscillator.frequency.setValueAtTime(freq.value, time);
            }
        });

        // 设置增益包络
        gainNode.gain.setValueAtTime(config.gain.start, now);
        gainNode.gain.exponentialRampToValueAtTime(config.gain.end, now + config.duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.effectsGain);
        oscillator.start(now);
        oscillator.stop(now + config.duration);
    }

    // 创建序列音效
    createSequenceSound(config) {
        config.frequencies.forEach((freq, i) => {
            setTimeout(() => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                const now = audioContext.currentTime;

                osc.type = config.waveType;
                osc.frequency.value = freq;

                gain.gain.setValueAtTime(config.gain.start, now);
                gain.gain.exponentialRampToValueAtTime(config.gain.end, now + config.duration);

                osc.connect(gain);
                gain.connect(this.effectsGain);
                osc.start();
                osc.stop(now + config.duration);
            }, i * config.delay);
        });
    }

    // 播放音效 - 重构后的简洁版本
    playSound(type) {
        if (!this.initialized || !soundEnabled) return;

        // 特殊处理：打字音效（随机触发）
        if (type === 'typing') {
            if (Math.random() > 0.7) {
                const now = audioContext.currentTime;
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.type = 'sine';
                osc.frequency.value = 800 + Math.random() * 200;
                gain.gain.value = 0.02;
                osc.connect(gain);
                gain.connect(this.effectsGain);
                osc.start();
                osc.stop(now + 0.05);
            }
            return;
        }

        // 从配置获取音效参数
        const configs = this.getSoundConfig();
        const config = configs[type];

        if (!config) {
            console.warn(`未知音效类型: ${type}`);
            return;
        }

        const now = audioContext.currentTime;

        // 根据音效类型播放
        if (config.type === 'single') {
            this.createSingleSound(config, now);
        } else if (config.type === 'sequence') {
            this.createSequenceSound(config);
        }
    }

    // 切换音效
    toggle() {
        soundEnabled = !soundEnabled;
        if (masterGain) {
            masterGain.gain.value = soundEnabled ? 0.5 : 0;
        }
        return soundEnabled;
    }
}

const audioManager = new AudioManager();

// ====================================
// 加载状态管理器
// ====================================
const LoadingManager = {
    // 显示加载状态
    show(element, message = '加载中...') {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (!element) return;

        element.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; padding: 20px;">
                <div style="margin-right: 10px;">🎃</div>
                <span>${message}</span>
            </div>
        `;
        element.style.opacity = '0.7';
        element.style.pointerEvents = 'none';
    },

    // 隐藏加载状态
    hide(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (!element) return;

        element.style.opacity = '1';
        element.style.pointerEvents = 'auto';
    },

    // 带超时的加载状态
    showWithTimeout(element, message, timeout = 3000) {
        this.show(element, message);

        const timer = setTimeout(() => {
            console.warn('加载超时');
            this.hide(element);
        }, timeout);

        return () => {
            clearTimeout(timer);
            this.hide(element);
        };
    }
};

// ====================================
// 用户引导系统
// ====================================
const UserGuide = {
    storageKey: 'halloweenMbtiGuideSeen',
    overlay: null,
    styleElement: null,

    showFirstTimeTips() {
        if (this.hasSeenGuide()) {
            return;
        }

        this.ensureStyles();
        this.createOverlay();
    },

    hasSeenGuide() {
        try {
            return localStorage.getItem(this.storageKey) === 'true';
        } catch (error) {
            ErrorHandler.log(error, 'UserGuide.hasSeenGuide');
            return false;
        }
    },

    persistSeenFlag() {
        try {
            localStorage.setItem(this.storageKey, 'true');
        } catch (error) {
            ErrorHandler.log(error, 'UserGuide.persistSeenFlag');
        }
    },

    ensureStyles() {
        if (this.styleElement) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'user-guide-styles';
        style.textContent = `
            .user-guide-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.88);
                color: var(--ghost-white, #f5f5f5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10006;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
                padding: 20px;
            }
            .user-guide-overlay.visible {
                opacity: 1;
                pointer-events: auto;
            }
            .user-guide-card {
                max-width: 520px;
                width: 100%;
                background: rgba(24, 24, 24, 0.95);
                border-radius: 24px;
                border: 2px solid var(--halloween-orange, #ff6600);
                box-shadow: 0 20px 60px rgba(255, 102, 0, 0.35);
                padding: 32px;
                text-align: left;
            }
            .user-guide-title {
                font-size: 26px;
                margin-bottom: 12px;
                color: var(--halloween-orange, #ff6600);
                font-weight: 700;
            }
            .user-guide-steps {
                list-style: none;
                margin: 0 0 24px 0;
                padding: 0;
            }
            .user-guide-steps li {
                margin-bottom: 12px;
                font-size: 16px;
                color: var(--fog-gray, #d8d8d8);
                display: flex;
                align-items: flex-start;
            }
            .user-guide-steps li span {
                display: inline-block;
                min-width: 26px;
                font-weight: 600;
                color: var(--halloween-orange, #ff6600);
            }
            .user-guide-actions {
                display: flex;
                justify-content: flex-end;
                gap: 12px;
            }
            .user-guide-btn {
                background: linear-gradient(135deg, var(--halloween-orange, #ff6600), var(--blood-red, #b31217));
                border: none;
                color: #ffffff;
                padding: 12px 24px;
                border-radius: 999px;
                font-size: 16px;
                cursor: pointer;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            .user-guide-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 25px rgba(255, 102, 0, 0.45);
            }
            .user-guide-skip {
                background: transparent;
                border: 1px solid var(--fog-gray, #d8d8d8);
                color: var(--fog-gray, #d8d8d8);
            }
        `;
        document.head.appendChild(style);
        this.styleElement = style;
    },

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'user-guide-overlay';
        this.overlay.innerHTML = `
            <div class="user-guide-card">
                <div class="user-guide-title">首次体验提示</div>
                <ul class="user-guide-steps">
                    <li><span>1.</span> 根据胆量挑选驚嚇模式，極限模式會包含快速閃屏與強音效。</li>
                    <li><span>2.</span> 完成 16 道題並留意帶有線索圖標的選項，收集 3 個線索可解鎖彩蛋。</li>
                    <li><span>3.</span> 部分題目後會出現小遊戲，完成它們能獲得額外成就。</li>
                    <li><span>4.</span> 右下角可切換音效，測試結束後記得查看成就與統計。</li>
                </ul>
                <div class="user-guide-actions">
                    <button class="user-guide-btn user-guide-skip" data-action="skip-guide">跳過</button>
                    <button class="user-guide-btn" data-action="start-guide">準備好了</button>
                </div>
            </div>
        `;

        const closeHandler = () => {
            this.hideOverlay();
            this.persistSeenFlag();
        };

        this.overlay.addEventListener('click', (event) => {
            if (event.target === this.overlay) {
                closeHandler();
            }
        });

        const actions = this.overlay.querySelectorAll('[data-action]');
        actions.forEach(actionButton => {
            actionButton.addEventListener('click', closeHandler);
        });

        document.body.appendChild(this.overlay);

        requestAnimationFrame(() => {
            this.overlay.classList.add('visible');
        });
    },

    hideOverlay() {
        if (!this.overlay) {
            return;
        }

        this.overlay.classList.remove('visible');
        setTimeout(() => {
            this.overlay?.remove();
            this.overlay = null;
        }, 250);
    }
};

// ====================================
// MBTI 测试问题数据
// ====================================
const questions = [
    {
        question: "万圣节派对上，你更喜欢：",
        answers: [
            { text: "主动和很多人聊天，成为派对焦点", type: "E" },
            { text: "和几个熟悉的朋友深入交流", type: "I" }
        ]
    },
    {
        question: "面对恐怖电影时，你更倾向于：",
        answers: [
            { text: "分析剧情逻辑和拍摄技巧", type: "S" },
            { text: "沉浸在意象和象征意义上", type: "N" }
        ]
    },
    {
        question: "收到神秘万圣节邀请函时，你首先会：",
        answers: [
            { text: "仔细检查所有细节和真实性", type: "T" },
            { text: "感受邀请函带来的情绪和氛围", type: "F" }
        ]
    },
    {
        question: "万圣节旅行规划，你更喜欢：",
        answers: [
            { text: "制定详细的时间表和路线", type: "J" },
            { text: "随心所欲，走到哪算哪", type: "P" },
            { text: "点击这里 🔍", type: "clue" }
        ]
    },
    {
        question: "在鬼屋中，你的反应是：",
        answers: [
            { text: "大声尖叫，和朋友们分享感受", type: "E" },
            { text: "内心紧张但保持沉默观察", type: "I" }
        ]
    },
    {
        question: "制作万圣节装饰时，你更关注：",
        answers: [
            { text: "道具的实际效果和逼真程度", type: "S" },
            { text: "装饰传达的神秘感和创意", type: "N" }
        ]
    },
    {
        question: "朋友在万圣节派对上表现异常，你会：",
        answers: [
            { text: "理性分析可能的原因", type: "T" },
            { text: "关心朋友的感受并主动询问", type: "F" }
        ]
    },
    {
        question: "万圣节项目截止日期前，你会：",
        answers: [
            { text: "提前几天完成所有准备", type: "J" },
            { text: "最后一刻才开始准备", type: "P" }
        ]
    },
    {
        question: "参加万圣节活动时，你更喜欢：",
        answers: [
            { text: "热闹的大型派对", type: "E" },
            { text: "安静的恐怖片马拉松", type: "I" }
        ]
    },
    {
        question: "万圣节装扮上，你更倾向于：",
        answers: [
            { text: "高度还原经典角色", type: "S" },
            { text: "创造独特原创角色", type: "N" },
            { text: "点击查看线索 📜", type: "clue" }
        ]
    },
    {
        question: "处理万圣节预算时，你更重视：",
        answers: [
            { text: "性价比和实用性", type: "T" },
            { text: "是否能让大家开心", type: "F" }
        ]
    },
    {
        question: "万圣节规划中，你更喜欢：",
        answers: [
            { text: "按部就班执行计划", type: "J" },
            { text: "根据当天情况灵活调整", type: "P" }
        ]
    },
    {
        question: "收到陌生人的万圣节糖果时，你会：",
        answers: [
            { text: "礼貌接受并道谢", type: "F" },
            { text: "先检查是否安全再接受", type: "T" }
        ]
    },
    {
        question: "万圣节夜晚，你更想：",
        answers: [
            { text: "和朋友一起去捣蛋", type: "E" },
            { text: "在家准备糖果等孩子们", type: "I" }
        ]
    },
    {
        question: "面对万圣节装饰，你首先注意到：",
        answers: [
            { text: "每个装饰品的细节和制作工艺", type: "S" },
            { text: "整体营造的氛围和感觉", type: "N" }
        ]
    },
    {
        question: "万圣节派对上遇到冷场时，你会：",
        answers: [
            { text: "主动讲鬼故事活跃气氛", type: "E" },
            { text: "默默等待自然恢复", type: "I" }
        ]
    },
    {
        question: "选择万圣节服装时，你更看重：",
        answers: [
            { text: "是否舒适易穿", type: "S" },
            { text: "视觉效果是否震撼", type: "N" }
        ]
    },
    {
        question: "万圣节活动组织中，你更擅长：",
        answers: [
            { text: "处理突发状况和问题", type: "T" },
            { text: "关心每个人的感受", type: "F" }
        ]
    },
    {
        question: "万圣节后，你最想做的是：",
        answers: [
            { text: "立即整理物品，恢复原状", type: "J" },
            { text: "让万圣节氛围再延续几天", type: "P" }
        ]
    },
    {
        question: "在万圣节迷宫里，你更喜欢：",
        answers: [
            { text: "跟着路标提示前进", type: "S" },
            { text: "凭直觉走未知的路", type: "N" }
        ]
    },
    {
        question: "万圣节最吸引你的是：",
        answers: [
            { text: "传统习俗和仪式感", type: "S" },
            { text: "想象力和无限可能", type: "N" }
        ]
    }
];

// ====================================
// MBTI 类型数据
// ====================================
const personalityTypes = {
    "INTJ": {
        name: "城堡中的暗黑君主",
        description: "你就像万圣节城堡中神秘的君主，拥有深不可测的智慧和远见。你享受独处的力量，擅长制定长远计划。在恐怖世界中，你是那个冷静分析、超前布局的幕后黑手。你的直觉异常敏锐，能够预知危险，是朋友们的黑暗向导。",
        traits: [
            "🎯 战略大师：总能提前预知惊吓点",
            "🏰 孤独君主：享受在黑暗中独处",
            "🔮 预知能力：能洞察事物的本质",
            "💎 稀有品种：只占人口的2%",
            "🧠 理性分析：不会被情绪左右"
        ],
        compatibility: "最佳拍档是同样神秘的INTJ或ENFP，两者互补能创造最完美的万圣节体验！"
    },
    "INTP": {
        name: "疯狂科学家",
        description: "你是万圣节实验室中的疯狂发明家！对一切超自然现象充满好奇，喜欢用科学的角度解释鬼魂和怪物。你是创新的源泉，总能设计出令人惊叹的万圣节装置。虽然社交不多，但你的发明让所有人都惊叹不已！",
        traits: [
            "⚗️ 创新发明：万圣节道具的创造者",
            "🤔 逻辑大师：用科学解释超自然",
            "🎭 独立思考：喜欢独自研究",
            "💡 灵感闪现：创意不断涌现",
            "🌟 独特视角：看到别人看不到的"
        ],
        compatibility: "与ENTJ或INFJ搭配最棒，他们能帮你把发明变成现实！"
    },
    "ENTJ": {
        name: "万圣节大魔王",
        description: "你注定是万圣节派对的主导者！天生的领导气质让你能够在任何恐怖场景中都掌控全局。你高效、有决断力，总能让活动圆满成功。无论是组织鬼屋探险还是主持惊吓派对，你都是当之无愧的万圣节之王！",
        traits: [
            "👑 天生领袖：自然而然成为焦点",
            "🎪 组织大师：活动策划能力满分",
            "⚡ 行动派：想到就做，绝不拖延",
            "🔥 激励他人：能点燃团队激情",
            "🎯 目标明确：永远知道自己要什么"
        ],
        compatibility: "与INFP或ISFP合作最好，你的行动力配上他们的创造力无敌！"
    },
    "ENTP": {
        name: "捣蛋恶魔",
        description: "你是万圣节最让人头疼也最受欢迎的捣蛋鬼！你机智、幽默，脑子里装着无数鬼点子。你热爱挑战和创新，总是能想出让人意想不到的惊吓方式。社交对你来说是充电的方式，你到哪里都是开心果！",
        traits: [
            "😈 鬼点子王：创意无穷无尽",
            "🎊 社交达人：走到哪都是中心",
            "⚡ 快速反应：临场应变能力超强",
            "🎭 表演天赋：天生的演员",
            "🔥 热情如火：感染身边每个人"
        ],
        compatibility: "配对ISFJ或ISTJ，你们的组合能创造完美平衡！"
    },
    "INFJ": {
        name: "灵能巫师",
        description: "你是万圣节世界中神秘的灵能巫师！拥有强大的共情能力和深刻的洞察力。你能感受到常人察觉不到的超自然存在，是连接现实与鬼魂世界的桥梁。你话不多，但每句话都充满智慧。",
        traits: [
            "🔮 灵能感知：能看见普通人看不到的",
            "💜 共情大师：深度理解他人情感",
            "🌙 夜晚精灵：在夜间更有力量",
            "📚 深度思考：追求意义的本质",
            "✨ 稀有而珍贵：人群中仅占1%"
        ],
        compatibility: "与ENFP或ENTP最配，你们能互相启发成长！"
    },
    "INFP": {
        name: "暗黑童话公主",
        description: "你就像从暗黑童话中走出的公主！内心世界丰富多彩，对万圣节有着独特的浪漫想象。你善良、真诚，虽然内向但有着强烈的价值观。你相信每个灵魂都有美好的一面，即使是最可怕的怪物也有故事。",
        traits: [
            "🌹 浪漫主义：把恐怖当作艺术",
            "💝 真诚善良：温暖每个人的心",
            "🎨 创意无限：用想象力创造美好",
            "🌈 独特价值观：坚持自己的信念",
            "🦋 理想主义者：相信美好终将到来"
        ],
        compatibility: "与ENFJ或ENTJ最佳，你的温暖能化解他们的严肃！"
    },
    "ENFJ": {
        name: "魅惑女王",
        description: "你是万圣节派对上最具魅力的女王！天生的社交能力和感染力让你无论走到哪里都能成为焦点。你关心每个人的感受，总能让所有人都感到温暖和受欢迎。你是那个记住每个人喜好，并精心策划惊喜的贴心人。",
        traits: [
            "💖 魅力无限：天生的万人迷",
            "🤗 温暖关怀：照顾每个人的情绪",
            "🎭 表演天赋：在舞台上发光发热",
            "🌟 正能量：能激励和鼓舞他人",
            "💌 贴心细腻：记得所有人的喜好"
        ],
        compatibility: "与ISFP或INFP组成完美组合，互相扶持！"
    },
    "ENFP": {
        name: "万圣节精灵",
        description: "你是万圣节最活泼的精灵！总是充满热情和活力，能瞬间点燃全场气氛。你富有创造力和想象力，总是能想出新奇有趣的游戏和活动。你热爱自由，讨厌被束缚，是那个让所有人都笑得合不拢嘴的开心果！",
        traits: [
            "🎉 活力四射：永远充满热情",
            "🎨 创意无限：想法天马行空",
            "🕊️ 自由灵魂：讨厌被规则束缚",
            "🌈 社交达人：认识超多朋友",
            "✨ 乐观积极：总能发现美好"
        ],
        compatibility: "与INTJ或ISTJ最互补，他们的稳重是你的依靠！"
    },
    "ISTJ": {
        name: "南瓜卫士",
        description: "你是万圣节传统最忠诚的守护者！稳重、可靠，是朋友们的定心丸。你严格按照传统庆祝万圣节，每个细节都不容马虎。虽然看起来严肃，但内心温暖，是那个默默为大家准备惊喜的人。",
        traits: [
            "🛡️ 忠诚可靠：朋友最坚实的后盾",
            "📜 传统守护者：坚守万圣节习俗",
            "⚖️ 责任担当：说到做到不食言",
            "🎯 细致认真：注重每个细节",
            "💪 稳重如山：危机中的稳定力量"
        ],
        compatibility: "与ESFP或ENFP搭配，你们能创造完美体验！"
    },
    "ISFJ": {
        name: "守护天使",
        description: "你是万圣节派对上最贴心的守护天使！温暖、细致，默默关心着每个人的需求。你是那个提前准备好热巧克力、记得每个人忌口的人。虽然内向，但你用行动表达关爱，是团队中最温暖的存在。",
        traits: [
            "👼 温暖守护：时刻关怀他人",
            "🍭 贴心周到：考虑每个人的需求",
            "🎁 惊喜制造者：默默准备礼物",
            "💝 深情厚谊：珍惜每段友谊",
            "🌸 温柔力量：用温暖感化一切"
        ],
        compatibility: "与ESFJ或ENTP结伴，你们的组合无可挑剔！"
    },
    "ESTJ": {
        name: "万圣节指挥官",
        description: "你是万圣节活动的总指挥官！天生的组织能力让你能把任何活动办得有条不紊。你高效、执行力强，讨厌拖沓和混乱。你是那个制定规则、确保一切顺利进行的管理者，虽然严格但大家都很信任你。",
        traits: [
            "📊 管理天才：天生的组织者",
            "⚡ 行动迅速：绝不浪费时间",
            "👮 规则制定：让一切井然有序",
            "🏆 追求卓越：要做就做最好",
            "🛡️ 保护他人：维护团队利益"
        ],
        compatibility: "与ISFP或INFP最合适，你的效率配上他们的创意！"
    },
    "ESFJ": {
        name: "派对策划师",
        description: "你是万圣节最棒的派对策划师！你天生懂得如何让每个人开心，用心营造温馨欢乐的氛围。你重视传统和礼仪，总能让聚会既热闹又有序。你是那个记住每个人生日、准备惊喜、制造温暖回忆的人。",
        traits: [
            "🎪 派对灵魂：让聚会充满欢乐",
            "💕 温暖关怀：照顾每个人的感受",
            "🎭 社交达人：天生善于交际",
            "📅 规划能力：活动安排得井井有条",
            "⭐ 感染力强：能带动全场气氛"
        ],
        compatibility: "与ISFJ或ENTP合作，你们能创造完美派对！"
    },
    "ISTP": {
        name: "机械师",
        description: "你是万圣节装置的顶级工程师！心灵手巧，能够创造出令人惊叹的机械装置和特效。你冷静、务实，解决问题能力超强。虽然话不多，但一出手就让人惊叹。你是那个默默修好所有设备、提供技术支持的无名英雄。",
        traits: [
            "🔧 机械天才：万圣节装置的创造者",
            "🛠️ 实践专家：动手能力超强",
            "🎯 问题解决：冷静应对危机",
            "🔍 细节洞察：发现别人忽略的问题",
            "🏆 低调英雄：默默贡献力量"
        ],
        compatibility: "与ESTJ或ESFJ配合最好，他们的热情配合你的技术！"
    },
    "ISFP": {
        name: "暗黑艺术家",
        description: "你是万圣节最独特的暗黑艺术家！用独特的审美和创意诠释恐怖之美。你内向、敏感，但拥有惊人的艺术天赋。你创造的万圣节作品总是与众不同，既恐怖又美丽，让人印象深刻。",
        traits: [
            "🎨 艺术天才：用创意诠释恐怖",
            "🦋 独特审美：与众不同的品味",
            "🌙 内向敏感：深度感受世界",
            "💖 善良真诚：用作品传达情感",
            "✨ 审美大师：美感无处不在"
        ],
        compatibility: "与ENFJ或ENTJ最佳配对，他们的支持让你闪耀！"
    },
    "ESTP": {
        name: "狂欢之王",
        description: "你是万圣节派对的狂欢之王！充满活力和冒险精神，哪里最热闹就往哪里去。你大胆、果断，总能在关键时刻做出惊人举动。你是那个带动全场气氛、让大家忘记烦恼的开心果！",
        traits: [
            "🎊 狂欢灵魂：永远处在high点",
            "⚡ 行动迅速：想到就做",
            "🎭 表演天才：天生的舞台明星",
            "🎯 勇敢无畏：敢于挑战一切",
            "💃 社交高手：派对中的焦点"
        ],
        compatibility: "与ISFJ或INFJ最配，你的活跃需要他们的稳重！"
    },
    "ESFP": {
        name: "开心果精",
        description: "你是万圣节最可爱的开心果精！活泼开朗，充满正能量，总能让阴郁的氛围变得光明。你温暖、真诚，是那个用笑声治愈一切的人。你活在当下，享受每一刻的快乐，是朋友圈中的小太阳！",
        traits: [
            "☀️ 阳光温暖：驱散一切阴霾",
            "🎈 快乐传染：笑声传遍全场",
            "💃 活泼好动：永远充满活力",
            "🎁 惊喜制造：给大家带来意外惊喜",
            "🌟 真实自我：做最自然的自己"
        ],
        compatibility: "与ISTJ或ISFJ最棒，你们的组合完美互补！"
    }
};

// ====================================
// DOM 元素
// ====================================
const loadingScreen = document.getElementById('loading-screen');
const scareIntro = document.getElementById('scare-intro');
const progressContainer = document.getElementById('progress-container');
const questionContainer = document.getElementById('question-container');
const transitionOverlay = document.getElementById('transition-overlay');
const resultContainer = document.getElementById('result-container');
const jumpscare = document.getElementById('jumpscare');
const soundToggleElement = document.getElementById('sound-toggle');

// ====================================
// 初始化
// ====================================
window.addEventListener('DOMContentLoaded', async () => {
    try {
        initializeBackground();
        await initializeTest();
    } catch (error) {
        ErrorHandler.log(error, 'DOMContentLoaded初始化');
        // 显示用户友好的错误提示
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; color: white; text-align: center; font-family: sans-serif; padding: 20px;">
                <div>
                    <h2 style="color: #F8A51C; margin-bottom: 20px;">😱 出现了一些问题</h2>
                    <p style="color: #B0B3C1;">万圣节测试遇到了意外情况，请刷新页面重试。</p>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 12px 30px; background: linear-gradient(135deg, #F8A51C, #F25C5C); border: none; border-radius: 25px; color: white; cursor: pointer; font-size: 16px;">
                        🔄 重新加载
                    </button>
                </div>
            </div>
        `;
    }
});

// 初始化夜空背景
function initializeBackground() {
    return ErrorHandler.try(() => {
        // 创建夜空
        const nightSky = document.createElement('div');
        nightSky.className = 'night-sky';

        // 创建星星
        const starsContainer = document.createElement('div');
        starsContainer.className = 'stars';

        for (let i = 0; i < 100; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.animationDelay = Math.random() * 3 + 's';
            starsContainer.appendChild(star);
        }

        // 创建月亮
        const moon = document.createElement('div');
        moon.className = 'moon';
        nightSky.appendChild(starsContainer);
        nightSky.appendChild(moon);

        // 创建鬼火
        for (let i = 0; i < 5; i++) {
            const wisp = document.createElement('div');
            wisp.className = 'will-o-wisp';
            wisp.style.left = Math.random() * 100 + '%';
            wisp.style.top = Math.random() * 100 + '%';
            wisp.style.animationDelay = Math.random() * 8 + 's';
            nightSky.appendChild(wisp);
        }

        document.body.appendChild(nightSky);

        // 创建背景粒子
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'particles';

        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 15 + 's';
            particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
            particlesContainer.appendChild(particle);
        }

        document.body.appendChild(particlesContainer);
    }, '背景初始化');
}

// 初始化测试
async function initializeTest() {
    // 显示首次使用提示
    UserGuide.showFirstTimeTips();

    // 显示加载状态
    const cleanupLoading = LoadingManager.showWithTimeout('loading-screen', '正在唤醒黑暗力量...', 5000);

    // 初始化音频
    const audioInitResult = await ErrorHandler.tryAsync(
        () => audioManager.init(),
        '音频初始化'
    );

    // 显示加载动画
    setTimeout(() => {
        cleanupLoading();
        loadingScreen.classList.add('hidden');
        showFearLevelSelector();
    }, 3000);

    // 绑定事件监听器
    bindEventListeners();
}

// 绑定事件监听器
function bindEventListeners() {
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const shareBtn = document.getElementById('share-btn');
    const soundToggleBtn = soundToggleElement || document.getElementById('sound-toggle');

    if (startBtn) startBtn.addEventListener('click', startTest);
    if (restartBtn) restartBtn.addEventListener('click', restartTest);
    if (shareBtn) shareBtn.addEventListener('click', openSharePoster);
    if (soundToggleBtn) soundToggleBtn.addEventListener('click', toggleSound);
}

// ====================================
// 惊吓等级选择
// ====================================
function showFearLevelSelector() {
    const fearLevelContainer = document.createElement('div');
    fearLevelContainer.className = 'fear-level-container';

    fearLevelContainer.innerHTML = `
        <div class="fear-level-card">
            <h2 class="fear-level-title">选择你的惊吓等级</h2>
            <p class="fear-level-subtitle">请选择你希望体验的恐怖程度</p>
            <div class="fear-levels">
                <div class="fear-level-option" data-level="mild">
                    <div class="fear-level-name">🌙 温和模式</div>
                    <div class="fear-level-desc">适合胆小鬼，没有突然惊吓</div>
                </div>
                <div class="fear-level-option selected" data-level="normal">
                    <div class="fear-level-name">👻 标准模式</div>
                    <div class="fear-level-desc">适中的恐怖体验，有轻微惊吓</div>
                </div>
                <div class="fear-level-option" data-level="extreme">
                    <div class="fear-level-name">💀 极限模式</div>
                    <div class="fear-level-desc">终极恐怖体验，高能预警！</div>
                </div>
            </div>
            <div class="fear-level-warning">
                ⚠️ 极限模式包含强音效和快速闪屏，请确保你已满18岁且心理承受能力较强
            </div>
            <button class="creepy-button" style="margin-top: 30px; font-size: 20px;" onclick="confirmFearLevel()">
                确认进入黑暗世界
            </button>
        </div>
    `;

    document.body.appendChild(fearLevelContainer);

    // 绑定选项点击事件
    fearLevelContainer.querySelectorAll('.fear-level-option').forEach(option => {
        option.addEventListener('click', () => {
            fearLevelContainer.querySelectorAll('.fear-level-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            option.classList.add('selected');
            fearLevel = option.dataset.level;
        });
    });
}

function confirmFearLevel() {
    document.querySelector('.fear-level-container')?.remove();

    // 触发基于选择的成就
    checkChoiceBasedAchievements();

    // 播放通知音效
    audioManager.playSound('notification');

    showScareIntro();
}

// ====================================
// 显示惊吓开场
// ====================================
function showScareIntro() {
    scareIntro.classList.remove('hidden');

    const typingText = document.querySelector('.typing-text');
    const messages = [
        "欢迎来到暗黑世界...",
        "这里隐藏着你真实的灵魂...",
        `你选择了${getFearLevelName()}...`,
        "准备好接受万圣节的审判了吗？",
        "你的选择将揭示你的真实身份..."
    ];

    typeWriter(typingText, messages[0], () => {
        setTimeout(() => {
            typeWriter(typingText, messages[1], () => {
                setTimeout(() => {
                    typeWriter(typingText, messages[2], () => {
                        setTimeout(() => {
                            typeWriter(typingText, messages[3], () => {
                                setTimeout(() => {
                                    typeWriter(typingText, messages[4]);
                                }, 1000);
                            });
                        }, 1000);
                    });
                }, 1000);
            });
        }, 1000);
    });
}

function getFearLevelName() {
    const names = {
        mild: '温和模式',
        normal: '标准模式',
        extreme: '极限模式'
    };
    return names[fearLevel] || '标准模式';
}

// ====================================
// 打字机效果
// ====================================
function typeWriter(element, text, callback) {
    if (!element) return;
    element.style.opacity = '1';
    element.innerHTML = '';
    let i = 0;

    const type = () => {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            audioManager.playSound('typing');
            setTimeout(type, 100);
        } else if (callback) {
            setTimeout(callback, 500);
        }
    };

    type();
}

// ====================================
// 开始测试
// ====================================
function startTest() {
    audioManager.playSound('select');
    scareIntro.classList.add('hidden');

    // 随机触发惊吓
    if (fearLevel !== 'mild') {
        setTimeout(() => {
            triggerJumpscare();
        }, 500);
    }

    setTimeout(() => {
        showQuestion();
    }, 1500);
}

// ====================================
// 显示问题
// ====================================
function showQuestion() {
    return ErrorHandler.try(() => {
        if (currentQuestionIndex >= questions.length) {
            showResult();
            return;
        }

        progressContainer.classList.remove('hidden');
        questionContainer.classList.remove('hidden');

        updateProgress();
        displayQuestion();

        // 在特定题目后触发小游戏
        if (currentQuestionIndex === 4 && !hasChaseGame) {
            setTimeout(() => {
                startChaseGame();
            }, 3000);
        }
        if (currentQuestionIndex === 9 && !hasRiddleGame) {
            setTimeout(() => {
                startRiddleGame();
            }, 3000);
        }
    }, '显示问题');
}

// ====================================
// 显示当前问题
// ====================================
function displayQuestion() {
    return ErrorHandler.try(() => {
        const question = questions[currentQuestionIndex];

        document.getElementById('current-question').textContent = currentQuestionIndex + 1;
        document.getElementById('question-text').textContent = question.question;

        const answersContainer = document.getElementById('answers-container');
        answersContainer.innerHTML = '';

        question.answers.forEach((answer, index) => {
            const answerOption = document.createElement('div');
            answerOption.className = 'answer-option';
            answerOption.innerHTML = `<div class="answer-text">${answer.text}</div>`;

            answerOption.addEventListener('click', () => {
                selectAnswer(answer, answerOption);
            });

            answersContainer.appendChild(answerOption);
        });

        // 显示护身符
        updateTalismanDisplay();
    }, '显示当前问题');
}

// ====================================
// 选择答案
// ====================================
function selectAnswer(answer, element) {
    // 清除之前的选择
    document.querySelectorAll('.answer-option').forEach(opt => {
        opt.classList.remove('selected');
    });

    // 选中当前答案
    element.classList.add('selected');

    // 延迟触发微交互效果，确保系统已初始化
    setTimeout(() => {
        if (window.MicroInteractionsAPI?.triggerAnswerSelection) {
            window.MicroInteractionsAPI.triggerAnswerSelection(element);
        }
    }, 50);

    // 处理线索
    if (answer.type === 'clue') {
        collectedClues++;
        showClue();
        audioManager.playSound('talisman');
        if (collectedClues >= 3) {
            secretEnding = true;
        }
        setTimeout(() => {
            currentQuestionIndex++;
            showQuestion();
        }, 2000);
        return;
    }

    // 记录答案
    answers.push(answer.type);

    // 增加恐惧值
    if (fearLevel === 'extreme') {
        fearValue += 3;
    } else if (fearLevel === 'normal') {
        fearValue += 2;
    } else {
        fearValue += 1;
    }

    // 播放音效
    audioManager.playSound('select');

    // 创建光效
    createSparkleEffect(element);

    // 进入下一题
    setTimeout(() => {
        currentQuestionIndex++;
        showQuestion();
    }, 800);
}

// ====================================
// 显示线索
// ====================================
function showClue() {
    const clueModal = document.createElement('div');
    clueModal.className = 'talisman-modal';
    clueModal.innerHTML = `
        <h3 style="color: var(--halloween-orange); font-size: 24px; margin-bottom: 15px;">✨ 你发现了隐藏线索！</h3>
        <p class="talisman-hint">
            ${getRandomClue()}
        </p>
        <p style="text-align: center; color: var(--fog-gray); font-size: 14px;">
            已收集线索：${collectedClues} / 3
        </p>
        <button class="talisman-close" onclick="this.closest('.talisman-modal').remove()">
            继续测试
        </button>
    `;
    document.body.appendChild(clueModal);
}

function getRandomClue() {
    const clues = [
        "🎃 古老的南瓜王曾说过：'真正的恐惧来自内心...'",
        "👻 幽灵低语：'有些答案，藏在最不可能的地方...'",
        "🦇 蝙蝠传递密信：'团结就是力量，互补才能成功...'",
        "💀 骷髅暗示：'细节决定命运，注意每个选择...'",
        "🕷️ 蜘蛛编织的图案暗示：'真正的智慧在于平衡...'",
        "🌙 月亮女神启示：'内在的光芒永远比外在更亮...'",
        "🔮 水晶球显现幻象：'未来由当下的每一个决定塑造...'",
        "⚗️ 炼金术师的笔记：'金子在烈火中诞生，智慧在考验中显现...'"
    ];
    return clues[Math.floor(Math.random() * clues.length)];
}

// ====================================
// 创建闪光特效
// ====================================
function createSparkleEffect(element) {
    const rect = element.getBoundingClientRect();
    for (let i = 0; i < 10; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.innerHTML = '✨';
        sparkle.style.left = Math.random() * rect.width + 'px';
        sparkle.style.top = Math.random() * rect.height + 'px';
        sparkle.style.color = Math.random() > 0.5 ? '#ff6600' : '#6b1d9e';
        element.appendChild(sparkle);

        setTimeout(() => sparkle.remove(), 2000);
    }
}

// ====================================
// 更新进度
// ====================================
// 使用节流优化更新进度
const throttledUpdateProgress = throttle(() => {
    const progress = (currentQuestionIndex / questions.length) * 100;
    const progressFill = domCache.get('progress-fill');
    const progressText = domCache.get('progress-text');

    if (progressFill) {
        progressFill.style.width = progress + '%';
    }
    if (progressText) {
        progressText.textContent = `${currentQuestionIndex} / ${questions.length}`;
    }

    updateFearMeter();
}, 100); // 限制为每100ms最多更新一次

function updateProgress() {
    throttledUpdateProgress();
}

// ====================================
// 更新恐惧值显示
// ====================================
function updateFearMeter() {
    let fearMeter = document.querySelector('.fear-meter');
    if (!fearMeter) {
        fearMeter = document.createElement('div');
        fearMeter.className = 'fear-meter';
        document.body.appendChild(fearMeter);
    }

    if (fearLevel === 'mild') {
        fearMeter.classList.add('hidden');
        return;
    }

    fearMeter.classList.remove('hidden');
    fearMeter.innerHTML = `
        <div class="fear-meter-title">恐惧值</div>
        <div class="fear-bar">
            <div class="fear-fill" style="width: ${Math.min(fearValue, 100)}%"></div>
        </div>
        <div class="fear-value">${fearValue}</div>
        <div class="fear-labels">
            <span>冷静</span>
            <span>恐惧</span>
        </div>
    `;
}

// ====================================
// 护身符系统
// ====================================
function updateTalismanDisplay() {
    let talismanContainer = document.querySelector('.talisman-container');
    if (!talismanContainer) {
        talismanContainer = document.createElement('div');
        talismanContainer.className = 'talisman-container';
        document.body.appendChild(talismanContainer);
    }

    if (fearLevel === 'mild' || talismans <= 0) {
        talismanContainer.style.display = 'none';
        return;
    }

    talismanContainer.style.display = 'flex';
    talismanContainer.innerHTML = `
        <div class="talisman ${talismans === 0 ? 'used' : ''}" onclick="useTalisman()">
            🔮
            <div class="talisman-label">护身符 (${talismans}个)</div>
        </div>
    `;
}

function useTalisman() {
    if (talismans <= 0) return;

    talismans--;
    updateTalismanDisplay();

    const talismanModal = document.createElement('div');
    talismanModal.className = 'talisman-modal';
    talismanModal.innerHTML = `
        <h3 style="color: var(--halloween-orange); font-size: 24px; margin-bottom: 15px;">🔮 护身符启示</h3>
        <p class="talisman-hint">
            ${getRandomHint()}
        </p>
        <button class="talisman-close" onclick="this.closest('.talisman-modal').remove()">
            感谢指引
        </button>
    `;
    document.body.appendChild(talismanModal);

    audioManager.playSound('talisman');
}

function getRandomHint() {
    const hints = [
        "💡 提示：仔细观察每个选项，它们可能暗示你的内在倾向",
        "💡 提示：不要过分思考，相信你的第一直觉",
        "💡 提示：每种性格都有其独特价值，没有对错之分",
        "💡 提示：内向和外向都同样重要，关键是找到平衡",
        "💡 提示：直觉型思维者和感觉型思维者各有优势",
        "💡 提示：理性与感性并用，才能做出最佳判断",
        "💡 提示：灵活应变和按计划执行都是好策略",
        "💡 提示：探索隐藏的线索，可能会发现特殊结局！"
    ];
    return hints[Math.floor(Math.random() * hints.length)];
}

// ====================================
// 触发惊吓特效
// ====================================
function triggerJumpscare() {
    jumpscare.classList.remove('hidden');
    audioManager.playSound('jumpscare');

    // 添加震动效果
    document.body.style.animation = 'shake 0.5s';
    setTimeout(() => {
        document.body.style.animation = '';
    }, 500);

    setTimeout(() => {
        jumpscare.classList.add('hidden');
    }, 1000);
}

// ====================================
// 幽魂追逐小游戏
// ====================================
function startChaseGame() {
    hasChaseGame = true;

    const chaseGame = document.createElement('div');
    chaseGame.className = 'chase-game active';
    chaseGame.innerHTML = `
        <div class="chase-scene">
            <div class="chase-instructions">← 左右滑动或按方向键躲避幽魂 →</div>
            <div class="chase-timer">15</div>
            <div class="chase-player">🧍</div>
            <div class="chase-ghost">👻</div>
            <div class="chase-success hidden">
                <div class="success-title">🎃 逃脱成功！</div>
                <div class="success-text">你获得了勇气之符！</div>
            </div>
        </div>
    `;
    document.body.appendChild(chaseGame);

    // 游戏逻辑
    let playerX = 20;
    const keys = { left: false, right: false };
    let timer = 15;

    const movePlayer = () => {
        if (keys.left) playerX -= 2;
        if (keys.right) playerX += 2;
        playerX = Math.max(5, Math.min(75, playerX));

        const player = chaseGame.querySelector('.chase-player');
        if (player) {
            player.style.left = playerX + '%';
        }

        // 检查碰撞
        const ghost = chaseGame.querySelector('.chase-ghost');
        if (player && ghost) {
            const playerRect = player.getBoundingClientRect();
            const ghostRect = ghost.getBoundingClientRect();

            if (Math.abs(playerRect.left - ghostRect.left) < 50) {
                fearValue += 5;
            }
        }
    };

    // 键盘控制处理函数
    const handleKeyDown = (e) => {
        if (e.key === 'ArrowLeft') keys.left = true;
        if (e.key === 'ArrowRight') keys.right = true;
    };

    const handleKeyUp = (e) => {
        if (e.key === 'ArrowLeft') keys.left = false;
        if (e.key === 'ArrowRight') keys.right = false;
    };

    // 触摸控制处理函数
    let touchStartX = 0;
    const touchStartHandler = (e) => {
        touchStartX = e.touches[0].clientX;
    };

    const touchMoveHandler = (e) => {
        if (!touchStartX) return;
        const touchX = e.touches[0].clientX;
        const diff = touchStartX - touchX;
        if (diff > 50) keys.left = true;
        if (diff < -50) keys.right = true;

        const timerId = ResourceManager.addTimer(setTimeout(() => {
            keys.left = false;
            keys.right = false;
            ResourceManager.clearTimer(timerId);
        }, 300));
    };

    // 使用ResourceManager注册事件监听器
    ResourceManager.addListener(document, 'keydown', handleKeyDown);
    ResourceManager.addListener(document, 'keyup', handleKeyUp);
    ResourceManager.addListener(chaseGame, 'touchstart', touchStartHandler);
    ResourceManager.addListener(chaseGame, 'touchmove', touchMoveHandler);

    // 游戏清理函数
    const cleanup = () => {
        ResourceManager.clearInterval(countdownIntervalId);
        ResourceManager.clearInterval(moveIntervalId);

        // 移除事件监听器
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
        chaseGame.removeEventListener('touchstart', touchStartHandler);
        chaseGame.removeEventListener('touchmove', touchMoveHandler);
    };

    // 倒计时 - 使用ResourceManager管理
    const countdownIntervalId = ResourceManager.addInterval(setInterval(() => {
        timer--;
        const timerElement = chaseGame.querySelector('.chase-timer');
        if (timerElement) {
            timerElement.textContent = timer;
        }

        if (timer <= 0) {
            cleanup();

            // 显示成功
            audioManager.playSound('chase-success');
            const success = chaseGame.querySelector('.chase-success');
            if (success) {
                success.classList.remove('hidden');
            }
            talismans++;

            // 触发游戏成就
            unlockAchievement('ghostDancer');
            sessionStats.gamesPlayed++;

            const removeTimerId = ResourceManager.addTimer(setTimeout(() => {
                chaseGame.remove();
                updateTalismanDisplay();
                ResourceManager.clearTimer(removeTimerId);
            }, 3000));
        }
    }, 1000));

    // 移动interval - 使用ResourceManager管理
    const moveIntervalId = ResourceManager.addInterval(setInterval(movePlayer, 50));
}

// ====================================
// 诡锁破译小游戏
// ====================================
function startRiddleGame() {
    hasRiddleGame = true;

    const riddleGame = document.createElement('div');
    riddleGame.className = 'riddle-game active';
    riddleGame.innerHTML = `
        <div class="riddle-altar">
            <div class="riddle-title">🔮 符号谜题</div>
            <p style="color: var(--fog-gray); margin-bottom: 20px;">
                在祭坛上选择与上方图案匹配的符号（限时20秒）
            </p>
            <div class="riddle-symbols">
                ${generateSymbolGrid()}
            </div>
            <div class="riddle-timer">20</div>
            <div class="riddle-success hidden">
                <div style="font-size: 32px; color: var(--magic-blue); margin-bottom: 15px;">✨ 解锁成功！</div>
                <div style="color: var(--ghost-white); margin-bottom: 20px;">你打开了隐藏房间，获得神秘线索！</div>
            </div>
        </div>
    `;
    document.body.appendChild(riddleGame);

    // 随机生成目标图案
    const symbols = ['🔮', '⚗️', '💎', '🔥', '❄️', '🌟', '🌙', '☠️', '🦇'];
    const targetSymbol = symbols[Math.floor(Math.random() * symbols.length)];
    const targetIndices = [];

    // 创建3x3网格，每个位置随机放置符号
    let gridSymbols = [];
    for (let i = 0; i < 9; i++) {
        gridSymbols.push(symbols[Math.floor(Math.random() * symbols.length)]);
    }
    // 确保至少有一个目标符号
    const randomIndex = Math.floor(Math.random() * 9);
    gridSymbols[randomIndex] = targetSymbol;
    targetIndices.push(randomIndex);

    const symbolGrids = riddleGame.querySelectorAll('.symbol-grid');
    symbolGrids.forEach((grid, index) => {
        grid.textContent = gridSymbols[index];
    });

    // 游戏逻辑
    let selectedCount = 0;
    let timer = 20;

    const countdown = setInterval(() => {
        timer--;
        riddleGame.querySelector('.riddle-timer').textContent = timer;

        if (timer <= 0) {
            clearInterval(countdown);
            riddleGame.remove();
        }
    }, 1000);

    symbolGrids.forEach((grid, index) => {
        grid.addEventListener('click', () => {
            if (gridSymbols[index] === targetSymbol && !grid.classList.contains('matched')) {
                grid.classList.add('matched');
                selectedCount++;

                if (selectedCount >= 3) {
                    clearInterval(countdown);
                    audioManager.playSound('riddle-success');

                    // 显示成功
                    const success = riddleGame.querySelector('.riddle-success');
                    success.classList.remove('hidden');
                    collectedClues++;

                    // 触发游戏成就
                    unlockAchievement('riddleSword');
                    sessionStats.gamesPlayed++;
                    sessionStats.cluesFound++;

                    setTimeout(() => {
                        riddleGame.remove();
                        if (collectedClues >= 3) {
                            secretEnding = true;
                        }
                    }, 3000);
                }
            } else {
                grid.classList.add('selected');
                setTimeout(() => {
                    grid.classList.remove('selected');
                }, 300);
                fearValue += 2;
            }
        });
    });
}

function generateSymbolGrid() {
    return Array(9).fill(0).map(() => '<div class="symbol-grid"></div>').join('');
}

// ====================================
// 显示结果
// ====================================
function showResult() {
    questionContainer.classList.add('hidden');
    transitionOverlay.classList.remove('hidden');

    setTimeout(() => {
        transitionOverlay.classList.add('hidden');
        calculateResult();
    }, 3000);
}

// ====================================
// 计算结果
// ====================================
function calculateResult() {
    const scores = {
        E: 0, I: 0,
        S: 0, N: 0,
        T: 0, F: 0,
        J: 0, P: 0
    };

    answers.forEach(type => {
        scores[type]++;
    });

    const personalityType =
        (scores.E > scores.I ? 'E' : 'I') +
        (scores.S > scores.N ? 'S' : 'N') +
        (scores.T > scores.F ? 'T' : 'F') +
        (scores.J > scores.P ? 'J' : 'P');

    // 特殊结局检查
    if (secretEnding) {
        showSecretEnding(personalityType);
    } else {
        displayResult(personalityType);
    }
}

// ====================================
// 显示特殊结局
// ====================================
function showSecretEnding(type) {
    audioManager.playSound('secret-reveal');

    const secretEnding = document.createElement('div');
    secretEnding.className = 'secret-ending active';
    secretEnding.innerHTML = `
        <div class="secret-content">
            <div class="secret-title">🎃 神秘王者 🎃</div>
            <div class="secret-text">
                恭喜！你收集了所有隐藏线索，解锁了神秘王者结局！<br>
                你的${type}人格加上你的探索精神，让你成为了万圣节世界的真正主人！
                <br><br>
                <strong>特殊奖励：获得"探索者"称号 + 神秘壁纸</strong>
            </div>
            <button class="secret-gift" onclick="downloadWallpaper()">
                🎁 领取专属壁纸
            </button>
            <button class="secret-gift" style="margin-left: 15px;" onclick="showRegularResult('${type}')">
                查看完整结果
            </button>
        </div>
    `;
    document.body.appendChild(secretEnding);
}

function showRegularResult(type) {
    document.querySelector('.secret-ending')?.remove();
    displayResult(type);
}

function downloadWallpaper() {
    // 创建一个简单的壁纸下载
    alert('🎨 专属壁纸已准备就绪！\n\n在实际项目中，这里会下载一张高清万圣节主题壁纸。\n包含你的MBTI类型和专属称号！');
}

// ====================================
// 显示结果页面
// ====================================
function displayResult(type) {
    const personality = personalityTypes[type];

    document.getElementById('personality-type').querySelector('.type-badge').textContent = type;
    document.getElementById('type-name').textContent = personality.name;

    const description = document.getElementById('personality-description');
    description.innerHTML = `<p>${personality.description}</p>`;

    const traitsList = document.getElementById('traits-list');
    traitsList.innerHTML = '';
    personality.traits.forEach(trait => {
        const li = document.createElement('li');
        li.textContent = trait;
        traitsList.appendChild(li);
    });

    document.getElementById('compatibility-text').textContent = personality.compatibility;

    resultContainer.classList.remove('hidden');

    // 触发基于结果的成就
    checkResultBasedAchievements(type);

    // 触发终极成就检查
    if (unlockedAchievements.length === Object.keys(achievements).length - 1) {
        unlockAchievement('halloweenLegend');
    }

    // 创建庆祝特效
    createCelebrationEffect();

    // 播放终场音效
    audioManager.playSound('finale');
}

// ====================================
// 创建庆祝特效
// ====================================
function createCelebrationEffect() {
    const emojis = ['🎃', '👻', '🦇', '💀', '🕷️'];

    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const emoji = document.createElement('div');
            emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            emoji.style.position = 'fixed';
            emoji.style.fontSize = Math.random() * 30 + 20 + 'px';
            emoji.style.left = Math.random() * window.innerWidth + 'px';
            emoji.style.top = '-50px';
            emoji.style.pointerEvents = 'none';
            emoji.style.zIndex = '10000';
            emoji.style.transition = 'all 2s ease-out';

            document.body.appendChild(emoji);

            setTimeout(() => {
                emoji.style.top = window.innerHeight + 'px';
                emoji.style.transform = `rotate(${Math.random() * 360}deg)`;
                emoji.style.opacity = '0';
            }, 100);

            setTimeout(() => emoji.remove(), 2100);
        }, i * 50);
    }
}

// ====================================
// 分享海报
// ====================================
function openSharePoster() {
    const type = document.getElementById('personality-type').querySelector('.type-badge').textContent;
    const name = document.getElementById('type-name').textContent;
    const personality = personalityTypes[type];

    const sharePoster = document.createElement('div');
    sharePoster.className = 'share-poster active';
    sharePoster.innerHTML = `
        <button class="poster-close" onclick="this.closest('.share-poster').remove()">×</button>
        <div class="poster-header">
            <div class="poster-title">万圣夜惊魂</div>
            <div class="poster-subtitle">MBTI 人格测试</div>
        </div>
        <div class="poster-body">
            <div class="poster-type">${type}</div>
            <div class="poster-name">${name}</div>
            <div class="poster-description">
                ${personality.description.substring(0, 100)}...
            </div>
            <div class="poster-stats">
                <div class="stat-item">
                    <div class="stat-label">恐惧值</div>
                    <div class="stat-value">${fearValue}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">线索收集</div>
                    <div class="stat-value">${collectedClues}/3</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">护身符</div>
                    <div class="stat-value">${talismans}</div>
                </div>
            </div>
        </div>
        <div class="poster-actions">
            <button class="poster-btn primary" onclick="shareResult('${type}', '${name}')">
                📤 立即分享
            </button>
            <button class="poster-btn" onclick="downloadPoster()">
                💾 保存图片
            </button>
        </div>
    `;
    document.body.appendChild(sharePoster);
}

function shareResult(type, name) {
    const text = `我在万圣节MBTI测试中是 ${type} - ${name}！`;

    if (navigator.share) {
        navigator.share({
            title: '万圣节MBTI测试结果',
            text: text,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(text + ' ' + window.location.href).then(() => {
            alert('结果已复制到剪贴板！快去分享给朋友们吧！');
        });
    }
}

function downloadPoster() {
    alert('🎨 海报保存功能\n\n在实际项目中，这里会生成并下载一张精美的分享海报。\n包含你的测试结果、头像和二维码！');
}

// ====================================
// 重新开始测试
// ====================================
function restartTest() {
    currentQuestionIndex = 0;
    answers = [];
    fearValue = 0;
    talismans = 3;
    collectedClues = 0;
    hasChaseGame = false;
    hasRiddleGame = false;
    secretEnding = false;

    resultContainer.classList.add('hidden');
    showFearLevelSelector();
}

// ====================================
// 切换音效
// ====================================
function toggleSound() {
    const enabled = audioManager.toggle();
    const toggleButton = soundToggleElement || domCache.get('sound-toggle');

    if (toggleButton) {
        toggleButton.textContent = enabled ? '🔊' : '🔇';
        toggleButton.style.color = enabled ? '#ff6600' : '#666';
    }

    sessionStats.soundToggleCount++;
}

// ====================================
// 成就系统
// ====================================

// 解锁成就
function unlockAchievement(achievementKey) {
    if (achievements[achievementKey] && !achievements[achievementKey].unlocked) {
        achievements[achievementKey].unlocked = true;
        unlockedAchievements.push(achievementKey);
        audioManager.playSound('achievement');
        showAchievementNotification(achievements[achievementKey]);
        checkSpecialAchievements();
    }
}

// 显示成就通知
function showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, var(--halloween-orange), var(--blood-red));
        color: white;
        padding: 20px 30px;
        border-radius: 15px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        z-index: 10004;
        animation: slideInRight 0.5s ease, slideOutRight 0.5s ease 2.5s forwards;
        border: 3px solid gold;
        max-width: 300px;
    `;

    notification.innerHTML = `
        <div style="font-size: 32px; text-align: center; margin-bottom: 10px;">${achievement.icon}</div>
        <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">成就解锁！</div>
        <div style="font-size: 16px; margin-bottom: 5px;">${achievement.name}</div>
        <div style="font-size: 14px; opacity: 0.9;">${achievement.desc}</div>
    `;

    document.body.appendChild(notification);

    // 添加动画CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
        notification.remove();
        style.remove();
    }, 3000);
}

// 检查特殊成就
function checkSpecialAchievements() {
    // 检查是否解锁所有成就
    const allAchievements = Object.keys(achievements);
    const unlockedCount = allAchievements.filter(key => achievements[key].unlocked).length;

    if (unlockedCount === allAchievements.length && !achievements.halloweenLegend.unlocked) {
        unlockAchievement('halloweenLegend');
    }
}

// 检查基于结果的成就
function checkResultBasedAchievements(personalityType) {
    const hiddenTypes = {
        'INTJ': 'darkLord',
        'INTP': 'insaneScientist',
        'ENFP': 'jester'
    };

    if (hiddenTypes[personalityType]) {
        unlockAchievement(hiddenTypes[personalityType]);
    }

    if (fearValue >= 50) {
        unlockAchievement('Fearless');
    }

    if (talismans >= 3) {
        unlockAchievement('collector');
    }

    if (hasChaseGame && hasRiddleGame) {
        unlockAchievement('gameMaster');
    }
}

// 检查基于选择的成就
function checkChoiceBasedAchievements() {
    if (fearLevel === 'extreme') {
        unlockAchievement('braveSoul');
    }
    if (fearLevel === 'mild') {
        unlockAchievement('gentleHeart');
    }
}

// 显示成就列表
function showAchievementsList() {
    const modal = document.createElement('div');
    modal.className = 'achievements-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        z-index: 10005;
        display: flex;
        justify-content: center;
        align-items: center;
        backdrop-filter: blur(10px);
    `;

    const unlockedCount = unlockedAchievements.length;
    const totalCount = Object.keys(achievements).length;

    modal.innerHTML = `
        <div style="
            background: rgba(26, 26, 26, 0.98);
            border-radius: 25px;
            padding: 40px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            border: 3px solid var(--halloween-orange);
            box-shadow: 0 15px 60px rgba(255, 102, 0, 0.4);
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                <h2 style="color: var(--halloween-orange); font-size: 36px; margin: 0;">🏆 成就列表</h2>
                <button onclick="this.closest('.achievements-modal').remove()" style="
                    background: none;
                    border: none;
                    color: var(--fog-gray);
                    font-size: 30px;
                    cursor: pointer;
                ">×</button>
            </div>
            <div style="
                background: rgba(0, 0, 0, 0.5);
                padding: 15px;
                border-radius: 10px;
                margin-bottom: 20px;
                text-align: center;
            ">
                <span style="color: var(--halloween-orange); font-size: 24px; font-weight: bold;">
                    ${unlockedCount} / ${totalCount}
                </span>
                <span style="color: var(--fog-gray); margin-left: 10px;">已解锁</span>
            </div>
            <div id="achievements-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px;">
                ${Object.entries(achievements).map(([key, achievement]) => `
                    <div style="
                        background: ${achievement.unlocked ?
                            'linear-gradient(135deg, rgba(248, 165, 28, 0.3), rgba(242, 92, 92, 0.3))' :
                            'rgba(0, 0, 0, 0.3)'};
                        border: 2px solid ${achievement.unlocked ? 'var(--halloween-orange)' : 'var(--dark-gray)'};
                        border-radius: 12px;
                        padding: 20px;
                        opacity: ${achievement.unlocked ? 1 : 0.5};
                        transition: all 0.3s ease;
                    ">
                        <div style="font-size: 48px; text-align: center; margin-bottom: 10px; ${!achievement.unlocked ? 'filter: grayscale(100%);' : ''}">
                            ${achievement.icon}
                        </div>
                        <div style="font-size: 18px; font-weight: bold; color: ${achievement.unlocked ? 'var(--ghost-white)' : 'var(--fog-gray)'}; margin-bottom: 8px;">
                            ${achievement.unlocked ? achievement.name : '???'}
                        </div>
                        <div style="font-size: 14px; color: ${achievement.unlocked ? 'var(--fog-gray)' : 'var(--dark-gray)'};">
                            ${achievement.unlocked ? achievement.desc : '未解锁'}
                        </div>
                        ${achievement.unlocked ? '<div style="margin-top: 10px; color: var(--halloween-orange); font-size: 12px;">✓ 已解锁</div>' : ''}
                    </div>
                `).join('')}
            </div>
            <div style="margin-top: 30px; text-align: center;">
                <button onclick="
                    this.closest('.achievements-modal').remove();
                    audioManager.playSound('page-turn');
                " style="
                    background: linear-gradient(135deg, var(--halloween-orange), var(--blood-red));
                    color: white;
                    border: none;
                    padding: 15px 40px;
                    font-size: 18px;
                    border-radius: 25px;
                    cursor: pointer;
                    box-shadow: 0 5px 20px rgba(255, 102, 0, 0.4);
                    transition: all 0.3s ease;
                " onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 30px rgba(255, 102, 0, 0.6)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 5px 20px rgba(255, 102, 0, 0.4)'">
                    关闭
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// ====================================
// 数据统计系统
// ====================================
let sessionStats = {
    questionTime: [], // 每题用时
    hesitationCount: 0, // 犹豫次数
    talismansUsed: 0, // 使用护身符次数
    gamesPlayed: 0, // 玩游戏次数
    cluesFound: 0, // 找到线索数
    pagesViewed: 0, // 浏览页面数
    hoverCount: 0, // 悬停次数
    soundToggleCount: 0 // 音效开关次数
};

// 记录题目用时
let questionStartTime = Date.now();
function recordQuestionTime() {
    const timeSpent = Date.now() - questionStartTime;
    sessionStats.questionTime.push(timeSpent);
    questionStartTime = Date.now();

    // 检查速度之王成就
    if (timeSpent < 5000) {
        unlockAchievement('speedRunner');
    }
}

// 记录犹豫
function recordHesitation() {
    sessionStats.hesitationCount++;
    // 如果连续犹豫10次，检查完美主义者成就
    if (sessionStats.hesitationCount >= 10) {
        unlockAchievement('perfectClimber');
    }
}

// 显示详细统计
function showDetailedStats() {
    const avgTime = sessionStats.questionTime.length > 0
        ? (sessionStats.questionTime.reduce((a, b) => a + b, 0) / sessionStats.questionTime.length / 1000).toFixed(1)
        : 0;

    const stats = `
📊 本次测试详细统计：

⏱️ 平均每题用时: ${avgTime}秒
🤔 犹豫次数: ${sessionStats.hesitationCount}
🔮 使用护身符: ${sessionStats.talismansUsed}次
🎮 完小游戏: ${sessionStats.gamesPlayed}个
🔍 发现线索: ${sessionStats.cluesFound}个
📄 浏览页面: ${sessionStats.pagesViewed}页
🖱️ 悬停交互: ${sessionStats.hoverCount}次
🔊 音效开关: ${sessionStats.soundToggleCount}次

${unlockedAchievements.length > 0 ? '🏆 解锁成就: ' + unlockedAchievements.length + '个' : ''}
    `;

    alert(stats);
}

// ====================================
// 添加CSS动画类
// ====================================
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);

// ====================================
// 管理面板FAB按钮交互
// ====================================
window.addEventListener('DOMContentLoaded', () => {
    const fabBtn = document.getElementById('admin-fab-toggle');
    const fabMenu = document.getElementById('admin-fab-menu');

    if (fabBtn && fabMenu) {
        fabBtn.addEventListener('click', () => {
            fabBtn.classList.toggle('active');
            fabMenu.classList.toggle('active');
            audioManager.playSound('hover');
        });

        // 点击外部关闭菜单
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.admin-panel-fab')) {
                fabBtn.classList.remove('active');
                fabMenu.classList.remove('active');
            }
        });
    }
});
