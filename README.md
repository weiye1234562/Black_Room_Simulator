# 黑房间模拟器 (Black Room Simulator)

百闻牌比赛外置式神 Ban/Pick 系统

## 快速启动

```bash
# 安装所有依赖
npm run install:all

# 启动开发环境（同时启动后端和前端）
npm run dev
```

- 后端: http://localhost:3001
- 前端: http://localhost:5173

## 使用流程

1. **裁判** 打开网页 → "创建房间" → 获得 6 位房间码 → 分享给选手
2. **选手** 打开网页 → "加入房间" → 输入房间码 + 昵称 + 选择红/蓝方
3. **裁判** 确认双方到齐 → 点击"开始比赛"
4. 依次进行 6 个 Ban/Pick 阶段
5. 每阶段 60 秒暗选 → 双方确认 → 揭示结果 → 裁判推进下一阶段
6. 观众可通过"观战"入口加入观看

## 技术栈

- 前端: React 18 + Vite + Tailwind CSS
- 后端: Node.js + Express + Socket.io
- 实时通信: WebSocket (Socket.io)
