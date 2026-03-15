import { defineStore } from 'pinia';
import { ref } from 'vue';
import request from '../utils/request';

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '');
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));
  const theme = ref(localStorage.getItem('theme') || 'light');

  const isLoggedIn = () => !!token.value;

  function applyTheme(t) {
    const validTheme = ['light', 'dark'].includes(t) ? t : 'light';
    theme.value = validTheme;
    localStorage.setItem('theme', validTheme);
    document.documentElement.setAttribute('data-theme', validTheme);
  }

  async function toggleTheme() {
    const newTheme = theme.value === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    // 异步保存到后端，不阻塞 UI
    request.put('/api/user/theme', { theme: newTheme }).catch((err) => {
      console.warn('主题同步失败，将在下次操作时重试', err);
    });
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
