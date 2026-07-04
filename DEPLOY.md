# 部署上线指南

## 快速部署（推荐 Railway）

[Railway](https://railway.app/) 支持从 GitHub 一键部署 Node.js 应用，有免费额度。

### 步骤

1. 将项目推送到 GitHub 仓库
2. 注册 [Railway](https://railway.app/)，连接 GitHub
3. 点击 **New Project → Deploy from GitHub repo**，选择你的仓库
4. Railway 自动检测 Node.js 项目并部署

Railway 会自动分配一个 `xxx.railway.app` 域名，即可访问。

---

## 手动部署（VPS/云服务器）

适用于腾讯云、阿里云等国内服务器。

### 1. 服务器环境准备

```bash
# 安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2（进程守护）
sudo npm install -g pm2
```

### 2. 上传项目

```bash
# 在服务器上克隆或上传项目
git clone <你的仓库地址>
cd Black_Room_Simulator

# 安装依赖
npm run install:all

# 构建前端 + 启动
npm run start
```

### 3. 使用 PM2 后台运行

```bash
# 构建前端
npm run build

# 用 PM2 启动（自动重启、开机自启）
pm2 start server/index.js --name "brs"
pm2 save
pm2 startup
```

### 4. 配置 Nginx 反向代理（可选）

```nginx
server {
    listen 80;
    server_name 你的域名.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 5. 配置防火墙

```bash
# 开放 80 端口（Nginx）
sudo ufw allow 80
# 或直接开放 3001 端口（不用 Nginx）
sudo ufw allow 3001
```

---

## 一键部署脚本

在服务器项目根目录执行：

```bash
#!/bin/bash
npm run install:all
npm run build
pm2 delete brs 2>/dev/null
pm2 start server/index.js --name "brs"
pm2 save
echo "部署完成！访问 http://服务器IP:3001"
```

---

## 环境变量

| 变量 | 说明 | 默认值 |
|---|---|---|
| `PORT` | 服务端口 | `3001` |

---

## 注意事项

1. **式神图片**：服务器 `server/百闻牌卡面图/` 目录包含全部卡面，确保部署时包含此目录
2. **壁纸图片**：`server/壁纸类图片/` 目录，同上
3. **内存占用**：图片较多，建议服务器至少 1GB 内存
4. **WebSocket**：如果使用 CDN/反向代理，确保支持 WebSocket 协议升级
