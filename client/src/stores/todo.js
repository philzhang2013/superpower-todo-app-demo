import { defineStore } from 'pinia';
import { ref } from 'vue';
import request from '../utils/request';

export const useTodoStore = defineStore('todo', () => {
  const todos = ref([]);

  async function fetchTodos() {
    const res = await request.get('/api/todos');
    todos.value = res.data;
  }

  async function addTodo(title) {
    await request.post('/api/todos', { title });
    await fetchTodos();
  }

  async function updateTodo(id, data) {
    await request.put(`/api/todos/${id}`, data);
    await fetchTodos();
  }

  async function deleteTodo(id) {
    await request.delete(`/api/todos/${id}`);
    await fetchTodos();
  }

  return { todos, fetchTodos, addTodo, updateTodo, deleteTodo };
});
