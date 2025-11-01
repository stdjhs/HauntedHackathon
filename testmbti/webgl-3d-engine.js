/* ====================================
   WebGL 3D渲染引擎 v4.0.0
   功能：3D场景、光照、阴影、粒子特效
   ==================================== */

class WebGL3DEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId) || this.createCanvas();
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        this.scene = new Scene();
        this.camera = new Camera();
        this.renderer = new Renderer(this.gl);
        this.lights = [];
        this.isRunning = false;
        this.frameCount = 0;

        this.init();
    }

    createCanvas() {
        const canvas = document.createElement('canvas');
        canvas.id = 'webgl-3d-canvas';
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -10;
        `;
        document.body.appendChild(canvas);
        return canvas;
    }

    init() {
        if (!this.gl) {
            console.error('WebGL不支持');
            return;
        }

        // 调整画布大小
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // 启用深度测试
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);

        // 设置混色
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        // 创建基础几何体
        this.createDefaultScene();

        // 启动渲染循环
        this.start();

        console.log('🎨 WebGL 3D引擎初始化完成');
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.camera.aspect = this.canvas.width / this.canvas.height;
    }

    createDefaultScene() {
        // 创建万圣节南瓜
        this.createPumpkin();

        // 创建3D星空
        this.create3DStarfield();

        // 创建浮动鬼魂
        this.createFloatingGhosts();

        // 添加光源
        this.addLight(new PointLight([0, 5, 0], [1, 0.5, 0], 1));
        this.addLight(new AmbientLight([0.2, 0.2, 0.2]));
    }

    createPumpkin() {
        // 南瓜几何体（简化版）
        const vertices = [];
        const colors = [];
        const indices = [];

        // 创建南瓜形状（椭球体）
        for (let lat = 0; lat <= 20; lat++) {
            const theta = lat * Math.PI / 20;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);

            for (let lon = 0; lon <= 30; lon++) {
                const phi = lon * 2 * Math.PI / 30;
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);

                const x = sinTheta * cosPhi;
                const y = cosTheta;
                const z = sinTheta * sinPhi;

                vertices.push(x, y, z);
                colors.push(1, 0.5, 0, 1); // 橙色
            }
        }

        // 生成索引
        for (let lat = 0; lat < 20; lat++) {
            for (let lon = 0; lon < 30; lon++) {
                const first = (lat * (30 + 1)) + lon;
                const second = first + 30 + 1;

                indices.push(first, second, first + 1);
                indices.push(second, second + 1, first + 1);
            }
        }

        const pumpkin = new Mesh(vertices, colors, indices);
        pumpkin.position = [0, -1, -5];
        pumpkin.scale = [1.5, 1.5, 1.5];
        pumpkin.rotation = [0, 0, 0];
        this.scene.addObject(pumpkin);
    }

    create3DStarfield() {
        const vertices = [];
        const colors = [];

        for (let i = 0; i < 1000; i++) {
            // 随机位置
            const x = (Math.random() - 0.5) * 100;
            const y = (Math.random() - 0.5) * 100;
            const z = (Math.random() - 0.5) * 100;

            vertices.push(x, y, z);

            // 随机颜色
            const color = Math.random();
            colors.push(
                color > 0.5 ? 1 : 0.5, // R
                color > 0.3 ? 1 : 0.5, // G
                1,                     // B
                1                      // A
            );
        }

        const starfield = new Mesh(vertices, colors, null);
        this.scene.addObject(starfield);
    }

    createFloatingGhosts() {
        for (let i = 0; i < 5; i++) {
            const vertices = this.createGhostGeometry();
            const colors = new Array(vertices.length / 3).fill([1, 1, 1, 0.8]).flat();

            const ghost = new Mesh(vertices, colors, null);
            ghost.position = [
                (Math.random() - 0.5) * 20,
                Math.random() * 5,
                -10 - Math.random() * 10
            ];
            ghost.scale = [0.5, 0.5, 0.5];
            this.scene.addObject(ghost);
        }
    }

    createGhostGeometry() {
        // 简化的鬼魂形状
        return [
            // 身体
            0, 1, 0,    -0.5, 0, 0,    0.5, 0, 0,
            0, 1, 0,    0.5, 0, 0,     0.5, -1, 0,
            0, 1, 0,    0.5, -1, 0,    0, -1, 0,
            0, 1, 0,    0, -1, 0,      -0.5, -1, 0,
            0, 1, 0,    -0.5, -1, 0,   -0.5, 0, 0,

            // 眼睛
            -0.2, 0.7, 0.1,  -0.1, 0.7, 0.1,  -0.15, 0.6, 0.1,
            0.1, 0.7, 0.1,   0.2, 0.7, 0.1,   0.15, 0.6, 0.1
        ];
    }

    addLight(light) {
        this.lights.push(light);
    }

    start() {
        this.isRunning = true;
        this.render();
    }

    stop() {
        this.isRunning = false;
    }

    render() {
        if (!this.isRunning) return;

        // 清空画布
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        // 更新动画
        this.updateAnimations();

        // 渲染场景
        this.renderer.render(this.scene, this.camera, this.lights);

        this.frameCount++;
        requestAnimationFrame(() => this.render());
    }

    updateAnimations() {
        // 旋转南瓜
        const pumpkin = this.scene.objects[0];
        if (pumpkin) {
            pumpkin.rotation[1] += 0.01;
        }

        // 浮动鬼魂
        this.scene.objects.forEach((obj, index) => {
            if (index > 1 && index < 7) { // 鬼魂对象
                obj.position[1] += Math.sin(this.frameCount * 0.02 + index) * 0.01;
                obj.position[0] += Math.cos(this.frameCount * 0.015 + index) * 0.005;
            }
        });
    }
}

// 基础类
class Scene {
    constructor() {
        this.objects = [];
    }

    addObject(object) {
        this.objects.push(object);
    }
}

class Camera {
    constructor() {
        this.position = [0, 0, 0];
        this.target = [0, 0, -5];
        this.up = [0, 1, 0];
        this.aspect = 1;
        this.fov = Math.PI / 4;
        this.near = 0.1;
        this.far = 1000;
    }

    getViewMatrix() {
        // 简化版视图矩阵
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    }

    getProjectionMatrix() {
        const f = 1.0 / Math.tan(this.fov / 2);
        return [
            f / this.aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (this.far + this.near) / (this.near - this.far), (2 * this.far * this.near) / (this.near - this.far),
            0, 0, -1, 0
        ];
    }
}

class Mesh {
    constructor(vertices, colors, indices) {
        this.vertices = vertices;
        this.colors = colors;
        this.indices = indices;
        this.position = [0, 0, 0];
        this.scale = [1, 1, 1];
        this.rotation = [0, 0, 0];
    }
}

class Light {
    constructor(color, intensity) {
        this.color = color;
        this.intensity = intensity;
    }
}

class PointLight extends Light {
    constructor(position, color, intensity) {
        super(color, intensity);
        this.position = position;
    }
}

class AmbientLight extends Light {
    constructor(color) {
        super(color, 1);
    }
}

class Renderer {
    constructor(gl) {
        this.gl = gl;
        this.shaderProgram = this.createShaderProgram();
    }

    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('着色器编译错误:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    createShaderProgram() {
        const vertexShaderSource = `
            attribute vec3 aPosition;
            attribute vec4 aColor;
            uniform mat4 uModelMatrix;
            uniform mat4 uViewMatrix;
            uniform mat4 uProjectionMatrix;
            varying vec4 vColor;
            void main() {
                gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
                vColor = aColor;
            }
        `;

        const fragmentShaderSource = `
            precision mediump float;
            varying vec4 vColor;
            void main() {
                gl_FragColor = vColor;
            }
        `;

        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

        const shaderProgram = this.gl.createProgram();
        this.gl.attachShader(shaderProgram, vertexShader);
        this.gl.attachShader(shaderProgram, fragmentShader);
        this.gl.linkProgram(shaderProgram);

        if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS)) {
            console.error('程序链接错误:', this.gl.getProgramInfoLog(shaderProgram));
        }

        return shaderProgram;
    }

    render(scene, camera, lights) {
        this.gl.useProgram(this.shaderProgram);

        scene.objects.forEach(object => {
            this.drawMesh(object);
        });
    }

    drawMesh(mesh) {
        const gl = this.gl;

        // 创建顶点缓冲区
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.vertices), gl.STATIC_DRAW);

        // 创建颜色缓冲区
        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.colors), gl.STATIC_DRAW);

        // 设置顶点属性
        const positionAttribute = gl.getAttribLocation(this.shaderProgram, 'aPosition');
        gl.enableVertexAttribArray(positionAttribute);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(positionAttribute, 3, gl.FLOAT, false, 0, 0);

        const colorAttribute = gl.getAttribLocation(this.shaderProgram, 'aColor');
        gl.enableVertexAttribArray(colorAttribute);
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.vertexAttribPointer(colorAttribute, 4, gl.FLOAT, false, 0, 0);

        // 绘制几何体
        if (mesh.indices) {
            gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
        } else {
            gl.drawArrays(gl.TRIANGLES, 0, mesh.vertices.length / 3);
        }
    }
}

export default WebGL3DEngine;
