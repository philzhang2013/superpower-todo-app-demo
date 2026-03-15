# Todo 应用实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 构建一个带用户认证的网页版 Todo 管理应用，使用 Vue 3 + Egg.js + MySQL。

**架构：** 前端（Vue 3 + Vite + Element Plus + Pinia）通过 Axios 与后端（Egg.js REST API）通信。JWT 认证。MySQL 通过 Sequelize ORM 操作。

**技术栈：** Vue 3, Vite, Element Plus, Pinia, Vue Router, Axios, Egg.js, egg-jwt, egg-sequelize, MySQL, bcryptjs

**设计文档：**
- 设计方案：`docs/plans/2026-03-15-todo-app-design.md`
- UI 草图：`docs/plans/ui-wireframe.html`

---

## 第一阶段：后端搭建

### 任务 1：初始化 Egg.js 项目

**文件：**
- 创建：`server/` 目录（Egg.js 脚手架）

**步骤 1：初始化 Egg.js 项目**

```bash
mkdir server && cd server
npm init egg --type=simple
npm install
```

**步骤 2：安装依赖**

```bash
cd server
npm install egg-jwt egg-sequelize mysql2 bcryptjs egg-cors
```

**步骤 3：验证 Egg.js 能正常启动**

运行：`cd server && npm run dev`
预期：服务在 7001 端口启动，访问 http://localhost:7001 显示 Egg.js 欢迎页

**步骤 4：提交**

```bash
git add server/
git commit -m "feat: 初始化 Egg.js 后端项目及依赖安装"
```

---

### 任务 2：配置 Sequelize + MySQL + CORS + JWT

**文件：**
- 修改：`server/config/plugin.js`
- 修改：`server/config/config.default.js`

**步骤 1：在 `server/config/plugin.js` 中启用插件**

```js
exports.sequelize = {
  enable: true,
  package: 'egg-sequelize',
};

exports.jwt = {
  enable: true,
  package: 'egg-jwt',
};

exports.cors = {
  enable: true,
  package: 'egg-cors',
};
```

**步骤 2：在 `server/config/config.default.js` 中添加配置**

```js
// MySQL 数据库配置
config.sequelize = {
  dialect: 'mysql',
  host: 'mysql.lz.jwzh.online',
  port: 53312,
  database: 'todo_app',
  username: 'root',
  password: 'Founder#123',
  timezone: '+08:00',
  define: {
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
};

// JWT 配置
config.jwt = {
  secret: 'todo-app-jwt-secret-key-2026',
};

// 跨域配置
config.cors = {
  origin: 'http://localhost:5173',
  allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH',
  credentials: true,
};

// 关闭 CSRF（前后端分离不需要）
config.security = {
  csrf: {
    enable: false,
  },
};
```

**步骤 3：创建 MySQL 数据库**

```bash
mysql -h mysql.lz.jwzh.online -P 53312 -u root -p'Founder#123' -e "CREATE DATABASE IF NOT EXISTS todo_app DEFAULT CHARACTER SET utf8mb4;"
```

**步骤 4：验证 Egg.js 配置无误能正常启动**

运行：`cd server && npm run dev`
预期：服务正常启动，无配置报错

**步骤 5：提交**

```bash
git add server/config/
git commit -m "feat: 配置 Sequelize、JWT、CORS"
```

---

### 任务 3：创建 User 模型

**文件：**
- 创建：`server/app/model/user.js`

**步骤 1：创建 User 模型**

```js
// server/app/model/user.js
'use strict';

module.exports = (app) => {
  const { STRING, INTEGER, DATE } = app.Sequelize;

  const User = app.model.define('user', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: STRING(50), allowNull: false, unique: true },
    password: { type: STRING(255), allowNull: false },
    created_at: DATE,
    updated_at: DATE,
  });

  User.associate = function () {
    app.model.User.hasMany(app.model.Todo, { as: 'todos', foreignKey: 'user_id' });
  };

  return User;
};
```

**步骤 2：提交**

```bash
git add server/app/model/user.js
git commit -m "feat: 添加 User 模型"
```

---

### 任务 4：创建 Todo 模型并同步数据库

**文件：**
- 创建：`server/app/model/todo.js`
- 创建：`server/app.js`

**步骤 1：创建 Todo 模型**

```js
// server/app/model/todo.js
'use strict';

module.exports = (app) => {
  const { STRING, INTEGER, BOOLEAN, DATE } = app.Sequelize;

  const Todo = app.model.define('todo', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: INTEGER, allowNull: false },
    title: { type: STRING(255), allowNull: false },
    completed: { type: BOOLEAN, defaultValue: false },
    created_at: DATE,
    updated_at: DATE,
  });

  Todo.associate = function () {
    app.model.Todo.belongsTo(app.model.User, { as: 'user', foreignKey: 'user_id' });
  };

  return Todo;
};
```

**步骤 2：添加数据库自动同步**

创建 `server/app.js`：

```js
// server/app.js
'use strict';

module.exports = (app) => {
  app.beforeStart(async () => {
    await app.model.sync({ alter: true });
  });
};
```

**步骤 3：验证数据表已创建**

运行：`cd server && npm run dev`
然后检查：`mysql -h mysql.lz.jwzh.online -P 53312 -u root -p'Founder#123' -e "USE todo_app; SHOW TABLES;"`
预期：`users` 和 `todos` 表已存在

**步骤 4：提交**

```bash
git add server/app/model/todo.js server/app.js
git commit -m "feat: 添加 Todo 模型并同步数据库"
```

---

### 任务 5：创建 JWT 鉴权中间件

**文件：**
- 创建：`server/app/middleware/auth.js`

**步骤 1：创建鉴权中间件**

```js
// server/app/middleware/auth.js
'use strict';

module.exports = () => {
  return async function auth(ctx, next) {
    const token = ctx.request.header.authorization;
    if (!token) {
      ctx.status = 401;
      ctx.body = { code: 1, message: '未登录，请先登录' };
      return;
    }

    try {
      const tokenStr = token.replace('Bearer ', '');
      const decoded = ctx.app.jwt.verify(tokenStr, ctx.app.config.jwt.secret);
      ctx.state.user = decoded;
      await next();
    } catch (err) {
      ctx.status = 401;
      ctx.body = { code: 1, message: 'Token 已过期，请重新登录' };
    }
  };
};
```

**步骤 2：提交**

```bash
git add server/app/middleware/auth.js
git commit -m "feat: 添加 JWT 鉴权中间件"
```

---

### 任务 6：用户注册与登录接口

**文件：**
- 创建：`server/app/controller/user.js`
- 创建：`server/app/service/user.js`
- 修改：`server/app/router.js`

**步骤 1：创建用户 Service**

```js
// server/app/service/user.js
'use strict';

const { Service } = require('egg');
const bcrypt = require('bcryptjs');

class UserService extends Service {
  async register(username, password) {
    const { ctx } = this;
    const existing = await ctx.model.User.findOne({ where: { username } });
    if (existing) {
      return { success: false, message: '用户名已存在' };
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = await ctx.model.User.create({ username, password: hashedPassword });
    return { success: true, user: { id: user.id, username: user.username } };
  }

  async login(username, password) {
    const { ctx, app } = this;
    const user = await ctx.model.User.findOne({ where: { username } });
    if (!user) {
      return { success: false, message: '用户名或密码错误' };
    }
    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      return { success: false, message: '用户名或密码错误' };
    }
    const token = app.jwt.sign(
      { id: user.id, username: user.username },
      app.config.jwt.secret,
      { expiresIn: '7d' }
    );
    return { success: true, token, user: { id: user.id, username: user.username } };
  }
}

module.exports = UserService;
```

**步骤 2：创建用户 Controller**

```js
// server/app/controller/user.js
'use strict';

const { Controller } = require('egg');

class UserController extends Controller {
  async register() {
    const { ctx } = this;
    const { username, password } = ctx.request.body;

    if (!username || !password) {
      ctx.body = { code: 1, message: '用户名和密码不能为空' };
      return;
    }
    if (password.length < 6) {
      ctx.body = { code: 1, message: '密码长度至少6位' };
      return;
    }

    const result = await ctx.service.user.register(username, password);
    if (!result.success) {
      ctx.body = { code: 1, message: result.message };
      return;
    }
    ctx.body = { code: 0, data: result.user, message: '注册成功' };
  }

  async login() {
    const { ctx } = this;
    const { username, password } = ctx.request.body;

    if (!username || !password) {
      ctx.body = { code: 1, message: '用户名和密码不能为空' };
      return;
    }

    const result = await ctx.service.user.login(username, password);
    if (!result.success) {
      ctx.body = { code: 1, message: result.message };
      return;
    }
    ctx.body = { code: 0, data: { token: result.token, user: result.user }, message: '登录成功' };
  }
}

module.exports = UserController;
```

**步骤 3：配置路由 `server/app/router.js`**

```js
'use strict';

module.exports = (app) => {
  const { router, controller } = app;
  const auth = app.middleware.auth();

  // 用户接口
  router.post('/api/user/register', controller.user.register);
  router.post('/api/user/login', controller.user.login);

  // Todo 接口（需鉴权）
  router.get('/api/todos', auth, controller.todo.index);
  router.post('/api/todos', auth, controller.todo.create);
  router.put('/api/todos/:id', auth, controller.todo.update);
  router.delete('/api/todos/:id', auth, controller.todo.destroy);
};
```

**步骤 4：用 curl 测试**

```bash
# 注册
curl -X POST http://localhost:7001/api/user/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456"}'
# 预期：{"code":0,"data":{"id":1,"username":"testuser"},"message":"注册成功"}

# 登录
curl -X POST http://localhost:7001/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456"}'
# 预期：{"code":0,"data":{"token":"eyJ...","user":{...}},"message":"登录成功"}
```

**步骤 5：提交**

```bash
git add server/app/controller/user.js server/app/service/user.js server/app/router.js
git commit -m "feat: 添加用户注册与登录接口"
```

---

### 任务 7：Todo 增删改查接口

**文件：**
- 创建：`server/app/controller/todo.js`
- 创建：`server/app/service/todo.js`

**步骤 1：创建 Todo Service**

```js
// server/app/service/todo.js
'use strict';

const { Service } = require('egg');

class TodoService extends Service {
  async list(userId) {
    return await this.ctx.model.Todo.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
    });
  }

  async create(userId, title) {
    return await this.ctx.model.Todo.create({ user_id: userId, title });
  }

  async update(id, userId, data) {
    const todo = await this.ctx.model.Todo.findOne({ where: { id, user_id: userId } });
    if (!todo) return null;
    return await todo.update(data);
  }

  async destroy(id, userId) {
    const todo = await this.ctx.model.Todo.findOne({ where: { id, user_id: userId } });
    if (!todo) return false;
    await todo.destroy();
    return true;
  }
}

module.exports = TodoService;
```

**步骤 2：创建 Todo Controller**

```js
// server/app/controller/todo.js
'use strict';

const { Controller } = require('egg');

class TodoController extends Controller {
  async index() {
    const { ctx } = this;
    const todos = await ctx.service.todo.list(ctx.state.user.id);
    ctx.body = { code: 0, data: todos, message: 'success' };
  }

  async create() {
    const { ctx } = this;
    const { title } = ctx.request.body;
    if (!title) {
      ctx.body = { code: 1, message: '标题不能为空' };
      return;
    }
    const todo = await ctx.service.todo.create(ctx.state.user.id, title);
    ctx.body = { code: 0, data: todo, message: '创建成功' };
  }

  async update() {
    const { ctx } = this;
    const { id } = ctx.params;
    const { title, completed } = ctx.request.body;
    const todo = await ctx.service.todo.update(id, ctx.state.user.id, { title, completed });
    if (!todo) {
      ctx.body = { code: 1, message: 'Todo 不存在' };
      return;
    }
    ctx.body = { code: 0, data: todo, message: '更新成功' };
  }

  async destroy() {
    const { ctx } = this;
    const { id } = ctx.params;
    const result = await ctx.service.todo.destroy(id, ctx.state.user.id);
    if (!result) {
      ctx.body = { code: 1, message: 'Todo 不存在' };
      return;
    }
    ctx.body = { code: 0, message: '删除成功' };
  }
}

module.exports = TodoController;
```

**步骤 3：用 curl 测试**

```bash
# 先从登录接口获取 token
TOKEN="eyJ..."

# 创建 Todo
curl -X POST http://localhost:7001/api/todos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"学习 Vue 3"}'

# 获取 Todo 列表
curl http://localhost:7001/api/todos \
  -H "Authorization: Bearer $TOKEN"

# 更新 Todo（标记完成）
curl -X PUT http://localhost:7001/api/todos/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"completed":true}'

# 删除 Todo
curl -X DELETE http://localhost:7001/api/todos/1 \
  -H "Authorization: Bearer $TOKEN"
```

**步骤 4：提交**

```bash
git add server/app/controller/todo.js server/app/service/todo.js
git commit -m "feat: 添加 Todo 增删改查接口"
```

---

## 第二阶段：前端搭建

### 任务 8：初始化 Vue 3 项目

**文件：**
- 创建：`client/` 目录（Vue 3 脚手架）

**步骤 1：创建 Vue 3 项目**

```bash
npm create vite@latest client -- --template vue
cd client
npm install
npm install element-plus vue-router@4 pinia axios
```

**步骤 2：验证前端开发服务器正常启动**

运行：`cd client && npm run dev`
预期：开发服务器在 http://localhost:5173 启动

**步骤 3：提交**

```bash
git add client/
git commit -m "feat: 初始化 Vue 3 前端项目及依赖安装"
```

---

### 任务 9：配置 Axios、Pinia Store 和 Vue Router

**文件：**
- 创建：`client/src/utils/request.js`（Axios 实例 + JWT 拦截器）
- 创建：`client/src/stores/user.js`（用户状态管理）
- 创建：`client/src/stores/todo.js`（Todo 状态管理）
- 创建：`client/src/router/index.js`（路由配置 + 守卫）
- 修改：`client/src/main.js`（注册插件）

**步骤 1：创建 Axios 实例（含请求/响应拦截器）**

```js
// client/src/utils/request.js
import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '../router';

const request = axios.create({
  baseURL: 'http://localhost:7001',
  timeout: 5000,
});

// 请求拦截器：自动携带 JWT Token
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：统一错误处理
request.interceptors.response.use(
  (response) => {
    const { data } = response;
    if (data.code !== 0) {
      ElMessage.error(data.message || '请求失败');
      return Promise.reject(new Error(data.message));
    }
    return data;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
      ElMessage.error('登录已过期，请重新登录');
    } else {
      ElMessage.error('网络错误，请稍后重试');
    }
    return Promise.reject(error);
  }
);

export default request;
```

**步骤 2：创建用户 Store**

```js
// client/src/stores/user.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import request from '../utils/request';

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '');
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));

  const isLoggedIn = () => !!token.value;

  async function login(username, password) {
    const res = await request.post('/api/user/login', { username, password });
    token.value = res.data.token;
    user.value = res.data.user;
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
  }

  async function register(username, password) {
    await request.post('/api/user/register', { username, password });
  }

  function logout() {
    token.value = '';
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  return { token, user, isLoggedIn, login, register, logout };
});
```

**步骤 3：创建 Todo Store**

```js
// client/src/stores/todo.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import request from '../utils/request';

export const useTodoStore = defineStore('todo', () => {
  const todos = ref([]);

  async function fetchTodos() {
    const res = await request.get('/api/todos');
    todos.value = res.data;
  }

  async function addTodo(title) {
    await request.post('/api/todos', { title });
    await fetchTodos();
  }

  async function updateTodo(id, data) {
    await request.put(`/api/todos/${id}`, data);
    await fetchTodos();
  }

  async function deleteTodo(id) {
    await request.delete(`/api/todos/${id}`);
    await fetchTodos();
  }

  return { todos, fetchTodos, addTodo, updateTodo, deleteTodo };
});
```

**步骤 4：创建路由配置（含登录守卫）**

```js
// client/src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/', name: 'Home', component: () => import('../views/TodoList.vue') },
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue') },
  { path: '/register', name: 'Register', component: () => import('../views/Register.vue') },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  if (!token && to.path !== '/login' && to.path !== '/register') {
    next('/login');  // 未登录 → 跳转登录页
  } else if (token && (to.path === '/login' || to.path === '/register')) {
    next('/');  // 已登录 → 跳转首页
  } else {
    next();
  }
});

export default router;
```

**步骤 5：更新 `client/src/main.js`（注册所有插件）**

```js
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';
import router from './router';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(ElementPlus);
app.mount('#app');
```

**步骤 6：提交**

```bash
git add client/src/utils/ client/src/stores/ client/src/router/ client/src/main.js
git commit -m "feat: 配置 Axios、Pinia Store 和 Vue Router"
```

---

### 任务 10：登录页

**文件：**
- 创建：`client/src/views/Login.vue`

**步骤 1：创建登录页**

实现登录表单，匹配 UI 草图：用户名 + 密码输入框、登录按钮、底部"立即注册"链接。使用 Element Plus 的 `el-form`、`el-input`、`el-button` 组件。提交时调用 `useUserStore().login()`，成功后跳转到 `/`。

参考：`docs/plans/ui-wireframe.html`（登录页部分）

**步骤 2：浏览器验证**

访问：http://localhost:5173/login
预期：登录表单正常渲染，可输入内容，"立即注册"链接可跳转到 /register

**步骤 3：提交**

```bash
git add client/src/views/Login.vue
git commit -m "feat: 添加登录页"
```

---

### 任务 11：注册页

**文件：**
- 创建：`client/src/views/Register.vue`

**步骤 1：创建注册页**

实现注册表单：用户名 + 密码 + 确认密码输入框、注册按钮、底部"去登录"链接。验证密码长度 >= 6 且两次密码一致。提交时调用 `useUserStore().register()`，成功后提示并跳转到 `/login`。

参考：`docs/plans/ui-wireframe.html`（注册页部分）

**步骤 2：浏览器验证**

访问：http://localhost:5173/register
预期：注册表单正常渲染，表单验证生效

**步骤 3：提交**

```bash
git add client/src/views/Register.vue
git commit -m "feat: 添加注册页"
```

---

### 任务 12：Todo 列表主页

**文件：**
- 创建：`client/src/views/TodoList.vue`
- 修改：`client/src/App.vue`

**步骤 1：创建 Todo 列表页**

实现 Todo 主页，匹配 UI 草图：
- 导航栏：应用标题、用户名显示、退出登录按钮
- 输入区：文本输入框 + 添加按钮（回车也可提交）
- 筛选 Tab：全部 / 未完成 / 已完成（前端过滤）
- Todo 列表：勾选框（切换完成状态）、标题（双击编辑）、日期、删除按钮（用 ElMessageBox.confirm 二次确认）
- 底部统计栏：总数、已完成数

使用 `useTodoStore()` 进行所有数据操作。组件挂载时调用 `fetchTodos()`。

参考：`docs/plans/ui-wireframe.html`（Todo 列表部分）

**步骤 2：更新 `client/src/App.vue`**

替换默认内容为路由出口：

```vue
<template>
  <router-view />
</template>
```

**步骤 3：完整流程验证**

1. 访问 http://localhost:5173 → 重定向到 /login
2. 点击"立即注册" → 跳转到 /register
3. 注册新用户 → 成功提示，跳转到 /login
4. 登录 → 跳转到首页 /
5. 添加 Todo → 列表中出现新项
6. 勾选完成 → 勾选框状态更新
7. 双击标题 → 进入行内编辑模式
8. 删除 → 弹出确认对话框，确认后删除
9. 筛选 Tab → 过滤正常工作
10. 退出登录 → 跳转到 /login

**步骤 4：提交**

```bash
git add client/src/views/TodoList.vue client/src/App.vue
git commit -m "feat: 添加 Todo 列表主页（完整增删改查）"
```

---

### 任务 13：清理与最终提交

**步骤 1：删除 Vite/Vue 脚手架默认文件**

删除未使用的默认文件：
- `client/src/components/HelloWorld.vue`
- `client/src/assets/vue.svg`
- `client/public/vite.svg`
- `client/src/style.css`

**步骤 2：更新项目 README**

更新 `README.md`，包含：
- 项目简介
- 技术栈
- 后端启动方式（`cd server && npm run dev`）
- 前端启动方式（`cd client && npm run dev`）
- 默认端口：后端 7001，前端 5173

**步骤 3：最终验证**

同时启动前后端服务，验证所有功能端到端正常工作。

**步骤 4：提交**

```bash
git add -A
git commit -m "chore: 清理脚手架文件并更新 README"
```
