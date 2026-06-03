@echo off
echo 正在部署到 GitHub...
cd /d "%~dp0"
hexo clean
hexo generate
hexo deploy
echo 部署完成！
pause