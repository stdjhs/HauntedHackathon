@echo off
echo ========================================
echo 万圣节MBTI测试 - 快速启动服务器
echo ========================================
echo.

echo 正在启动服务器...
echo.

npx serve . -p 9999

if %errorlevel% neq 0 (
    echo.
    echo 错误：无法启动npx serve
    echo 请确保已安装Node.js
    echo.
    echo 备用方案：
    echo 1. 直接双击 halloween_mbti.html 文件
    echo 2. 或者安装Python后运行：python -m http.server 8000
    echo.
    pause
)
