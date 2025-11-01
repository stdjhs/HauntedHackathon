/* ====================================
   视觉特效系统 - 高级粒子系统和3D效果
   版本: v4.0.0
   目标: 提升视觉冲击力和沉浸感
   ==================================== */

// ====================================
// 高级粒子系统
// ====================================
class ParticleSystem {
    constructor(canvasId, particleCount = 200) {
        this.canvas = document.getElementById(canvasId) || this.createCanvas();
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = particleCount;
        this.mouseX = 0;
        this.mouseY = 0;
        this.isActive = true;

        this.init();
        this.bindEvents();
        this.animate();
    }

    createCanvas() {
        const canvas = document.createElement('canvas');
        canvas.id = 'particle-canvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '-1';
        document.body.appendChild(canvas);
        return canvas;
    }

    init() {
        this.resize();
        this.createParticles();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles() {
        this.particles = [];
        const colors = [
            'rgba(255, 165, 28, 0.7)',   // 橙色
            'rgba(107, 29, 158, 0.7)',   // 紫色
            'rgba(82, 89, 255, 0.7)',    // 蓝色
            'rgba(242, 92, 92, 0.7)',    // 红色
            'rgba(255, 153, 0, 0.7)',    // 南瓜色
        ];

        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                color: colors[Math.floor(Math.random() * colors.length)],
                opacity: Math.random() * 0.5 + 0.3,
                life: Math.random(),
                maxLife: 1,
                shape: Math.random() > 0.7 ? 'star' : 'circle'
            });
        }
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
    }

    updateParticles() {
        this.particles.forEach(particle => {
            // 基础运动
            particle.x += particle.speedX;
            particle.y += particle.speedY;

            // 鼠标交互
            const dx = this.mouseX - particle.x;
            const dy = this.mouseY - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 100) {
                const force = (100 - distance) / 100;
                particle.speedX -= (dx / distance) * force * 0.01;
                particle.speedY -= (dy / distance) * force * 0.01;
            }

            // 边界检测
            if (particle.x < 0 || particle.x > this.canvas.width) {
                particle.speedX *= -1;
            }
            if (particle.y < 0 || particle.y > this.canvas.height) {
                particle.speedY *= -1;
            }

            // 限制速度
            particle.speedX *= 0.99;
            particle.speedY *= 0.99;

            // 生命周期
            particle.life += 0.002;
            if (particle.life > particle.maxLife) {
                particle.life = 0;
                particle.x = Math.random() * this.canvas.width;
                particle.y = Math.random() * this.canvas.height;
            }
        });
    }

    drawParticle(particle) {
        this.ctx.save();
        this.ctx.globalAlpha = particle.opacity * (1 - particle.life / particle.maxLife);
        this.ctx.fillStyle = particle.color;

        if (particle.shape === 'star') {
            this.drawStar(particle.x, particle.y, particle.size);
        } else {
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    drawStar(x, y, size) {
        const spikes = 5;
        const outerRadius = size * 2;
        const innerRadius = size;
        let rot = Math.PI / 2 * 3;
        let step = Math.PI / spikes;

        this.ctx.beginPath();
        this.ctx.moveTo(x, y - outerRadius);
        for (let i = 0; i < spikes; i++) {
            this.ctx.lineTo(x + Math.cos(rot) * outerRadius, y + Math.sin(rot) * outerRadius);
            rot += step;
            this.ctx.lineTo(x + Math.cos(rot) * innerRadius, y + Math.sin(rot) * innerRadius);
            rot += step;
        }
        this.ctx.lineTo(x, y - outerRadius);
        this.ctx.closePath();
        this.ctx.fill();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles.forEach(particle => this.drawParticle(particle));

        // 连接靠近的粒子
        this.drawConnections();
    }

    drawConnections() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 100) {
                    this.ctx.save();
                    this.ctx.globalAlpha = (100 - distance) / 100 * 0.2;
                    this.ctx.strokeStyle = this.particles[i].color;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                    this.ctx.restore();
                }
            }
        }
    }

    animate() {
        if (!this.isActive) return;
        this.updateParticles();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }

    destroy() {
        this.isActive = false;
        this.canvas.remove();
    }

    setParticleCount(count) {
        this.particleCount = count;
        this.createParticles();
    }
}

// ====================================
// 极光背景效果
// ====================================
class AuroraEffect {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.init();
    }

    init() {
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '-2';
        this.canvas.style.opacity = '0.6';
        document.body.appendChild(this.canvas);

        this.resize();
        this.animate();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    animate() {
        const time = Date.now() * 0.0005;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制多层极光
        for (let i = 0; i < 3; i++) {
            this.drawAuroraLayer(
                i * 0.3 + time,
                i * 0.5,
                ['rgba(255, 165, 28, 0.1)', 'rgba(107, 29, 158, 0.1)', 'rgba(82, 89, 255, 0.1)'][i]
            );
        }

        requestAnimationFrame(() => this.animate());
    }

    drawAuroraLayer(offset, amplitude, color) {
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, 0);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, color.replace('0.1', '0.3'));
        gradient.addColorStop(1, color);

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();

        this.ctx.moveTo(0, this.canvas.height * 0.6);

        for (let x = 0; x <= this.canvas.width; x += 10) {
            const y = this.canvas.height * 0.6 +
                Math.sin(x * 0.01 + offset) * amplitude * 50 +
                Math.cos(x * 0.02 + offset * 2) * amplitude * 30;
            this.ctx.lineTo(x, y);
        }

        this.ctx.lineTo(this.canvas.width, this.canvas.height);
        this.ctx.lineTo(0, this.canvas.height);
        this.ctx.closePath();
        this.ctx.fill();
    }
}

// ====================================
// 3D卡片效果系统
// ====================================
class Card3DEffect {
    constructor() {
        this.cards = [];
        this.init();
    }

    init() {
        // 监听DOM变化，当新卡片添加时自动应用3D效果
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        this.apply3DEffect(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // 为已存在的卡片应用效果
        document.querySelectorAll('.question-card, .result-card').forEach(card => {
            this.apply3DEffect(card);
        });
    }

    apply3DEffect(element) {
        if (element.classList.contains('card-3d-applied')) return;

        element.style.transformStyle = 'preserve-3d';
        element.style.transition = 'all 0.3s ease';

        element.addEventListener('mouseenter', (e) => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;

            element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

            // 添加光影效果
            element.style.boxShadow = `
                ${-rotateY / 2}px ${rotateX / 2}px 20px rgba(255, 165, 28, 0.3),
                0 20px 40px rgba(0, 0, 0, 0.3)
            `;
        });

        element.addEventListener('mouseleave', () => {
            element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            element.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.3)';
        });

        element.addEventListener('mousemove', (e) => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;

            element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        element.classList.add('card-3d-applied');
    }
}

// ====================================
// 视差滚动效果
// ====================================
class ParallaxEffect {
    constructor() {
        this.layers = [];
        this.init();
    }

    init() {
        // 创建多层背景
        this.createLayer('stars', 'stars-layer', '🌟', 0.1);
        this.createLayer('moons', 'moons-layer', '🌙', 0.3);
        this.createLayer('clouds', 'clouds-layer', '☁️', 0.5);

        window.addEventListener('scroll', () => this.update());
        this.update();
    }

    createLayer(name, className, symbol, speed) {
        const layer = document.createElement('div');
        layer.className = `parallax-layer ${className}`;
        layer.style.position = 'fixed';
        layer.style.top = '0';
        layer.style.left = '0';
        layer.style.width = '100%';
        layer.style.height = '100%';
        layer.style.pointerEvents = 'none';
        layer.style.zIndex = '-1';
        layer.style.opacity = '0.6';

        // 生成随机位置的元素
        for (let i = 0; i < 20; i++) {
            const element = document.createElement('div');
            element.textContent = symbol;
            element.style.position = 'absolute';
            element.style.left = Math.random() * 100 + '%';
            element.style.top = Math.random() * 100 + '%';
            element.style.fontSize = Math.random() * 20 + 20 + 'px';
            element.style.opacity = Math.random() * 0.5 + 0.3;
            layer.appendChild(element);
        }

        document.body.appendChild(layer);
        this.layers.push({ element: layer, speed });
    }

    update() {
        const scrollY = window.scrollY;
        this.layers.forEach(layer => {
            layer.element.style.transform = `translateY(${scrollY * layer.speed}px)`;
        });
    }
}

// ====================================
// 浮动元素动画
// ====================================
class FloatingElements {
    constructor() {
        this.elements = [];
        this.init();
    }

    init() {
        // 为浮动元素添加动画
        document.querySelectorAll('.floating-pumpkin, .floating-ghost, .floating-bat, .floating-skull').forEach(elem => {
            this.animateElement(elem);
        });
    }

    animateElement(element) {
        const amplitude = Math.random() * 50 + 30;
        const speed = Math.random() * 0.0005 + 0.0005;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const y = Math.sin(elapsed * speed) * amplitude;
            const x = Math.cos(elapsed * speed * 0.5) * amplitude * 0.3;
            const rotation = Math.sin(elapsed * speed * 0.3) * 10;

            element.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
            element.style.opacity = 0.5 + Math.sin(elapsed * speed * 2) * 0.3;

            requestAnimationFrame(animate);
        };

        animate();
    }
}

// ====================================
// 性能自适应系统
// ====================================
class PerformanceAdapter {
    constructor() {
        this.effects = [];
        this.devicePerformance = this.detectPerformance();
        this.applySettings();
    }

    detectPerformance() {
        // 检测设备性能
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        const isHighEnd = !!gl && window.innerWidth > 1920;

        // FPS检测
        let frames = 0;
        let lastTime = performance.now();
        let fps = 60;

        const countFrames = () => {
            frames++;
            const currentTime = performance.now();
            if (currentTime - lastTime >= 1000) {
                fps = frames;
                frames = 0;
                lastTime = currentTime;
            }
            requestAnimationFrame(countFrames);
        };
        countFrames();

        setTimeout(() => {
            this.devicePerformance.fps = fps;
            this.adjustEffects();
        }, 2000);

        return {
            isHighEnd,
            fps,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight
        };
    }

    adjustEffects() {
        if (this.devicePerformance.fps < 30) {
            // 低性能设备，降低特效
            document.documentElement.style.setProperty('--particle-density', '0.5');
            document.documentElement.style.setProperty('--animation-intensity', '0.7');
        } else if (this.devicePerformance.fps > 50) {
            // 高性能设备，增强特效
            document.documentElement.style.setProperty('--particle-density', '1.5');
            document.documentElement.style.setProperty('--animation-intensity', '1.3');
        }
    }

    applySettings() {
        // 根据设备性能调整设置
        if (this.devicePerformance.screenWidth < 768) {
            // 移动端优化
            CONFIG.PERFORMANCE.THROTTLE_UPDATE = 200;
        }
    }

    registerEffect(effect) {
        this.effects.push(effect);
    }

    destroy() {
        this.effects.forEach(effect => {
            if (effect.destroy) effect.destroy();
        });
    }
}

// ====================================
// 初始化所有视觉特效
// ====================================
let particleSystem = null;
let auroraEffect = null;
let card3DEffect = null;
let parallaxEffect = null;
let floatingElements = null;
let performanceAdapter = null;

function initVisualEffects() {
    // 只在支持的浏览器中启用
    const isSupported = !!(window.CanvasRenderingContext2D || window.WebGLRenderingContext);
    if (!isSupported) return;

    performanceAdapter = new PerformanceAdapter();

    // 延迟初始化，避免影响首屏加载
    setTimeout(() => {
        particleSystem = new ParticleSystem('particle-canvas', 200);
        auroraEffect = new AuroraEffect();
        card3DEffect = new Card3DEffect();
        parallaxEffect = new ParallaxEffect();
        floatingElements = new FloatingElements();

        performanceAdapter.registerEffect(particleSystem);
        performanceAdapter.registerEffect(auroraEffect);
    }, 100);
}

function cleanupVisualEffects() {
    if (particleSystem) particleSystem.destroy();
    if (auroraEffect) auroraEffect.canvas.remove();
    if (parallaxEffect) {
        parallaxEffect.layers.forEach(layer => layer.element.remove());
    }
    if (performanceAdapter) performanceAdapter.destroy();
}

// 页面卸载时清理资源
window.addEventListener('beforeunload', cleanupVisualEffects);

// 导出全局对象
window.VisualEffects = {
    init: initVisualEffects,
    cleanup: cleanupVisualEffects,
    ParticleSystem,
    AuroraEffect,
    Card3DEffect,
    ParallaxEffect,
    FloatingElements,
    PerformanceAdapter
};
