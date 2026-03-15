'use strict';

module.exports = (app) => {
  const { STRING, INTEGER, BOOLEAN, DATE } = app.Sequelize;

  const Todo = app.model.define('todo', {
    id: { type: INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: INTEGER, allowNull: false },
    title: { type: STRING(255), allowNull: false },
    completed: { type: BOOLEAN, defaultValue: false },
    created_at: DATE,
    updated_at: DATE,
  });

  Todo.associate = function () {
    app.model.Todo.belongsTo(app.model.User, { as: 'user', foreignKey: 'user_id' });
  };

  return Todo;
};
