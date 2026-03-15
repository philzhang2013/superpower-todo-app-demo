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
