'use strict';

module.exports = (app) => {
  const { router, controller } = app;

  router.get('/', controller.home.index);

  // 用户接口
  router.post('/api/user/register', controller.user.register);
  router.post('/api/user/login', controller.user.login);

  // Todo 接口（需鉴权）
  const auth = app.middleware.auth();
  router.get('/api/todos', auth, controller.todo.index);
  router.post('/api/todos', auth, controller.todo.create);
  router.put('/api/todos/:id', auth, controller.todo.update);
  router.delete('/api/todos/:id', auth, controller.todo.destroy);
};
