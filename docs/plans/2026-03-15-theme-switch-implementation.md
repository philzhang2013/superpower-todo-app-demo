# 主题切换功能实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 在 Todo 应用中实现亮色/暗色主题切换，用户偏好持久化到后端数据库，支持跨设备同步。

**架构：** User 模型新增 theme 字段，登录时返回主题偏好。前端通过 CSS 变量 + `html[data-theme]` 属性实现明暗切换，切换时异步同步到后端。

**技术栈：** CSS 变量、Egg.js Sequelize 模型修改、Vue 3 响应式状态

**测试框架：** 后端 egg-mock + assert（Egg.js 内置），前端 vitest + @vue/test-utils（需安装）

**设计文档：** `docs/plans/2026-03-15-theme-switch-design.md`

**工作目录：** `.worktrees/feature-theme-switch/`

---

## 任务 1：搭建测试基础设施

**文件：**
- 创建：`server/test/app/controller/user.test.js`（空文件，后续任务填充）
- 修改：`client/package.json`（安装 vitest）
- 创建：`client/src/stores/__tests__/user.test.js`（空文件，后续任务填充）

**步骤 1：创建后端测试目录**

```bash
mkdir -p server/test/app/controller
```

**步骤 2：安装前端测试框架**

```bash
cd client && npm install -D vitest @vue/test-utils jsdom
```

**步骤 3：在 `client/package.json` 的 scripts 中添加 test 命令**

在 `"preview": "vite preview"` 后添加：

```json
"test": "vitest run",
"test:watch": "vitest"
```

**步骤 4：在 `client/vite.config.js` 中添加 vitest 配置**

在 `export default defineConfig` 中添加 test 配置：

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

**步骤 5：提交**

```bash
git add server/test/ client/package.json client/package-lock.json client/vite.config.js
git commit -m "chore: 搭建前后端测试基础设施"
```

---

## 任务 2：后端 — User 模型新增 theme 字段（TDD）

**文件：**
- 创建：`server/test/app/controller/user.test.js`
- 修改：`server/app/model/user.js`

**步骤 1：编写失败测试（RED）**

创建 `server/test/app/controller/user.test.js`：

```js
'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('User Theme', () => {
  let token;

  before(async () => {
    // 确保测试用户存在
    await app.httpRequest()
      .post('/api/user/register')
      .send({ username: 'themetest', password: '123456' })
      .expect(200);

    const res = await app.httpRequest()
      .post('/api/user/login')
      .send({ username: 'themetest', password: '123456' })
      .expect(200);

    token = res.body.data.token;
  });

  it('登录应返回 theme 字段', async () => {
    const res = await app.httpRequest()
      .post('/api/user/login')
      .send({ username: 'themetest', password: '123456' })
      .expect(200);

    assert(res.body.code === 0);
    assert(res.body.data.user.theme === 'light');
  });
});
```

**步骤 2：运行测试，确认失败**

```bash
cd server && npx egg-bin test
```

预期：FAIL — `res.body.data.user.theme` 为 undefined（因为 User 模型还没有 theme 字段）

**步骤 3：最小实现（GREEN）**

修改 `server/app/model/user.js`，在字段定义中 `password` 之后添加：

```js
theme: { type: STRING(10), allowNull: false, defaultValue: 'light' },
```

修改 `server/app/service/user.js`：

- `register` 方法返回值改为：
  ```js
  return { success: true, user: { id: user.id, username: user.username, theme: user.theme } };
  ```

- `login` 方法返回值改为：
  ```js
  return { success: true, token, user: { id: user.id, username: user.username, theme: user.theme } };
  ```

**步骤 4：运行测试，确认通过**

```bash
cd server && npx egg-bin test
```

预期：PASS — `登录应返回 theme 字段`

**步骤 5：提交**

```bash
git add server/app/model/user.js server/app/service/user.js server/test/
git commit -m "feat: User 模型新增 theme 字段，登录返回 theme"
```

---

## 任务 3：后端 — 新增更新 theme 接口（TDD）

**文件：**
- 修改：`server/test/app/controller/user.test.js`
- 修改：`server/app/service/user.js`
- 修改：`server/app/controller/user.js`
- 修改：`server/app/router.js`

**步骤 1：编写失败测试（RED）**

在 `server/test/app/controller/user.test.js` 的 `describe` 中追加测试用例：

```js
  it('应能更新主题为 dark', async () => {
    const res = await app.httpRequest()
      .put('/api/user/theme')
      .set('Authorization', `Bearer ${token}`)
      .send({ theme: 'dark' })
      .expect(200);

    assert(res.body.code === 0);
    assert(res.body.message === '主题更新成功');
  });

  it('更新后登录应返回 dark', async () => {
    const res = await app.httpRequest()
      .post('/api/user/login')
      .send({ username: 'themetest', password: '123456' })
      .expect(200);

    assert(res.body.data.user.theme === 'dark');
  });

  it('无效主题值应返回错误', async () => {
    const res = await app.httpRequest()
      .put('/api/user/theme')
      .set('Authorization', `Bearer ${token}`)
      .send({ theme: 'invalid' })
      .expect(200);

    assert(res.body.code === 1);
    assert(res.body.message === '无效的主题值');
  });

  it('未登录应返回 401', async () => {
    await app.httpRequest()
      .put('/api/user/theme')
      .send({ theme: 'dark' })
      .expect(401);
  });
```

**步骤 2：运行测试，确认失败**

```bash
cd server && npx egg-bin test
```

预期：FAIL — 路由 PUT /api/user/theme 不存在，返回 404

**步骤 3：最小实现（GREEN）**

在 `server/app/service/user.js` 的 `UserService` 类中新增方法：

```js
async updateTheme(userId, theme) {
  const user = await this.ctx.model.User.findByPk(userId);
  if (!user) return false;
  await user.update({ theme });
  return true;
}
```

在 `server/app/controller/user.js` 的 `UserController` 类中新增方法：

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

在 `server/app/router.js` 中 Todo 路由之前添加：

```js
router.put('/api/user/theme', auth, controller.user.updateTheme);
```

**步骤 4：运行测试，确认全部通过**

```bash
cd server && npx egg-bin test
```

预期：PASS — 4 个测试全部通过

**步骤 5：提交**

```bash
git add server/test/ server/app/service/user.js server/app/controller/user.js server/app/router.js
git commit -m "feat: 新增更新主题接口 PUT /api/user/theme"
```

---

## ✅ Code Review 检查点 1（后端完成）

暂停执行，使用 `code-reviewer` agent 审查以下文件：
- `server/app/model/user.js`
- `server/app/service/user.js`
- `server/app/controller/user.js`
- `server/app/router.js`
- `server/test/app/controller/user.test.js`

审查要点：
- 输入验证是否完整
- 测试覆盖率是否足够
- 安全性（鉴权是否正确）

处理审查反馈后再继续。

---

## 任务 4：前端 — 创建 CSS 主题变量

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

## 任务 5：前端 — User Store 增加主题管理（TDD）

**文件：**
- 创建：`client/src/stores/__tests__/user.test.js`
- 修改：`client/src/stores/user.js`

**步骤 1：编写失败测试（RED）**

创建 `client/src/stores/__tests__/user.test.js`：

```js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUserStore } from '../user';

// mock request
vi.mock('../../utils/request', () => ({
  default: {
    post: vi.fn(),
    put: vi.fn().mockResolvedValue({}),
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

// mock router
vi.mock('../../router', () => ({
  default: { push: vi.fn() },
}));

describe('User Store - Theme', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('默认主题应为 light', () => {
    const store = useUserStore();
    expect(store.theme).toBe('light');
  });

  it('applyTheme 应设置 data-theme 属性和 localStorage', () => {
    const store = useUserStore();
    store.applyTheme('dark');
    expect(store.theme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('toggleTheme 应在 light/dark 之间切换', async () => {
    const store = useUserStore();
    expect(store.theme).toBe('light');
    await store.toggleTheme();
    expect(store.theme).toBe('dark');
    await store.toggleTheme();
    expect(store.theme).toBe('light');
  });

  it('logout 应重置主题为 light', () => {
    const store = useUserStore();
    store.applyTheme('dark');
    store.logout();
    expect(store.theme).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
```

**步骤 2：运行测试，确认失败**

```bash
cd client && npx vitest run
```

预期：FAIL — `store.theme` 不存在（User Store 还没有 theme 相关代码）

**步骤 3：最小实现（GREEN）**

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
    request.put('/api/user/theme', { theme: newTheme }).catch(() => {});
  }

  async function login(username, password) {
    const res = await request.post('/api/user/login', { username, password });
    token.value = res.data.token;
    user.value = res.data.user;
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
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
    applyTheme('light');
  }

  applyTheme(theme.value);

  return { token, user, theme, isLoggedIn, applyTheme, toggleTheme, login, register, logout };
});
```

**步骤 4：运行测试，确认通过**

```bash
cd client && npx vitest run
```

预期：PASS — 4 个测试全部通过

**步骤 5：提交**

```bash
git add client/src/stores/__tests__/user.test.js client/src/stores/user.js
git commit -m "feat: User Store 增加主题状态管理"
```

---

## 任务 6：前端 — 三个页面适配 CSS 变量 + 导航栏添加切换按钮

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

## ✅ Code Review 检查点 2（前端完成）

暂停执行，使用 `code-reviewer` agent 审查以下文件：
- `client/src/styles/theme.css`
- `client/src/stores/user.js`
- `client/src/stores/__tests__/user.test.js`
- `client/src/views/TodoList.vue`
- `client/src/views/Login.vue`
- `client/src/views/Register.vue`

审查要点：
- CSS 变量是否有遗漏的硬编码颜色
- 暗色主题下 Element Plus 组件样式是否协调
- 测试覆盖率是否足够

处理审查反馈后再继续。

---

## 任务 7：全量测试 + 端到端验证

**步骤 1：运行全部后端测试**

```bash
cd server && npx egg-bin test
```

预期：所有测试通过

**步骤 2：运行全部前端测试**

```bash
cd client && npx vitest run
```

预期：所有测试通过

**步骤 3：端到端手动验证**

同时启动前后端：

```bash
# 终端 1
cd server && npx egg-bin dev --port=7001

# 终端 2
cd client && npm run dev
```

验证流程：

1. 访问 http://localhost:5173 → 登录页，亮色主题
2. 登录 → 进入 Todo 列表页，导航栏有 🌙 图标
3. 点击 🌙 → 页面切换为暗色主题，图标变为 ☀️
4. 刷新页面 → 暗色主题保持（localStorage）
5. 退出登录 → 回到亮色主题
6. 重新登录 → 恢复暗色主题（从后端读取）
7. 添加/编辑/删除 Todo → 暗色主题下功能正常

**步骤 4：提交（如有修复）**

```bash
git add -A
git commit -m "fix: 主题切换功能修复"
```
