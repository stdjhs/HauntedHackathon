@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║                                                          ║
echo ║        🎃 万圣节惊吓版 MBTI 测试 v4.0.0                   ║
echo ║        ✨ 终极视觉与体验优化版                            ║
echo ║                                                          ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
echo 🚀 正在启动优化版服务器...
echo.
echo ✨ 新增优化系统：
echo    🎨 高级视觉特效系统
echo    🚀 动画性能优化系统
echo    ✨ 微交互动画系统
echo    ⚡ 智能性能适配系统
echo    📱 移动端体验增强系统
echo    🌌 沉浸式背景效果系统
echo.
echo 💡 提示：
echo    - 访问 http://localhost:8080 体验优化效果
echo    - 访问 http://localhost:8080?debug=true 启用调试模式
echo    - 访问 http://localhost:8080?low-power=true 启用省电模式
echo.
echo 📊 性能监控：
echo    - 按 Ctrl+Shift+P 查看性能报告
echo    - 打开浏览器开发者工具查看详细信息
echo.
echo ═══════════════════════════════════════════════════════════
echo.

cd /d "%~dp0"

if exist "node_modules\.bin\http-server" (
    echo 🔧 使用 npm http-server 启动...
    node_modules\.bin\http-server -p 8080 -c-1
) else (
    echo 🔧 使用 Python 启动...
    python -m http.server 8080 2>nul
    if errorlevel 1 (
        echo.
        echo ❌ 未找到 Python，请安装 Python 或手动打开 halloween_mbti.html
        echo.
        pause
        exit /b 1
    )
)

pause
