'use strict';

const { Service } = require('egg');

class TodoService extends Service {
  async list(userId) {
    return await this.ctx.model.Todo.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
    });
  }

  async create(userId, title) {
    return await this.ctx.model.Todo.create({ user_id: userId, title });
  }

  async update(id, userId, data) {
    const todo = await this.ctx.model.Todo.findOne({ where: { id, user_id: userId } });
    if (!todo) return null;
    return await todo.update(data);
  }

  async destroy(id, userId) {
    const todo = await this.ctx.model.Todo.findOne({ where: { id, user_id: userId } });
    if (!todo) return false;
    await todo.destroy();
    return true;
  }
}

module.exports = TodoService;
