#!/bin/bash
# 部署到服务器 47.119.37.238
# 在 Git Bash 中执行: bash deploy.sh

SERVER="root@47.119.37.238"

echo "=== 连接服务器并部署 ==="
ssh $SERVER << 'ENDSSH'
echo "1. 安装 Node.js..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo "Node: $(node -v), NPM: $(npm -v)"

echo "2. 安装 PM2..."
npm install -g pm2

echo "3. 克隆项目..."
if [ -d /root/Black_Room_Simulator ]; then
  cd /root/Black_Room_Simulator && git pull
else
  git clone https://github.com/weiye1234562/Black_Room_Simulator.git /root/Black_Room_Simulator
  cd /root/Black_Room_Simulator
fi

echo "4. 安装依赖..."
npm run install:all

echo "5. 构建前端..."
npm run build

echo "6. 启动服务 (PM2)..."
pm2 delete brs 2>/dev/null
pm2 start server/index.js --name brs
pm2 save

echo "7. 检查状态..."
pm2 status

echo ""
echo "=== 部署完成! ==="
echo "访问 http://47.119.37.238:3000"
echo "如果打不开，检查服务器防火墙是否开放 3000 端口"
ENDSSH
