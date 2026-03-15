'use strict';

module.exports = (appInfo) => {
  const config = {};

  config.keys = appInfo.name + '_1710460800000_todo';

  config.middleware = [];

  // MySQL 数据库配置
  config.sequelize = {
    dialect: 'mysql',
    host: 'mysql.lz.jwzh.online',
    port: 53312,
    database: 'todo_app',
    username: 'root',
    password: 'Founder#123',
    timezone: '+08:00',
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  };

  // JWT 配置
  config.jwt = {
    secret: 'todo-app-jwt-secret-key-2026',
  };

  // 跨域配置
  config.cors = {
    origin: 'http://localhost:5173',
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH',
    credentials: true,
  };

  // 关闭 CSRF（前后端分离不需要）
  config.security = {
    csrf: {
      enable: false,
    },
  };

  return config;
};
