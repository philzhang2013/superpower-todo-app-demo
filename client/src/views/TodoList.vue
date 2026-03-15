<template>
  <div class="todo-page">
    <!-- 导航栏 -->
    <div class="navbar">
      <div class="logo">Todo App</div>
      <div class="user-info">
        <span>Hi, {{ userStore.user?.username }}</span>
        <el-button size="small" circle @click="userStore.toggleTheme">
          {{ userStore.theme === 'light' ? '🌙' : '☀️' }}
        </el-button>
        <el-button size="small" @click="handleLogout">退出登录</el-button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="todo-container">
      <!-- 添加输入 -->
      <div class="todo-input-row">
        <el-input
          v-model="newTitle"
          placeholder="添加新的待办事项，按回车提交..."
          size="large"
          @keyup.enter="handleAdd"
        />
        <el-button type="primary" size="large" @click="handleAdd">+ 添加</el-button>
      </div>

      <!-- 筛选 Tab -->
      <div class="filter-tabs">
        <div
          v-for="tab in filterTabs"
          :key="tab.value"
          class="filter-tab"
          :class="{ active: currentFilter === tab.value }"
          @click="currentFilter = tab.value"
        >
          {{ tab.label }} ({{ tab.count }})
        </div>
      </div>

      <!-- Todo 列表 -->
      <div v-if="filteredTodos.length === 0" class="empty-tip">
        暂无待办事项
      </div>
      <ul class="todo-list">
        <li v-for="todo in filteredTodos" :key="todo.id" class="todo-item">
          <el-checkbox
            :model-value="todo.completed"
            @change="(val) => handleToggle(todo.id, val)"
          />
          <span
            v-if="editingId !== todo.id"
            class="todo-title"
            :class="{ completed: todo.completed }"
            @dblclick="startEdit(todo)"
          >
            {{ todo.title }}
          </span>
          <el-input
            v-else
            v-model="editTitle"
            size="small"
            class="edit-input"
            @keyup.enter="finishEdit(todo.id)"
            @blur="finishEdit(todo.id)"
          />
          <span class="todo-time">{{ formatDate(todo.created_at) }}</span>
          <el-button
            type="danger"
            text
            size="small"
            @click="handleDelete(todo.id)"
          >
            删除
          </el-button>
        </li>
      </ul>

      <!-- 统计栏 -->
      <div class="stats-bar">
        <span>共 {{ todoStore.todos.length }} 项，已完成 {{ completedCount }} 项</span>
        <span>未完成 {{ todoStore.todos.length - completedCount }} 项</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '../stores/user';
import { useTodoStore } from '../stores/todo';

const router = useRouter();
const userStore = useUserStore();
const todoStore = useTodoStore();

const newTitle = ref('');
const currentFilter = ref('all');
const editingId = ref(null);
const editTitle = ref('');

onMounted(() => {
  todoStore.fetchTodos();
});

const completedCount = computed(() =>
  todoStore.todos.filter((t) => t.completed).length
);

const filteredTodos = computed(() => {
  if (currentFilter.value === 'active') {
    return todoStore.todos.filter((t) => !t.completed);
  }
  if (currentFilter.value === 'completed') {
    return todoStore.todos.filter((t) => t.completed);
  }
  return todoStore.todos;
});

const filterTabs = computed(() => [
  { label: '全部', value: 'all', count: todoStore.todos.length },
  { label: '未完成', value: 'active', count: todoStore.todos.length - completedCount.value },
  { label: '已完成', value: 'completed', count: completedCount.value },
]);

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function handleAdd() {
  const title = newTitle.value.trim();
  if (!title) {
    ElMessage.warning('请输入待办事项');
    return;
  }
  await todoStore.addTodo(title);
  newTitle.value = '';
}

async function handleToggle(id, completed) {
  await todoStore.updateTodo(id, { completed });
}

function startEdit(todo) {
  editingId.value = todo.id;
  editTitle.value = todo.title;
}

async function finishEdit(id) {
  const title = editTitle.value.trim();
  if (title) {
    await todoStore.updateTodo(id, { title });
  }
  editingId.value = null;
}

async function handleDelete(id) {
  try {
    await ElMessageBox.confirm('确定要删除这条待办事项吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await todoStore.deleteTodo(id);
  } catch {
    // 用户取消
  }
}

function handleLogout() {
  userStore.logout();
  router.push('/login');
}
</script>

<style scoped>
.todo-page {
  min-height: 100vh;
  background: var(--bg-page);
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: var(--bg-navbar);
  color: #fff;
}

.logo {
  font-size: 18px;
  font-weight: 600;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.todo-container {
  max-width: 600px;
  margin: 24px auto;
  padding: 24px;
  background: var(--bg-card);
  border-radius: 12px;
  box-shadow: var(--shadow-card);
}

.todo-input-row {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.filter-tabs {
  display: flex;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.filter-tab {
  padding: 8px 18px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.filter-tab.active {
  color: #409eff;
  border-bottom-color: #409eff;
  font-weight: 500;
}

.empty-tip {
  text-align: center;
  padding: 40px 0;
  color: var(--text-muted);
  font-size: 14px;
}

.todo-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.todo-item {
  display: flex;
  align-items: center;
  padding: 12px 8px;
  border-bottom: 1px solid var(--border-light);
  gap: 12px;
}

.todo-item:last-child {
  border-bottom: none;
}

.todo-title {
  flex: 1;
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
}

.todo-title.completed {
  text-decoration: line-through;
  color: var(--text-muted);
}

.edit-input {
  flex: 1;
}

.todo-time {
  font-size: 12px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.stats-bar {
  display: flex;
  justify-content: space-between;
  padding: 12px 8px 0;
  font-size: 12px;
  color: var(--text-secondary);
  border-top: 1px solid var(--border-light);
  margin-top: 8px;
}
</style>
