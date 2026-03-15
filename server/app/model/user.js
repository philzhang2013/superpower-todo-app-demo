'use strict';

module.exports = (app) => {
  const { STRING, INTEGER, DATE } = app.Sequelize;

  const User = app.model.define('user', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: STRING(50), allowNull: false, unique: true },
    password: { type: STRING(255), allowNull: false },
    created_at: DATE,
    updated_at: DATE,
  });

  User.associate = function () {
    app.model.User.hasMany(app.model.Todo, { as: 'todos', foreignKey: 'user_id' });
  };

  return User;
};
