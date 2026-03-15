'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('UserController - theme', () => {
  let token;

  before(async () => {
    // 等待 app 启动完成
    await app.ready();

    // 注册一个测试用户（如果已存在则直接登录）
    const registerRes = await app.httpRequest()
      .post('/api/user/register')
      .send({ username: 'theme_test_user', password: '123456' })
      .expect(200);

    const loginRes = await app.httpRequest()
      .post('/api/user/login')
      .send({ username: 'theme_test_user', password: '123456' })
      .expect(200);

    assert(loginRes.body.data.token);
    token = loginRes.body.data.token;
  });

  after(async () => {
    // 清理测试用户
    const user = await app.model.User.findOne({ where: { username: 'theme_test_user' } });
    if (user) await user.destroy();
  });

  describe('PUT /api/user/theme', () => {
    it('should return 401 without token', async () => {
      const res = await app.httpRequest()
        .put('/api/user/theme')
        .send({ theme: 'dark' })
        .expect(401);

      assert(res.body.code === 1);
    });

    it('should reject invalid theme value', async () => {
      const res = await app.httpRequest()
        .put('/api/user/theme')
        .set('Authorization', `Bearer ${token}`)
        .send({ theme: 'blue' })
        .expect(200);

      assert(res.body.code === 1);
      assert(res.body.message === '无效的主题值');
    });

    it('should reject empty theme', async () => {
      const res = await app.httpRequest()
        .put('/api/user/theme')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(200);

      assert(res.body.code === 1);
      assert(res.body.message === '无效的主题值');
    });

    it('should update theme to dark', async () => {
      const res = await app.httpRequest()
        .put('/api/user/theme')
        .set('Authorization', `Bearer ${token}`)
        .send({ theme: 'dark' })
        .expect(200);

      assert(res.body.code === 0);
      assert(res.body.message === '主题更新成功');
    });

    it('should persist theme after update', async () => {
      // 先设为 dark
      await app.httpRequest()
        .put('/api/user/theme')
        .set('Authorization', `Bearer ${token}`)
        .send({ theme: 'dark' })
        .expect(200);

      // 重新登录验证
      const loginRes = await app.httpRequest()
        .post('/api/user/login')
        .send({ username: 'theme_test_user', password: '123456' })
        .expect(200);

      assert(loginRes.body.data.user.theme === 'dark');
    });

    it('should update theme back to light', async () => {
      await app.httpRequest()
        .put('/api/user/theme')
        .set('Authorization', `Bearer ${token}`)
        .send({ theme: 'light' })
        .expect(200);

      const loginRes = await app.httpRequest()
        .post('/api/user/login')
        .send({ username: 'theme_test_user', password: '123456' })
        .expect(200);

      assert(loginRes.body.data.user.theme === 'light');
    });
  });

  describe('POST /api/user/login - theme in response', () => {
    it('should return theme field in login response', async () => {
      const res = await app.httpRequest()
        .post('/api/user/login')
        .send({ username: 'theme_test_user', password: '123456' })
        .expect(200);

      assert(res.body.code === 0);
      assert('theme' in res.body.data.user);
      assert(['light', 'dark'].includes(res.body.data.user.theme));
    });
  });

  describe('POST /api/user/register - theme in response', () => {
    it('should return theme field in register response', async () => {
      // 用唯一用户名测试注册
      const uniqueName = 'theme_reg_test_' + Date.now();
      const res = await app.httpRequest()
        .post('/api/user/register')
        .send({ username: uniqueName, password: '123456' })
        .expect(200);

      assert(res.body.code === 0);
      assert(res.body.data.theme === 'light');

      // 清理
      const user = await app.model.User.findOne({ where: { username: uniqueName } });
      if (user) await user.destroy();
    });
  });
});
