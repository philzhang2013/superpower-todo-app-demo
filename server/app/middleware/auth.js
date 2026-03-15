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
