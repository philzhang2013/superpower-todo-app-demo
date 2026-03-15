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
