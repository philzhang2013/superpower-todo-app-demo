# Todo 管理应用

一个简单的网页版 Todo 管理应用，支持用户注册/登录和待办事项的增删改查。

通过 Claude Code 的 Superpowers 工具从零构建。

## 技术栈

- **前端**：Vue 3 + Vite + Element Plus + Pinia + Vue Router + Axios
- **后端**：Egg.js + egg-sequelize + egg-jwt + egg-cors
- **数据库**：MySQL

## 快速开始

### 1. 启动后端

```bash
cd server
npm install
npm run dev
```

后端运行在 http://localhost:7001

### 2. 启动前端

```bash
cd client
npm install
npm run dev
```

前端运行在 http://localhost:5173

### 3. 开始使用

1. 访问 http://localhost:5173
2. 注册一个新账号
3. 登录后即可管理你的待办事项

## 功能

- 用户注册/登录（JWT 认证）
- 添加待办事项
- 标记完成/未完成
- 双击编辑标题
- 删除待办事项
- 按状态筛选（全部/未完成/已完成）

## 参考文章

https://mp.weixin.qq.com/s/n52dg8R2fzgHNIo9XX-HMA
