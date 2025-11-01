/* ====================================
   高级音效系统 v4.0.0
   功能：3D空间音效、动态混响、音符可视化
   ==================================== */

class AdvancedAudioEngine {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.spatialAudioEnabled = false;
        this.convolver = null;
        this.init();
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

            // 创建混响器
            this.convolver = this.audioContext.createConvolver();
            this.convolver.buffer = await this.createReverbImpulse();

            // 连接音频图
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);

            console.log('🎵 高级音效系统初始化完成');
        } catch (error) {
            console.error('音效系统初始化失败:', error);
        }
    }

    async createReverbImpulse() {
        // 创建模拟混响响应
        const length = this.audioContext.sampleRate * 2;
        const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            }
        }
        return impulse;
    }

    // 3D空间音效
    createSpatialAudio(x, y, z = 0) {
        const panner = this.audioContext.createPanner();
        panner.positionX.setValueAtTime(x, this.audioContext.currentTime);
        panner.positionY.setValueAtTime(y, this.audioContext.currentTime);
        panner.positionZ.setValueAtTime(z, this.audioContext.currentTime);
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        return panner;
    }

    // 音符可视化
    startVisualization(canvas) {
        if (!this.analyser) return;

        const canvasCtx = canvas.getContext('2d');
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            this.analyser.getByteFrequencyData(dataArray);

            canvasCtx.fillStyle = 'rgba(11, 12, 30, 0.1)';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i] / 255 * canvas.height;

                const gradient = canvasCtx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
                gradient.addColorStop(0, '#F8A51C');
                gradient.addColorStop(0.5, '#6b1d9e');
                gradient.addColorStop(1, '#5259FF');

                canvasCtx.fillStyle = gradient;
                canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }

            requestAnimationFrame(draw);
        };

        draw();
    }

    // 动态音效生成
    generateTone(frequency, duration, type = 'sine') {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // 合成音效（叠加多个频率）
    createCompositeSound(frequencies, durations) {
        frequencies.forEach((freq, index) => {
            this.generateTone(freq, durations[index] || 0.5, index % 2 ? 'sawtooth' : 'sine');
        });
    }
}

export default AdvancedAudioEngine;
