# 主题切换功能实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 在 Todo 应用中实现亮色/暗色主题切换，用户偏好持久化到后端数据库，支持跨设备同步。

**架构：** User 模型新增 theme 字段，登录时返回主题偏好。前端通过 CSS 变量 + `html[data-theme]` 属性实现明暗切换，切换时异步同步到后端。

**技术栈：** CSS 变量、Egg.js Sequelize 模型修改、Vue 3 响应式状态

**设计文档：** `docs/plans/2026-03-15-theme-switch-design.md`

**工作目录：** `.worktrees/feature-theme-switch/`

---

## 任务 1：后端 — User 模型新增 theme 字段

**文件：**
- 修改：`server/app/model/user.js`

**步骤 1：修改 User 模型，新增 theme 字段**

在 `server/app/model/user.js` 的字段定义中添加：

```js
theme: { type: STRING(10), allowNull: false, defaultValue: 'light' },
```

完整字段列表变为：id, username, password, theme, created_at, updated_at。

**步骤 2：验证数据库同步**

启动 Egg.js（`app.js` 中的 `model.sync({ alter: true })` 会自动添加字段）：

```bash
cd server && npx egg-bin dev --port=7001
```

然后用 Node.js 验证字段已添加：

```bash
node -e "
const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: 'mysql.lz.jwzh.online', port: 53312,
    user: 'root', password: 'Founder#123', database: 'todo_app',
  });
  const [rows] = await conn.execute('DESCRIBE users');
  console.log(rows.map(r => r.Field).join(', '));
  await conn.end();
})();
"
```

预期输出包含：`id, username, password, theme, created_at, updated_at`

**步骤 3：提交**

```bash
git add server/app/model/user.js
git commit -m "feat: User 模型新增 theme 字段"
```

---

## 任务 2：后端 — 登录接口返回 theme + 新增更新 theme 接口

**文件：**
- 修改：`server/app/service/user.js:15,33`
- 修改：`server/app/controller/user.js`
- 修改：`server/app/router.js`

**步骤 1：修改 UserService，登录返回 theme**

在 `server/app/service/user.js` 中：

- `register` 方法返回值增加 theme：
  ```js
  return { success: true, user: { id: user.id, username: user.username, theme: user.theme } };
  ```

- `login` 方法返回值增加 theme：
  ```js
  return { success: true, token, user: { id: user.id, username: user.username, theme: user.theme } };
  ```

- 新增 `updateTheme` 方法：
  ```js
  async updateTheme(userId, theme) {
    const user = await this.ctx.model.User.findByPk(userId);
    if (!user) return false;
    await user.update({ theme });
    return true;
  }
  ```

**步骤 2：新增 UserController.updateTheme**

在 `server/app/controller/user.js` 中新增方法：

```js
async updateTheme() {
  const { ctx } = this;
  const { theme } = ctx.request.body;

  if (!theme || !['light', 'dark'].includes(theme)) {
    ctx.body = { code: 1, message: '无效的主题值' };
    return;
  }

  const result = await ctx.service.user.updateTheme(ctx.state.user.id, theme);
  if (!result) {
    ctx.body = { code: 1, message: '用户不存在' };
    return;
  }
  ctx.body = { code: 0, message: '主题更新成功' };
}
```

**步骤 3：添加路由**

在 `server/app/router.js` 的 Todo 路由之前添加：

```js
router.put('/api/user/theme', auth, controller.user.updateTheme);
```

**步骤 4：用 curl 测试**

```bash
# 登录，验证返回 theme 字段
curl -s -X POST http://localhost:7001/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456"}'
# 预期：data.user 中包含 "theme":"light"

# 更新主题
TOKEN="从上面获取"
curl -s -X PUT http://localhost:7001/api/user/theme \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"theme":"dark"}'
# 预期：{"code":0,"message":"主题更新成功"}

# 再次登录验证 theme 已更新
curl -s -X POST http://localhost:7001/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456"}'
# 预期：data.user.theme 为 "dark"
```

**步骤 5：提交**

```bash
git add server/app/service/user.js server/app/controller/user.js server/app/router.js
git commit -m "feat: 登录返回 theme 字段，新增更新主题接口"
```

---

## 任务 3：前端 — 创建 CSS 主题变量

**文件：**
- 创建：`client/src/styles/theme.css`
- 修改：`client/src/main.js`

**步骤 1：创建 theme.css**

```css
/* client/src/styles/theme.css */

/* 亮色主题（默认） */
:root {
  --bg-page: #f0f2f5;
  --bg-card: #ffffff;
  --bg-navbar: #409eff;
  --bg-input: #ffffff;
  --text-primary: #303133;
  --text-secondary: #909399;
  --text-muted: #c0c4cc;
  --border-color: #e4e7ed;
  --border-light: #f0f0f0;
  --shadow-card: 0 2px 12px rgba(0, 0, 0, 0.08);
}

/* 暗色主题 */
html[data-theme="dark"] {
  --bg-page: #1a1a2e;
  --bg-card: #16213e;
  --bg-navbar: #0f3460;
  --bg-input: #1a1a3e;
  --text-primary: #e4e7ed;
  --text-secondary: #a0a3a8;
  --text-muted: #606266;
  --border-color: #2a2a4a;
  --border-light: #2a2a4a;
  --shadow-card: 0 2px 12px rgba(0, 0, 0, 0.3);
}
```

**步骤 2：在 main.js 中引入 theme.css**

在 `import 'element-plus/dist/index.css';` 之后添加：

```js
import './styles/theme.css';
```

**步骤 3：提交**

```bash
git add client/src/styles/theme.css client/src/main.js
git commit -m "feat: 创建亮色/暗色 CSS 主题变量"
```

---

## 任务 4：前端 — User Store 增加主题管理

**文件：**
- 修改：`client/src/stores/user.js`

**步骤 1：修改 User Store**

完整替换 `client/src/stores/user.js`：

```js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import request from '../utils/request';

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '');
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));
  const theme = ref(localStorage.getItem('theme') || 'light');

  const isLoggedIn = () => !!token.value;

  function applyTheme(t) {
    theme.value = t;
    localStorage.setItem('theme', t);
    document.documentElement.setAttribute('data-theme', t);
  }

  async function toggleTheme() {
    const newTheme = theme.value === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    // 异步保存到后端，不阻塞 UI
    request.put('/api/user/theme', { theme: newTheme }).catch(() => {});
  }

  async function login(username, password) {
    const res = await request.post('/api/user/login', { username, password });
    token.value = res.data.token;
    user.value = res.data.user;
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    // 登录时从后端恢复主题偏好
    applyTheme(res.data.user.theme || 'light');
  }

  async function register(username, password) {
    await request.post('/api/user/register', { username, password });
  }

  function logout() {
    token.value = '';
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // 登出后恢复亮色主题
    applyTheme('light');
  }

  // 初始化时应用已保存的主题
  applyTheme(theme.value);

  return { token, user, theme, isLoggedIn, applyTheme, toggleTheme, login, register, logout };
});
```

**步骤 2：提交**

```bash
git add client/src/stores/user.js
git commit -m "feat: User Store 增加主题状态管理"
```

---

## 任务 5：前端 — 三个页面适配 CSS 变量 + 导航栏添加切换按钮

**文件：**
- 修改：`client/src/views/TodoList.vue`
- 修改：`client/src/views/Login.vue`
- 修改：`client/src/views/Register.vue`

**步骤 1：修改 TodoList.vue**

在模板的导航栏 `.user-info` 中，退出登录按钮前添加切换按钮：

```html
<el-button size="small" circle @click="userStore.toggleTheme">
  {{ userStore.theme === 'light' ? '🌙' : '☀️' }}
</el-button>
```

将 `<style scoped>` 中所有硬编码颜色替换为 CSS 变量：

| 原值 | 替换为 |
|------|--------|
| `background: #f0f2f5` | `background: var(--bg-page)` |
| `background: #409eff`（navbar） | `background: var(--bg-navbar)` |
| `background: #fff`（card） | `background: var(--bg-card)` |
| `box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08)` | `box-shadow: var(--shadow-card)` |
| `color: #303133` | `color: var(--text-primary)` |
| `color: #909399` | `color: var(--text-secondary)` |
| `color: #c0c4cc` | `color: var(--text-muted)` |
| `border-bottom: 1px solid #e4e7ed` | `border-bottom: 1px solid var(--border-color)` |
| `border-bottom: 1px solid #f0f0f0` | `border-bottom: 1px solid var(--border-light)` |
| `border-top: 1px solid #f0f0f0` | `border-top: 1px solid var(--border-light)` |

**步骤 2：修改 Login.vue 的 `<style scoped>`**

| 原值 | 替换为 |
|------|--------|
| `background: #f0f2f5` | `background: var(--bg-page)` |
| `background: #fff` | `background: var(--bg-card)` |
| `box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08)` | `box-shadow: var(--shadow-card)` |
| `color: #303133` | `color: var(--text-primary)` |
| `color: #909399` | `color: var(--text-secondary)` |

**步骤 3：修改 Register.vue 的 `<style scoped>`（同 Login.vue 的替换规则）**

**步骤 4：构建验证**

```bash
cd client && npx vite build
```

预期：构建成功，无错误

**步骤 5：提交**

```bash
git add client/src/views/TodoList.vue client/src/views/Login.vue client/src/views/Register.vue
git commit -m "feat: 三个页面适配 CSS 变量，导航栏添加主题切换按钮"
```

---

## 任务 6：端到端验证 + 最终提交

**步骤 1：启动前后端**

```bash
# 终端 1
cd server && npx egg-bin dev --port=7001

# 终端 2
cd client && npm run dev
```

**步骤 2：完整验证流程**

1. 访问 http://localhost:5173 → 登录页，亮色主题
2. 登录 → 进入 Todo 列表页，导航栏有 🌙 图标
3. 点击 🌙 → 页面切换为暗色主题，图标变为 ☀️
4. 刷新页面 → 暗色主题保持（localStorage）
5. 退出登录 → 回到亮色主题
6. 重新登录 → 恢复暗色主题（从后端读取）
7. 用另一个浏览器登录同一账号 → 也是暗色主题（跨设备同步）

**步骤 3：提交（如果步骤 2 中有修复）**

```bash
git add -A
git commit -m "fix: 主题切换功能修复"
```
