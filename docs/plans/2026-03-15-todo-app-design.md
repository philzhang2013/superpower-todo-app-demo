# Todo 管理应用设计文档

## 1. 整体架构

前后端分离架构：

```
Vue 3 (Vite + Element Plus)  <-->  Egg.js REST API  <-->  MySQL
         :5173                        :7001
```

- **前端**：Vue 3 + Vite + Element Plus + Vue Router + Axios + Pinia（状态管理）
- **后端**：Egg.js + egg-jwt + egg-sequelize（ORM）+ MySQL
- **认证**：JWT Token，前端存 localStorage，Axios 拦截器自动携带

### 目录结构

```
superpower-todo-app-demo/
├── client/          # Vue 3 前端
│   ├── src/
│   │   ├── views/       # 页面：Login, Register, TodoList
│   │   ├── components/  # 组件：TodoItem, TodoForm
│   │   ├── router/      # 路由配置 + 登录守卫
│   │   ├── stores/      # Pinia 状态管理
│   │   └── utils/       # axios 封装
│   └── vite.config.js
├── server/          # Egg.js 后端
│   ├── app/
│   │   ├── controller/  # user, todo
│   │   ├── service/     # user, todo
│   │   ├── model/       # User, Todo (Sequelize)
│   │   ├── middleware/  # jwt 鉴权
│   │   └── router.js
│   └── config/
└── README.md
```

## 2. 数据库设计

### users 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT, 主键, 自增 | 用户ID |
| username | VARCHAR(50), 唯一 | 用户名 |
| password | VARCHAR(255) | 密码（bcrypt 加密存储） |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### todos 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT, 主键, 自增 | Todo ID |
| user_id | INT, 外键 -> users.id | 所属用户 |
| title | VARCHAR(255) | 标题 |
| completed | BOOLEAN, 默认 false | 是否完成 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

## 3. API 设计

### 用户相关

- `POST /api/user/register` - 注册（username, password）
- `POST /api/user/login` - 登录，返回 JWT token

### Todo 相关（需携带 JWT）

- `GET /api/todos` - 获取当前用户的所有 Todo
- `POST /api/todos` - 创建 Todo（title）
- `PUT /api/todos/:id` - 更新 Todo（title, completed）
- `DELETE /api/todos/:id` - 删除 Todo

所有 Todo 接口通过 JWT 中间件验证身份，确保用户只能操作自己的数据。

### 统一响应格式

```json
// 成功
{ "code": 0, "data": {}, "message": "success" }

// 失败
{ "code": 1, "message": "错误信息" }
```

## 4. 前端页面与交互

### 页面

- **登录页 `/login`** - 用户名 + 密码表单，底部有"去注册"链接
- **注册页 `/register`** - 用户名 + 密码 + 确认密码表单，底部有"去登录"链接
- **Todo 列表页 `/`（首页）** - 需登录才能访问

### Todo 列表页交互

- 顶部：输入框 + 添加按钮，回车也可添加
- 列表：每项显示勾选框（完成/未完成）、标题、删除按钮
- 双击标题可编辑
- 顶部导航栏显示用户名 + 退出登录按钮
- 支持筛选：全部 / 未完成 / 已完成（前端过滤）

### 路由守卫

- 未登录访问首页 -> 重定向到 `/login`
- 已登录访问登录/注册页 -> 重定向到 `/`

## 5. 错误处理

- 前端 Axios 拦截器：401 时清除 token 并跳转登录页，其他错误用 ElMessage.error() 提示
- 注册校验：用户名是否已存在，密码长度至少 6 位

## 6. 技术栈汇总

| 层 | 技术 |
|----|------|
| 前端框架 | Vue 3 |
| 构建工具 | Vite |
| UI 组件库 | Element Plus |
| 状态管理 | Pinia |
| HTTP 客户端 | Axios |
| 后端框架 | Egg.js |
| ORM | egg-sequelize |
| 数据库 | MySQL |
| 认证 | JWT (egg-jwt) |
| 密码加密 | bcryptjs |
