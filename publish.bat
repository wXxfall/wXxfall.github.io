@echo off
echo ========================================
echo      Hexo 博客一键发布脚本
echo ========================================
echo.
echo 正在清除缓存...
hexo clean
echo.
echo 正在生成静态文件...
hexo generate
echo.
echo 正在部署到 GitHub...
hexo deploy
echo.
echo ========================================
echo       发布完成！
echo ========================================
echo.
echo 请访问 https://wXxfall.github.io 查看更新
echo.
pause