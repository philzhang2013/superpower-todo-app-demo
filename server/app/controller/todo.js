'use strict';

const { Controller } = require('egg');

class TodoController extends Controller {
  async index() {
    const { ctx } = this;
    const todos = await ctx.service.todo.list(ctx.state.user.id);
    ctx.body = { code: 0, data: todos, message: 'success' };
  }

  async create() {
    const { ctx } = this;
    const { title } = ctx.request.body;
    if (!title) {
      ctx.body = { code: 1, message: '标题不能为空' };
      return;
    }
    const todo = await ctx.service.todo.create(ctx.state.user.id, title);
    ctx.body = { code: 0, data: todo, message: '创建成功' };
  }

  async update() {
    const { ctx } = this;
    const { id } = ctx.params;
    const { title, completed } = ctx.request.body;
    const todo = await ctx.service.todo.update(id, ctx.state.user.id, { title, completed });
    if (!todo) {
      ctx.body = { code: 1, message: 'Todo 不存在' };
      return;
    }
    ctx.body = { code: 0, data: todo, message: '更新成功' };
  }

  async destroy() {
    const { ctx } = this;
    const { id } = ctx.params;
    const result = await ctx.service.todo.destroy(id, ctx.state.user.id);
    if (!result) {
      ctx.body = { code: 1, message: 'Todo 不存在' };
      return;
    }
    ctx.body = { code: 0, message: '删除成功' };
  }
}

module.exports = TodoController;
