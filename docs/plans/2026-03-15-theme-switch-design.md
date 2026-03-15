# 主题切换功能设计文档

## 1. 需求

在 Todo 列表页导航栏添加亮色/暗色模式切换按钮，用户的主题偏好存储到后端数据库，实现跨设备同步。

## 2. 整体方案

- User 表新增 `theme` 字段（`'light'` 或 `'dark'`，默认 `'light'`）
- 登录接口返回用户 theme 偏好，前端据此初始化主题
- 导航栏添加太阳/月亮图标按钮，点击切换主题
- 切换时同时更新：页面样式（CSS 变量）+ localStorage（即时生效）+ 后端接口（持久化）
- 通过给 `<html>` 标签添加 `data-theme="dark"` 属性，配合 CSS 变量实现明暗切换

## 3. 涉及修改的文件

```
后端：
  server/app/model/user.js          # User 模型加 theme 字段
  server/app/controller/user.js     # 登录返回 theme，新增更新 theme 接口
  server/app/service/user.js        # 更新 theme 业务逻辑
  server/app/router.js              # 新增 PUT /api/user/theme 路由

前端：
  client/src/stores/user.js         # 增加 theme 状态和切换方法
  client/src/views/TodoList.vue     # 导航栏加切换按钮
  client/src/App.vue                # 全局主题初始化
  client/src/styles/theme.css       # 新增：CSS 变量定义（亮色/暗色）
  client/src/main.js                # 引入 theme.css
```

## 4. 后端改动

### User 表新增字段

| 字段 | 类型 | 说明 |
|------|------|------|
| theme | ENUM('light', 'dark'), 默认 'light' | 用户主题偏好 |

### 新增 API

- `PUT /api/user/theme` — 更新主题偏好（需鉴权），请求体：`{ "theme": "dark" }`

### 登录接口调整

- `POST /api/user/login` 返回的 `user` 对象中增加 `theme` 字段

### 数据流

```
用户点击切换 → 前端立即切换样式 + 更新 localStorage
             → 异步调用 PUT /api/user/theme 持久化到数据库
             → 下次登录时从 user.theme 恢复
```

## 5. 前端 CSS 变量方案

通过 `html[data-theme="dark"]` 覆盖 CSS 变量：

```css
:root {
  --bg-page: #f0f2f5;
  --bg-card: #ffffff;
  --bg-navbar: #409eff;
  --text-primary: #303133;
  --text-secondary: #909399;
  --border-color: #e4e7ed;
}

html[data-theme="dark"] {
  --bg-page: #1a1a2e;
  --bg-card: #16213e;
  --bg-navbar: #0f3460;
  --text-primary: #e4e7ed;
  --text-secondary: #a0a3a8;
  --border-color: #2a2a4a;
}
```

三个页面（Login、Register、TodoList）的 CSS 改用这些变量替代硬编码颜色值。
