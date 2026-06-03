@echo off
echo 正在更新博客...
cd /d f:\hexo\blog
hexo clean
hexo generate
Compress-Archive -Path "public" -DestinationPath "public.zip" -Force
echo 文件已压缩：public.zip
echo 请手动上传到 GitHub
pause