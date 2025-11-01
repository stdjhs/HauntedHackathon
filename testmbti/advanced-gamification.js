/* ====================================
   游戏化增强系统 v4.0.0
   功能：更多小游戏、成就系统升级、收集系统
   ==================================== */

class AdvancedGamificationSystem {
    constructor() {
        this.achievements = new Map();
        this.collectibles = new Map();
        this.questSystem = new QuestSystem();
        this.rewardPool = new Map();
        this.init();
    }

    init() {
        this.setupAchievements();
        this.setupCollectibles();
        this.setupQuests();
        this.setupRewardSystem();
    }

    // 成就系统升级 - 增加稀有度、进度追踪
    setupAchievements() {
        const achievements = [
            {
                id: 'speed_demon',
                name: '速度恶魔',
                description: '5秒内完成10道题',
                rarity: 'legendary',
                icon: '⚡',
                progress: { current: 0, target: 10 },
                reward: { coins: 500, title: '闪电侠' }
            },
            {
                id: 'perfectionist',
                name: '完美主义者',
                description: '连续20题零犹豫',
                rarity: 'epic',
                icon: '💎',
                progress: { current: 0, target: 20 },
                reward: { coins: 300, avatarFrame: 'diamond' }
            },
            {
                id: 'explorer',
                name: '探索者',
                description: '尝试所有16种MBTI类型',
                rarity: 'rare',
                icon: '🗺️',
                progress: { current: 0, target: 16 },
                reward: { coins: 200, theme: 'explorer' }
            },
            {
                id: 'social_butterfly',
                name: '社交达人',
                description: '分享结果给10位朋友',
                rarity: 'uncommon',
                icon: '🦋',
                progress: { current: 0, target: 10 },
                reward: { coins: 150, badge: 'social' }
            },
            {
                id: 'marathoner',
                name: '马拉松选手',
                description: '连续7天完成测试',
                rarity: 'rare',
                icon: '🏃',
                progress: { current: 0, target: 7 },
                reward: { coins: 250, vip: 3 }
            }
        ];

        achievements.forEach(achievement => {
            this.achievements.set(achievement.id, achievement);
        });
    }

    // 收集系统 - 魔法道具
    setupCollectibles() {
        const collectibles = [
            {
                id: 'magic_crystal',
                name: '魔法水晶',
                description: '增强你的直觉能力',
                icon: '🔮',
                effect: 'increase_intuition_10%',
                rarity: 'common',
                dropRate: 0.15
            },
            {
                id: 'shadow_amulet',
                name: '暗影护符',
                description: '降低恐惧值增长',
                icon: '🪬',
                effect: 'reduce_fear_20%',
                rarity: 'uncommon',
                dropRate: 0.08
            },
            {
                id: 'time_crystal',
                name: '时间水晶',
                description: '额外获得思考时间',
                icon: '⏰',
                effect: 'extra_time_5s',
                rarity: 'rare',
                dropRate: 0.05
            },
            {
                id: 'ancient_tome',
                name: '古老卷轴',
                description: '揭示隐藏题目',
                icon: '📜',
                effect: 'reveal_secret_question',
                rarity: 'legendary',
                dropRate: 0.02
            }
        ];

        collectibles.forEach(item => {
            this.collectibles.set(item.id, item);
        });
    }

    // 任务系统
    setupQuests() {
        // 日常任务
        this.dailyQuests = [
            {
                id: 'daily_quick_test',
                name: '快速测试',
                description: '在3分钟内完成测试',
                reward: { coins: 100, exp: 50 },
                isCompleted: false
            },
            {
                id: 'daily_perfect_score',
                name: '完美得分',
                description: '获得100%可信度',
                reward: { coins: 150, exp: 75 },
                isCompleted: false
            }
        ];

        // 周常任务
        this.weeklyQuests = [
            {
                id: 'weekly_master',
                name: '人格大师',
                description: '完成50次测试',
                reward: { coins: 1000, title: '人格研究家', vip: 7 },
                progress: { current: 0, target: 50 },
                isCompleted: false
            }
        ];
    }

    // 奖励池系统
    setupRewardSystem() {
        this.rewardPool.set('common', [
            { type: 'coins', min: 50, max: 100, weight: 40 },
            { type: 'exp', min: 25, max: 50, weight: 35 },
            { type: 'collectible', item: 'magic_crystal', weight: 25 }
        ]);

        this.rewardPool.set('rare', [
            { type: 'coins', min: 200, max: 300, weight: 20 },
            { type: 'avatar_frame', item: 'golden', weight: 15 },
            { type: 'collectible', item: 'time_crystal', weight: 10 }
        ]);
    }

    // 检查并解锁成就
    checkAchievement(achievementId, progressData = {}) {
        const achievement = this.achievements.get(achievementId);
        if (!achievement) return;

        // 更新进度
        if (progressData.increment) {
            achievement.progress.current = Math.min(
                achievement.progress.target,
                achievement.progress.current + progressData.increment
            );
        }

        // 检查是否完成
        if (achievement.progress.current >= achievement.progress.target && !achievement.unlocked) {
            this.unlockAchievement(achievement);
            return true;
        }
        return false;
    }

    // 解锁成就
    unlockAchievement(achievement) {
        achievement.unlocked = true;
        achievement.unlockedAt = Date.now();

        // 保存到localStorage
        localStorage.setItem(`achievement_${achievement.id}`, JSON.stringify(achievement));

        // 显示成就弹窗
        this.showAchievementNotification(achievement);

        // 发放奖励
        this.grantReward(achievement.reward);

        console.log(`🏆 解锁成就: ${achievement.name}`);
    }

    // 显示成就通知
    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-info">
                <h3>${achievement.name}</h3>
                <p>${achievement.description}</p>
                <span class="rarity-badge ${achievement.rarity}">${achievement.rarity.toUpperCase()}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // 添加动画
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    // 发放奖励
    grantReward(reward) {
        if (reward.coins) {
            console.log(`🪙 获得金币: ${reward.coins}`);
        }
        if (reward.exp) {
            console.log(`⭐ 获得经验: ${reward.exp}`);
        }
        if (reward.title) {
            console.log(`👑 获得称号: ${reward.title}`);
        }
        // 更多奖励逻辑...
    }

    // 获取稀有度颜色
    getRarityColor(rarity) {
        const colors = {
            common: '#9E9E9E',
            uncommon: '#4CAF50',
            rare: '#2196F3',
            epic: '#9C27B0',
            legendary: '#FF9800'
        };
        return colors[rarity] || '#9E9E9E';
    }

    // 获取所有成就
    getAllAchievements() {
        return Array.from(this.achievements.values());
    }

    // 获取已解锁成就
    getUnlockedAchievements() {
        return Array.from(this.achievements.values()).filter(a => a.unlocked);
    }
}

// 任务系统类
class QuestSystem {
    constructor() {
        this.activeQuests = [];
        this.completedQuests = [];
    }

    // 生成随机任务
    generateRandomQuest() {
        const questTemplates = [
            {
                name: '神秘的万圣节',
                description: '在万圣节主题下完成测试',
                reward: { coins: 100 }
            },
            {
                name: '速度挑战',
                description: '30秒内完成一道题',
                reward: { coins: 75 }
            }
        ];

        return questTemplates[Math.floor(Math.random() * questTemplates.length)];
    }

    // 完成任务
    completeQuest(questId) {
        const quest = this.activeQuests.find(q => q.id === questId);
        if (quest) {
            quest.completed = true;
            quest.completedAt = Date.now();
            this.completedQuests.push(quest);
            return quest;
        }
        return null;
    }
}

export default AdvancedGamificationSystem;
