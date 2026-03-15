'use strict';

module.exports = (app) => {
  const { router, controller } = app;

  router.get('/', controller.home.index);

  // 用户接口
  router.post('/api/user/register', controller.user.register);
  router.post('/api/user/login', controller.user.login);
};
