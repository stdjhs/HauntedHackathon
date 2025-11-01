/* ====================================
   沉浸式背景效果系统
   版本: v4.0.0
   目标: 创建沉浸式动态背景效果
   特性: 动态星空、极光、浮云、流星等效果
   ==================================== */

// ====================================
// 动态星空系统
// ====================================
class StarfieldBackground {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.stars = [];
        this.animationId = null;
        this.isActive = true;
        this.init();
    }

    init() {
        this.createCanvas();
        this.createStars();
        this.animate();
        this.bindEvents();
    }

    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'starfield-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -3;
        `;
        document.body.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');
        this.resize();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.createStars();
    }

    createStars() {
        this.stars = [];
        const starCount = Math.floor((this.canvas.width * this.canvas.height) / 8000);

        for (let i = 0; i < starCount; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.8 + 0.2,
                twinkleSpeed: Math.random() * 0.02 + 0.01,
                twinkleOffset: Math.random() * Math.PI * 2,
                color: this.getRandomStarColor()
            });
        }
    }

    getRandomStarColor() {
        const colors = [
            'rgba(255, 255, 255, 0.9)',
            'rgba(248, 165, 28, 0.8)',
            'rgba(107, 29, 158, 0.8)',
            'rgba(82, 89, 255, 0.8)',
            'rgba(242, 92, 92, 0.8)',
            'rgba(255, 255, 200, 0.9)'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    animate() {
        if (!this.isActive) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.stars.forEach(star => {
            // 闪烁效果
            star.twinkleOffset += star.twinkleSpeed;
            const twinkle = Math.sin(star.twinkleOffset) * 0.3 + 0.7;
            const opacity = star.opacity * twinkle;

            // 绘制星星
            this.ctx.save();
            this.ctx.globalAlpha = opacity;
            this.ctx.fillStyle = star.color;

            // 绘制光芒
            if (star.size > 1.5) {
                const gradient = this.ctx.createRadialGradient(
                    star.x, star.y, 0,
                    star.x, star.y, star.size * 3
                );
                gradient.addColorStop(0, star.color);
                gradient.addColorStop(1, 'transparent');
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
                this.ctx.fill();
            }

            // 绘制核心
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();
        });

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());
    }

    destroy() {
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.canvas.remove();
    }

    // 流星效果
    createMeteor() {
        const meteor = {
            x: Math.random() * this.canvas.width,
            y: -50,
            speedX: 2 + Math.random() * 3,
            speedY: 5 + Math.random() * 5,
            size: Math.random() * 3 + 1,
            trail: []
        };

        const animateMeteor = () => {
            // 添加轨迹
            meteor.trail.push({ x: meteor.x, y: meteor.y, opacity: 1 });
            if (meteor.trail.length > 10) {
                meteor.trail.shift();
            }

            // 更新位置
            meteor.x += meteor.speedX;
            meteor.y += meteor.speedY;

            // 绘制轨迹
            meteor.trail.forEach((point, index) => {
                const opacity = point.opacity * (index / meteor.trail.length);
                this.ctx.save();
                this.ctx.globalAlpha = opacity;
                this.ctx.fillStyle = 'rgba(248, 165, 28, 0.6)';
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, meteor.size * (index / meteor.trail.length), 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();

                point.opacity -= 0.05;
            });

            // 绘制流星
            this.ctx.save();
            this.ctx.globalAlpha = 1;
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.beginPath();
            this.ctx.arc(meteor.x, meteor.y, meteor.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();

            if (meteor.y < this.canvas.height + 50 && meteor.x < this.canvas.width + 50) {
                requestAnimationFrame(animateMeteor);
            }
        };

        animateMeteor();
    }
}

// ====================================
// 极光效果
// ====================================
class AuroraBackground {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.layers = [];
        this.isActive = true;
        this.init();
    }

    init() {
        this.createCanvas();
        this.createAuroraLayers();
        this.animate();
        this.bindEvents();
    }

    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'aurora-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -2;
            mix-blend-mode: screen;
        `;
        document.body.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');
        this.resize();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createAuroraLayers() {
        this.layers = [];

        // 创建多层极光
        for (let i = 0; i < 5; i++) {
            this.layers.push({
                offset: Math.random() * 1000,
                amplitude: 50 + Math.random() * 100,
                frequency: 0.001 + Math.random() * 0.002,
                speed: 0.2 + Math.random() * 0.5,
                color: this.getAuroraColor(i),
                yPosition: this.canvas.height * (0.3 + i * 0.1),
                opacity: 0.3 + Math.random() * 0.4
            });
        }
    }

    getAuroraColor(index) {
        const colors = [
            'rgba(107, 29, 158, 0.8)',   // 紫色
            'rgba(82, 89, 255, 0.8)',    // 蓝色
            'rgba(248, 165, 28, 0.8)',   // 橙色
            'rgba(242, 92, 92, 0.8)',    // 红色
            'rgba(255, 153, 0, 0.8)'     // 南瓜色
        ];
        return colors[index % colors.length];
    }

    animate() {
        if (!this.isActive) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.layers.forEach((layer, index) => {
            this.drawAuroraLayer(layer, index);
        });

        requestAnimationFrame(() => this.animate());
    }

    drawAuroraLayer(layer, index) {
        this.ctx.save();
        this.ctx.globalAlpha = layer.opacity;

        // 创建渐变
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, 0);
        gradient.addColorStop(0, layer.color);
        gradient.addColorStop(0.5, layer.color.replace('0.8', '1'));
        gradient.addColorStop(1, layer.color);

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();

        this.ctx.moveTo(0, layer.yPosition);

        // 绘制波浪
        for (let x = 0; x <= this.canvas.width; x += 10) {
            const y = layer.yPosition +
                Math.sin(x * layer.frequency + layer.offset) * layer.amplitude +
                Math.cos(x * layer.frequency * 0.5 + layer.offset * 1.5) * layer.amplitude * 0.3;

            this.ctx.lineTo(x, y);
        }

        this.ctx.lineTo(this.canvas.width, this.canvas.height);
        this.ctx.lineTo(0, this.canvas.height);
        this.ctx.closePath();
        this.ctx.fill();

        // 添加发光效果
        this.ctx.shadowBlur = 50;
        this.ctx.shadowColor = layer.color;
        this.ctx.fill();

        this.ctx.restore();

        // 更新偏移
        layer.offset += layer.speed;
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());
    }

    destroy() {
        this.isActive = false;
        this.canvas.remove();
    }
}

// ====================================
// 浮云效果
// ====================================
class CloudBackground {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.clouds = [];
        this.isActive = true;
        this.init();
    }

    init() {
        this.createCanvas();
        this.createClouds();
        this.animate();
        this.bindEvents();
    }

    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'cloud-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
            opacity: 0.4;
        `;
        document.body.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');
        this.resize();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.createClouds();
    }

    createClouds() {
        this.clouds = [];
        const cloudCount = Math.floor(this.canvas.width / 200);

        for (let i = 0; i < cloudCount; i++) {
            this.clouds.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height * 0.6,
                size: 50 + Math.random() * 100,
                speed: 0.2 + Math.random() * 0.5,
                opacity: 0.1 + Math.random() * 0.2,
                puffCount: 5 + Math.floor(Math.random() * 5)
            });
        }
    }

    animate() {
        if (!this.isActive) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.clouds.forEach(cloud => {
            this.drawCloud(cloud);

            // 更新位置
            cloud.x += cloud.speed;
            if (cloud.x - cloud.size > this.canvas.width) {
                cloud.x = -cloud.size;
                cloud.y = Math.random() * this.canvas.height * 0.6;
            }
        });

        requestAnimationFrame(() => this.animate());
    }

    drawCloud(cloud) {
        this.ctx.save();
        this.ctx.globalAlpha = cloud.opacity;

        // 绘制多个圆形组成云朵
        for (let i = 0; i < cloud.puffCount; i++) {
            const puffX = cloud.x + (i * cloud.size / cloud.puffCount) - cloud.size / 2;
            const puffY = cloud.y + Math.sin(i) * 10;
            const puffSize = cloud.size * (0.5 + Math.sin(i) * 0.2);

            const gradient = this.ctx.createRadialGradient(
                puffX, puffY, 0,
                puffX, puffY, puffSize
            );
            gradient.addColorStop(0, 'rgba(176, 179, 193, 0.8)');
            gradient.addColorStop(1, 'rgba(176, 179, 193, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(puffX, puffY, puffSize, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());
    }

    destroy() {
        this.isActive = false;
        this.canvas.remove();
    }
}

// ====================================
// 月亮效果
// ====================================
class MoonBackground {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.moon = null;
        this.isActive = true;
        this.init();
    }

    init() {
        this.createCanvas();
        this.createMoon();
        this.animate();
        this.bindEvents();
    }

    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'moon-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -2;
        `;
        document.body.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');
        this.resize();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.createMoon();
    }

    createMoon() {
        this.moon = {
            x: this.canvas.width * 0.85,
            y: this.canvas.height * 0.2,
            size: 80 + Math.random() * 40,
            glowPhase: 0,
            glowSpeed: 0.02
        };
    }

    animate() {
        if (!this.isActive) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawMoon();

        requestAnimationFrame(() => this.animate());
    }

    drawMoon() {
        const { x, y, size } = this.moon;

        // 绘制月亮发光
        this.ctx.save();
        const glowGradient = this.ctx.createRadialGradient(x, y, 0, x, y, size * 2);
        glowGradient.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
        glowGradient.addColorStop(0.5, 'rgba(255, 255, 200, 0.1)');
        glowGradient.addColorStop(1, 'rgba(255, 255, 200, 0)');

        this.ctx.fillStyle = glowGradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();

        // 绘制月亮主体
        this.ctx.save();
        const moonGradient = this.ctx.createRadialGradient(x, y, 0, x, y, size);
        moonGradient.addColorStop(0, 'rgba(255, 255, 230, 1)');
        moonGradient.addColorStop(1, 'rgba(200, 200, 180, 0.8)');

        this.ctx.fillStyle = moonGradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();

        // 添加月亮表面纹理
        this.ctx.fillStyle = 'rgba(180, 180, 160, 0.3)';
        for (let i = 0; i < 5; i++) {
            const craterX = x + (Math.random() - 0.5) * size * 0.8;
            const craterY = y + (Math.random() - 0.5) * size * 0.8;
            const craterSize = Math.random() * size * 0.1;

            this.ctx.beginPath();
            this.ctx.arc(craterX, craterY, craterSize, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // 添加脉动效果
        this.moon.glowPhase += this.moon.glowSpeed;
        const pulse = Math.sin(this.moon.glowPhase) * 0.05 + 1;
        this.ctx.scale(pulse, pulse);

        this.ctx.restore();
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());
    }

    destroy() {
        this.isActive = false;
        this.canvas.remove();
    }
}

// ====================================
// 环境光效
// ====================================
class AmbientLightEffect {
    constructor() {
        this.lights = [];
        this.init();
    }

    init() {
        this.createLights();
        this.animate();
    }

    createLights() {
        this.lights = [
            {
                x: 100,
                y: 100,
                color: 'rgba(248, 165, 28, 0.3)',
                size: 200,
                speed: 0.5,
                direction: Math.random() * Math.PI * 2
            },
            {
                x: window.innerWidth - 100,
                y: 200,
                color: 'rgba(107, 29, 158, 0.3)',
                size: 250,
                speed: 0.3,
                direction: Math.random() * Math.PI * 2
            },
            {
                x: window.innerWidth / 2,
                y: window.innerHeight - 100,
                color: 'rgba(82, 89, 255, 0.2)',
                size: 300,
                speed: 0.4,
                direction: Math.random() * Math.PI * 2
            }
        ];
    }

    animate() {
        this.lights.forEach(light => {
            // 移动光源
            light.x += Math.cos(light.direction) * light.speed;
            light.y += Math.sin(light.direction) * light.speed;

            // 边界反弹
            if (light.x < 0 || light.x > window.innerWidth) {
                light.direction = Math.PI - light.direction;
            }
            if (light.y < 0 || light.y > window.innerHeight) {
                light.direction = -light.direction;
            }

            // 绘制光源
            this.drawLight(light);
        });

        requestAnimationFrame(() => this.animate());
    }

    drawLight(light) {
        const gradient = document.createElement('div');
        gradient.style.cssText = `
            position: fixed;
            left: ${light.x - light.size / 2}px;
            top: ${light.y - light.size / 2}px;
            width: ${light.size}px;
            height: ${light.size}px;
            border-radius: 50%;
            background: ${light.color};
            pointer-events: none;
            z-index: -1;
            animation: ambientLight 4s ease-in-out infinite;
        `;
        gradient.style.filter = 'blur(40px)';

        // 使用CSS动画
        const style = document.createElement('style');
        if (!document.querySelector('#ambient-light-style')) {
            style.id = 'ambient-light-style';
            style.textContent = `
                @keyframes ambientLight {
                    0%, 100% { transform: scale(1); opacity: 0.6; }
                    50% { transform: scale(1.2); opacity: 0.8; }
                }
            `;
            document.head.appendChild(style);
        }

        // 只在不存在时添加
        if (!document.querySelector(`[data-light-id="${light.x}-${light.y}"]`)) {
            gradient.setAttribute('data-light-id', `${light.x}-${light.y}`);
            document.body.appendChild(gradient);

            // 3秒后移除
            setTimeout(() => {
                gradient.remove();
            }, 3000);
        }
    }
}

// ====================================
// 背景效果控制器
// ====================================
class BackgroundEffectController {
    constructor() {
        this.effects = {
            starfield: null,
            aurora: null,
            clouds: null,
            moon: null,
            ambientLight: null
        };
        this.activeEffects = new Set();
        this.init();
    }

    init() {
        // 根据设备性能启用效果
        this.enableRecommendedEffects();

        // 监听性能变化
        window.addEventListener('qualityChange', (e) => {
            this.adjustEffects(e.detail.level);
        });
    }

    enableRecommendedEffects() {
        const level = window.DynamicQualityController?.getCurrentLevel() || 'medium';

        switch (level) {
            case 'ultra':
            case 'high':
                this.enableAllEffects();
                break;
            case 'medium':
                this.enableSomeEffects();
                break;
            case 'low':
                this.enableMinimalEffects();
                break;
        }
    }

    enableAllEffects() {
        this.effects.starfield = new StarfieldBackground();
        this.effects.aurora = new AuroraBackground();
        this.effects.clouds = new CloudBackground();
        this.effects.moon = new MoonBackground();
        this.effects.ambientLight = new AmbientLightEffect();

        this.activeEffects.add('starfield');
        this.activeEffects.add('aurora');
        this.activeEffects.add('clouds');
        this.activeEffects.add('moon');
        this.activeEffects.add('ambientLight');

        // 定期生成流星
        setInterval(() => {
            this.effects.starfield?.createMeteor();
        }, 10000);
    }

    enableSomeEffects() {
        this.effects.starfield = new StarfieldBackground();
        this.effects.aurora = new AuroraBackground();
        this.effects.moon = new MoonBackground();

        this.activeEffects.add('starfield');
        this.activeEffects.add('aurora');
        this.activeEffects.add('moon');
    }

    enableMinimalEffects() {
        this.effects.starfield = new StarfieldBackground();

        this.activeEffects.add('starfield');
    }

    adjustEffects(level) {
        // 销毁所有效果
        this.destroyAllEffects();

        // 根据新等级重新启用
        switch (level) {
            case 'ultra':
            case 'high':
                this.enableAllEffects();
                break;
            case 'medium':
                this.enableSomeEffects();
                break;
            case 'low':
                this.enableMinimalEffects();
                break;
        }
    }

    destroyAllEffects() {
        Object.values(this.effects).forEach(effect => {
            if (effect && typeof effect.destroy === 'function') {
                effect.destroy();
            }
        });
        this.activeEffects.clear();
    }

    getActiveEffects() {
        return Array.from(this.activeEffects);
    }
}

// ====================================
// 初始化沉浸式背景系统
// ====================================
let backgroundController = null;

async function initImmersiveBackgrounds() {
    console.log('🌌 初始化沉浸式背景效果系统...');

    try {
        // 等待性能适配器初始化
        if (window.PerformanceAdapter) {
            await window.PerformanceAdapter.init();
        }

        // 创建背景控制器
        backgroundController = new BackgroundEffectController();

        console.log('✅ 沉浸式背景效果系统初始化完成');
        console.log('🎨 启用的背景效果:', backgroundController.getActiveEffects());

        return backgroundController;
    } catch (error) {
        console.error('❌ 沉浸式背景系统初始化失败:', error);
        return null;
    }
}

// 导出全局对象
window.ImmersiveBackgrounds = {
    init: initImmersiveBackgrounds,
    controller: backgroundController,
    StarfieldBackground,
    AuroraBackground,
    CloudBackground,
    MoonBackground,
    AmbientLightEffect,
    BackgroundEffectController
};

console.log('🌌 沉浸式背景效果系统已加载');
