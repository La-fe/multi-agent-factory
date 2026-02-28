// In-memory TODO store
// Simple enough for a demo, complex enough to show multi-agent patterns

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

const todos = new Map<string, Todo>();
let nextId = 1;

export function createTodo(title: string): Todo {
  const id = String(nextId++);
  const todo: Todo = {
    id,
    title,
    completed: false,
    createdAt: new Date().toISOString(),
  };
  todos.set(id, todo);
  return todo;
}

export function getTodo(id: string): Todo | undefined {
  return todos.get(id);
}

export function listTodos(): Todo[] {
  return Array.from(todos.values());
}

export function updateTodo(
  id: string,
  updates: Partial<Pick<Todo, "title" | "completed">>
): Todo | undefined {
  const todo = todos.get(id);
  if (!todo) return undefined;

  if (updates.title !== undefined) todo.title = updates.title;
  if (updates.completed !== undefined) todo.completed = updates.completed;

  todos.set(id, todo);
  return todo;
}

export function deleteTodo(id: string): boolean {
  return todos.delete(id);
}

export function clearTodos(): void {
  todos.clear();
  nextId = 1;
}
