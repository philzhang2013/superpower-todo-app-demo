import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUserStore } from '../user';

// Mock request module
vi.mock('../../utils/request', () => ({
  default: {
    post: vi.fn(),
    put: vi.fn().mockResolvedValue({}),
  },
}));

import request from '../../utils/request';

describe('User Store - Theme', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  describe('初始化', () => {
    it('默认主题应为 light', () => {
      const store = useUserStore();
      expect(store.theme).toBe('light');
    });

    it('应从 localStorage 恢复主题', () => {
      localStorage.setItem('theme', 'dark');
      const store = useUserStore();
      expect(store.theme).toBe('dark');
    });

    it('初始化时应设置 data-theme 属性', () => {
      localStorage.setItem('theme', 'dark');
      useUserStore();
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });

  describe('applyTheme', () => {
    it('应更新 theme 状态', () => {
      const store = useUserStore();
      store.applyTheme('dark');
      expect(store.theme).toBe('dark');
    });

    it('应更新 localStorage', () => {
      const store = useUserStore();
      store.applyTheme('dark');
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('应设置 html data-theme 属性', () => {
      const store = useUserStore();
      store.applyTheme('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });

  describe('toggleTheme', () => {
    it('从 light 切换到 dark', async () => {
      const store = useUserStore();
      expect(store.theme).toBe('light');

      await store.toggleTheme();
      expect(store.theme).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('从 dark 切换到 light', async () => {
      const store = useUserStore();
      store.applyTheme('dark');

      await store.toggleTheme();
      expect(store.theme).toBe('light');
    });

    it('切换时应异步调用后端 API', async () => {
      const store = useUserStore();
      await store.toggleTheme();

      expect(request.put).toHaveBeenCalledWith('/api/user/theme', { theme: 'dark' });
    });
  });

  describe('login - 主题恢复', () => {
    it('登录后应从后端恢复主题偏好', async () => {
      request.post.mockResolvedValueOnce({
        data: {
          token: 'test-token',
          user: { id: 1, username: 'test', theme: 'dark' },
        },
      });

      const store = useUserStore();
      await store.login('test', '123456');

      expect(store.theme).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('登录时后端未返回 theme 应默认 light', async () => {
      request.post.mockResolvedValueOnce({
        data: {
          token: 'test-token',
          user: { id: 1, username: 'test' },
        },
      });

      const store = useUserStore();
      await store.login('test', '123456');

      expect(store.theme).toBe('light');
    });
  });

  describe('logout - 主题重置', () => {
    it('登出后应重置为 light 主题', () => {
      const store = useUserStore();
      store.applyTheme('dark');
      expect(store.theme).toBe('dark');

      store.logout();
      expect(store.theme).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });
});
