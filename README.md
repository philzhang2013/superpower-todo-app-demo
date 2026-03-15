# Todo 管理应用

一个简单的网页版 Todo 管理应用，支持用户注册/登录和待办事项的增删改查。

通过 Claude Code 的 Superpowers 工具从零构建。

## 技术栈

| 层 | 技术 |
|----|------|
| 前端框架 | Vue 3 |
| 构建工具 | Vite |
| UI 组件库 | Element Plus |
| 状态管理 | Pinia |
| 路由 | Vue Router 4 |
| HTTP 客户端 | Axios |
| 后端框架 | Egg.js |
| ORM | egg-sequelize (Sequelize) |
| 数据库 | MySQL |
| 认证 | JWT (egg-jwt) |
| 密码加密 | bcryptjs |
| 跨域 | egg-cors |

## 项目结构

```
superpower-todo-app-demo/
├── client/                          # 前端（Vue 3）
│   ├── src/
│   │   ├── views/                   # 页面
│   │   │   ├── Login.vue            # 登录页
│   │   │   ├── Register.vue         # 注册页
│   │   │   └── TodoList.vue         # Todo 列表主页
│   │   ├── stores/                  # Pinia 状态管理
│   │   │   ├── user.js              # 用户状态（登录/注册/登出）
│   │   │   └── todo.js              # Todo 状态（增删改查）
│   │   ├── router/index.js          # 路由配置 + 登录守卫
│   │   ├── utils/request.js         # Axios 封装（JWT 拦截器）
│   │   ├── App.vue                  # 根组件
│   │   └── main.js                  # 入口文件
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/                          # 后端（Egg.js）
│   ├── app/
│   │   ├── controller/
│   │   │   ├── home.js              # 首页（健康检查）
│   │   │   ├── user.js              # 用户注册/登录
│   │   │   └── todo.js              # Todo 增删改查
│   │   ├── service/
│   │   │   ├── user.js              # 用户业务逻辑
│   │   │   └── todo.js              # Todo 业务逻辑
│   │   ├── model/
│   │   │   ├── user.js              # User 模型
│   │   │   └── todo.js              # Todo 模型
│   │   ├── middleware/auth.js        # JWT 鉴权中间件
│   │   └── router.js                # 路由配置
│   ├── config/
│   │   ├── config.default.js        # 默认配置（数据库、JWT、CORS）
│   │   └── plugin.js                # 插件配置
│   ├── app.js                       # 启动时同步数据库
│   └── package.json
└── docs/plans/                      # 设计文档
    ├── 2026-03-15-todo-app-design.md          # 设计方案
    ├── 2026-03-15-todo-app-implementation.md  # 实施计划
    └── ui-wireframe.html                      # UI 草图
```

## API 接口

| 方法 | 路径 | 说明 | 需要认证 |
|------|------|------|----------|
| POST | `/api/user/register` | 用户注册 | 否 |
| POST | `/api/user/login` | 用户登录，返回 JWT | 否 |
| GET | `/api/todos` | 获取当前用户的 Todo 列表 | 是 |
| POST | `/api/todos` | 创建 Todo | 是 |
| PUT | `/api/todos/:id` | 更新 Todo（标题/完成状态） | 是 |
| DELETE | `/api/todos/:id` | 删除 Todo | 是 |

**统一响应格式：**

```json
{ "code": 0, "data": {}, "message": "success" }
{ "code": 1, "message": "错误信息" }
```

## 快速开始

### 前置条件

- Node.js >= 16
- MySQL 数据库（需提前创建 `todo_app` 数据库）

### 1. 配置数据库

修改 `server/config/config.default.js` 中的数据库连接信息：

```js
config.sequelize = {
  dialect: 'mysql',
  host: 'your-mysql-host',
  port: 3306,
  database: 'todo_app',
  username: 'root',
  password: 'your-password',
};
```

### 2. 启动后端

```bash
cd server
npm install
npm run dev
```

后端运行在 http://localhost:7001 ，首次启动会自动创建数据表。

### 3. 启动前端

```bash
cd client
npm install
npm run dev
```

前端运行在 http://localhost:5173

### 4. 开始使用

1. 访问 http://localhost:5173
2. 注册一个新账号
3. 登录后即可管理你的待办事项

## 功能

- 用户注册/登录（JWT 认证，7 天有效期）
- 添加待办事项（输入框 + 回车提交）
- 标记完成/未完成（勾选框切换）
- 双击标题行内编辑
- 删除待办事项（二次确认）
- 按状态筛选（全部/未完成/已完成）
- 路由守卫（未登录自动跳转登录页）
- 统一错误处理（401 自动登出、网络错误提示）

## 参考文章

https://mp.weixin.qq.com/s/n52dg8R2fzgHNIo9XX-HMA
