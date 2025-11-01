/* ====================================
   AI智能推荐系统 v4.0.0
   功能：个性化推荐、内容匹配、智能分析
   ==================================== */

class AIRecommendationSystem {
    constructor() {
        this.userProfile = this.loadUserProfile();
        this.recommendationEngine = new RecommendationEngine();
        this.contentDatabase = new ContentDatabase();
        this.learningModule = new LearningModule();
        this.init();
    }

    init() {
        this.loadUserData();
        this.setupRecommendationRules();
        console.log('🤖 AI推荐系统初始化完成');
    }

    loadUserProfile() {
        const saved = localStorage.getItem('mbti_user_profile');
        if (saved) {
            return JSON.parse(saved);
        }

        // 初始用户档案
        return {
            mbtiType: null,
            preferences: {
                visualStyle: 'halloween', // halloween, minimal, cyberpunk
                difficulty: 'normal',     // easy, normal, hard
                interactionType: 'visual' // visual, audio, text
            },
            behaviorData: {
                avgResponseTime: 0,
                completionRate: 0,
                restartCount: 0,
                favoriteFeatures: []
            },
            testHistory: [],
            completedAt: null
        };
    }

    loadUserData() {
        // 从localStorage加载用户测试历史
        const history = localStorage.getItem('mbti_test_history');
        if (history) {
            this.userProfile.testHistory = JSON.parse(history);
        }

        // 加载偏好设置
        const preferences = localStorage.getItem('mbti_user_preferences');
        if (preferences) {
            this.userProfile.preferences = { ...this.userProfile.preferences, ...JSON.parse(preferences) };
        }
    }

    saveUserProfile() {
        localStorage.setItem('mbti_user_profile', JSON.stringify(this.userProfile));
    }

    setupRecommendationRules() {
        this.recommendationRules = {
            // 基于MBTI类型的推荐
            mbtiBased: {
                'INTJ': {
                    content: ['strategic_planning', 'architectural_design', 'system_analysis'],
                    features: ['detailed_reports', 'progress_tracking', 'achievement_badges'],
                    difficulty: 'hard'
                },
                'ENFP': {
                    content: ['creative_challenges', 'social_features', 'story_modes'],
                    features: ['social_sharing', 'dynamic_themes', 'interactive_elements'],
                    difficulty: 'easy'
                },
                'ISTJ': {
                    content: ['structured_tests', 'traditional_approaches', 'reliable_methods'],
                    features: ['clear_instructions', 'stable_performance', 'data_export'],
                    difficulty: 'normal'
                },
                'ESTP': {
                    content: ['action_based', 'real_time_feedback', 'competitive_modes'],
                    features: ['instant_results', 'leaderboards', 'quick_tests'],
                    difficulty: 'easy'
                }
                // 可以为所有16种类型定义规则
            },

            // 基于行为数据的推荐
            behaviorBased: {
                fastResponders: {
                    condition: (profile) => profile.behaviorData.avgResponseTime < 3000,
                    recommendations: ['quick_test_mode', 'streamlined_interface', 'time_challenges']
                },
                slowResponders: {
                    condition: (profile) => profile.behaviorData.avgResponseTime > 10000,
                    recommendations: ['detailed_explanations', 'pause_features', 'reflection_time']
                },
                perfectionists: {
                    condition: (profile) => profile.behaviorData.completionRate > 0.9,
                    recommendations: ['advanced_analysis', 'nuanced_questions', 'precision_feedback']
                }
            }
        };
    }

    // 生成个性化推荐
    generateRecommendations() {
        const recommendations = [];

        // 1. 基于MBTI类型
        if (this.userProfile.mbtiType) {
            const mbtiRecs = this.getMBTIBasedRecommendations();
            recommendations.push(...mbtiRecs);
        }

        // 2. 基于行为模式
        const behaviorRecs = this.getBehaviorBasedRecommendations();
        recommendations.push(...behaviorRecs);

        // 3. 基于测试历史
        const historyRecs = this.getHistoryBasedRecommendations();
        recommendations.push(...historyRecs);

        // 4. AI学习模块推荐
        const learningRecs = this.learningModule.getRecommendations(this.userProfile);
        recommendations.push(...learningRecs);

        // 去重和排序
        return this.deduplicateAndRank(recommendations);
    }

    getMBTIBasedRecommendations() {
        const type = this.userProfile.mbtiType;
        const rules = this.recommendationRules.mbtiBased[type];
        if (!rules) return [];

        return [
            {
                type: 'content',
                category: 'mbti_based',
                items: rules.content,
                confidence: 0.9
            },
            {
                type: 'features',
                category: 'mbti_based',
                items: rules.features,
                confidence: 0.85
            },
            {
                type: 'difficulty',
                category: 'mbti_based',
                items: [rules.difficulty],
                confidence: 0.8
            }
        ];
    }

    getBehaviorBasedRecommendations() {
        const recommendations = [];
        const behaviorRules = this.recommendationRules.behaviorBased;

        Object.keys(behaviorRules).forEach(ruleName => {
            const rule = behaviorRules[ruleName];
            if (rule.condition(this.userProfile)) {
                recommendations.push({
                    type: 'features',
                    category: 'behavior_based',
                    items: rule.recommendations,
                    confidence: 0.75
                });
            }
        });

        return recommendations;
    }

    getHistoryBasedRecommendations() {
        const history = this.userProfile.testHistory;
        if (history.length === 0) return [];

        // 分析历史数据模式
        const patterns = this.analyzePatterns(history);
        return [{
            type: 'insights',
            category: 'history_based',
            items: patterns,
            confidence: 0.7
        }];
    }

    analyzePatterns(history) {
        const patterns = [];

        // 检测一致性
        const consistency = this.calculateConsistency(history);
        if (consistency < 0.6) {
            patterns.push({
                type: 'consistency_check',
                message: '您的答案在不同测试中变化较大，建议仔细思考每个问题',
                action: '提供一致性指导'
            });
        }

        // 检测趋势
        const trend = this.calculateTrend(history);
        if (trend.significant) {
            patterns.push({
                type: 'trend_analysis',
                message: `您的${trend.dimension}维度在近期测试中${trend.direction}`,
                action: trend.recommendation
            });
        }

        return patterns;
    }

    calculateConsistency(history) {
        if (history.length < 2) return 1;

        const types = history.map(h => h.mbtiType);
        const uniqueTypes = new Set(types);
        return 1 - (uniqueTypes.size / types.length);
    }

    calculateTrend(history) {
        if (history.length < 3) return { significant: false };

        // 简化的趋势分析
        const recent = history.slice(-3);
        const dimensions = ['E/I', 'S/N', 'T/F', 'J/P'];

        // 这里可以实现更复杂的趋势分析逻辑
        return {
            significant: Math.random() > 0.5, // 模拟结果
            dimension: dimensions[Math.floor(Math.random() * dimensions.length)],
            direction: Math.random() > 0.5 ? '增强' : '减弱',
            recommendation: '建议关注这一变化趋势'
        };
    }

    deduplicateAndRank(recommendations) {
        const seen = new Set();
        const ranked = recommendations
            .filter(rec => {
                const key = rec.category + rec.type + JSON.stringify(rec.items);
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            })
            .sort((a, b) => b.confidence - a.confidence);

        return ranked;
    }

    // 更新用户档案
    updateUserProfile(data) {
        Object.assign(this.userProfile, data);
        this.saveUserProfile();

        // 触发重新推荐
        return this.generateRecommendations();
    }

    // 记录用户行为
    recordUserAction(action, details = {}) {
        if (!this.userProfile.behaviorData.actionHistory) {
            this.userProfile.behaviorData.actionHistory = [];
        }

        this.userProfile.behaviorData.actionHistory.push({
            action,
            details,
            timestamp: Date.now()
        });

        // 保持最近100条记录
        if (this.userProfile.behaviorData.actionHistory.length > 100) {
            this.userProfile.behaviorData.actionHistory.shift();
        }

        this.saveUserProfile();
    }

    // 获取推荐内容
    getRecommendedContent(type) {
        const recommendations = this.generateRecommendations();
        const contentRec = recommendations.find(r => r.type === type);

        if (!contentRec) return [];

        return contentRec.items.map(item =>
            this.contentDatabase.getContent(item)
        ).filter(Boolean);
    }

    // 智能问题生成
    generateAdaptiveQuestions() {
        const userLevel = this.assessUserLevel();
        const questionTypes = this.getOptimalQuestionTypes(userLevel);

        return questionTypes.map(type =>
            this.contentDatabase.getQuestionTemplate(type)
        );
    }

    assessUserLevel() {
        const { testHistory, behaviorData } = this.userProfile;

        if (testHistory.length === 0) return 'beginner';
        if (testHistory.length > 10 && behaviorData.completionRate > 0.8) return 'expert';
        return 'intermediate';
    }

    getOptimalQuestionTypes(level) {
        const questionPools = {
            beginner: ['basic_preference', 'simple_scenario', 'direct_choice'],
            intermediate: ['situation_based', 'comparison', 'prioritization'],
            expert: ['complex_scenarios', 'nuanced_dilemmas', 'depth_analysis']
        };

        return questionPools[level] || questionPools.beginner;
    }

    // 生成洞察报告
    generateInsightReport() {
        const recommendations = this.generateRecommendations();
        const patterns = this.analyzePatterns(this.userProfile.testHistory);

        return {
            timestamp: Date.now(),
            userLevel: this.assessUserLevel(),
            recommendations: recommendations.slice(0, 5),
            patterns,
            nextSteps: this.generateNextSteps()
        };
    }

    generateNextSteps() {
        const steps = [];

        if (this.userProfile.testHistory.length < 3) {
            steps.push('完成至少3次测试以获得更准确的个人档案');
        }

        if (this.userProfile.behaviorData.restartCount > 2) {
            steps.push('尝试不同的主题风格，找到最适合您的体验');
        }

        steps.push('关注个性化的推荐内容，探索新的功能');

        return steps;
    }
}

// 推荐引擎
class RecommendationEngine {
    constructor() {
        this.algorithms = {
            collaborative: new CollaborativeFiltering(),
            contentBased: new ContentBasedFiltering(),
            hybrid: new HybridRecommender()
        };
    }

    getRecommendations(userProfile, algorithm = 'hybrid') {
        return this.algorithms[algorithm].recommend(userProfile);
    }
}

// 内容数据库
class ContentDatabase {
    constructor() {
        this.content = new Map();
        this.initializeContent();
    }

    initializeContent() {
        // 模拟内容数据
        this.content.set('strategic_planning', {
            title: '战略规划工具',
            description: '基于您的INTJ特质，推荐战略规划相关内容',
            type: 'content',
            url: '/content/strategic-planning'
        });

        this.content.set('social_sharing', {
            title: '社交分享功能',
            description: '轻松分享您的测试结果',
            type: 'feature',
            url: '/features/social-share'
        });

        // 更多内容...
    }

    getContent(key) {
        return this.content.get(key);
    }

    getQuestionTemplate(type) {
        const templates = {
            basic_preference: '您更喜欢在群体中...',
            situation_based: '在面对冲突时，您通常...',
            complex_scenarios: '考虑到长期影响，您会...'
        };
        return templates[type] || '选择一个最适合您的选项';
    }
}

// 学习模块
class LearningModule {
    getRecommendations(userProfile) {
        // 基于机器学习的推荐逻辑
        return [
            {
                type: 'learning_path',
                category: 'ai_based',
                items: this.generateLearningPath(userProfile),
                confidence: 0.65
            }
        ];
    }

    generateLearningPath(userProfile) {
        const paths = {
            beginner: ['了解MBTI基础', '完成入门测试', '阅读人格描述'],
            intermediate: ['深入理解认知功能', '尝试高级测试', '分析个人成长'],
            expert: ['探索职业应用', '指导他人测试', '持续自我发展']
        };

        const level = this.assessLevel(userProfile);
        return paths[level] || paths.beginner;
    }

    assessLevel(userProfile) {
        const { testHistory } = userProfile;
        if (testHistory.length < 3) return 'beginner';
        if (testHistory.length > 10) return 'expert';
        return 'intermediate';
    }
}

// 协作过滤
class CollaborativeFiltering {
    recommend(userProfile) {
        // 模拟协作过滤推荐
        return [];
    }
}

// 基于内容的过滤
class ContentBasedFiltering {
    recommend(userProfile) {
        // 模拟基于内容的过滤推荐
        return [];
    }
}

// 混合推荐
class HybridRecommender {
    recommend(userProfile) {
        // 混合多种算法
        return [];
    }
}

export default AIRecommendationSystem;
