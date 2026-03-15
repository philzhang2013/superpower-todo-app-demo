'use strict';

const { Controller } = require('egg');

class HomeController extends Controller {
  async index() {
    this.ctx.body = { message: 'Todo App API is running' };
  }
}

module.exports = HomeController;
