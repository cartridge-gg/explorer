import React, { useState, useCallback, useMemo } from "react";
import { cn, Button, Input } from "@cartridge/ui";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardIcon,
  CardSeparator,
} from "@/shared/components/card";
import { Badge } from "@/shared/components/badge";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/tabs";
import { CheckIcon, PlusIcon, TrashIcon, ListIcon } from "lucide-react";

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  priority: "low" | "medium" | "high";
  category?: string;
}

type FilterType = "all" | "active" | "completed";
type SortType = "created" | "priority" | "alphabetical";

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoText, setNewTodoText] = useState("");
  const [newTodoPriority, setNewTodoPriority] =
    useState<Todo["priority"]>("medium");
  const [newTodoCategory, setNewTodoCategory] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortType>("created");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const addTodo = useCallback(() => {
    if (!newTodoText.trim()) return;

    const newTodo: Todo = {
      id: Date.now().toString(),
      text: newTodoText.trim(),
      completed: false,
      createdAt: new Date(),
      priority: newTodoPriority,
      category: newTodoCategory.trim() || undefined,
    };

    setTodos((prev) => [newTodo, ...prev]);
    setNewTodoText("");
    setNewTodoCategory("");
    setNewTodoPriority("medium");
  }, [newTodoText, newTodoPriority, newTodoCategory]);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }, []);

  const startEditing = useCallback((id: string, text: string) => {
    setEditingId(id);
    setEditText(text);
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingId || !editText.trim()) return;

    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === editingId ? { ...todo, text: editText.trim() } : todo,
      ),
    );
    setEditingId(null);
    setEditText("");
  }, [editingId, editText]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditText("");
  }, []);

  const clearCompleted = useCallback(() => {
    setTodos((prev) => prev.filter((todo) => !todo.completed));
  }, []);

  const filteredAndSortedTodos = useMemo(() => {
    let filtered = todos;

    // Apply filter
    switch (filter) {
      case "active":
        filtered = todos.filter((todo) => !todo.completed);
        break;
      case "completed":
        filtered = todos.filter((todo) => todo.completed);
        break;
      default:
        filtered = todos;
    }

    // Apply sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "priority": {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        case "alphabetical":
          return a.text.localeCompare(b.text);
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });
  }, [todos, filter, sortBy]);

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((todo) => todo.completed).length;
    const active = total - completed;
    return { total, completed, active };
  }, [todos]);

  const categories = useMemo(() => {
    const categorySet = new Set(
      todos
        .map((todo) => todo.category)
        .filter((category): category is string => Boolean(category)),
    );
    return Array.from(categorySet);
  }, [todos]);

  const getPriorityColor = (priority: Todo["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardIcon icon={<ListIcon />} />
          <CardTitle>Todo List</CardTitle>
        </CardHeader>

        <CardSeparator />

        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Add new todo */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a new todo..."
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addTodo();
                    }
                  }}
                  className="flex-1"
                />
                <Button onClick={addTodo} disabled={!newTodoText.trim()}>
                  <PlusIcon className="w-4 h-4" />
                  Add
                </Button>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Category (optional)"
                  value={newTodoCategory}
                  onChange={(e) => setNewTodoCategory(e.target.value)}
                  className="flex-1"
                />
                <select
                  value={newTodoPriority}
                  onChange={(e) =>
                    setNewTodoPriority(e.target.value as Todo["priority"])
                  }
                  className="px-3 py-2 border border-background-200 rounded bg-background text-foreground"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-sm">
              <Badge>Total: {stats.total}</Badge>
              <Badge>Active: {stats.active}</Badge>
              <Badge>Completed: {stats.completed}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Controls */}
      <Card>
        <CardContent>
          <Tabs
            value={filter}
            onValueChange={(value) => setFilter(value as FilterType)}
          >
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>

              <div className="flex gap-2 items-center">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortType)}
                  className="px-3 py-1 border border-background-200 rounded bg-background text-foreground text-sm"
                >
                  <option value="created">Sort by Created</option>
                  <option value="priority">Sort by Priority</option>
                  <option value="alphabetical">Sort Alphabetically</option>
                </select>

                {stats.completed > 0 && (
                  <Button variant="secondary" onClick={clearCompleted}>
                    Clear Completed
                  </Button>
                )}
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Todo List */}
      <Card className="flex-1">
        <CardContent>
          {filteredAndSortedTodos.length === 0 ? (
            <div className="text-center py-8 text-foreground-400">
              {filter === "all"
                ? "No todos yet. Add one above!"
                : filter === "active"
                  ? "No active todos!"
                  : "No completed todos!"}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAndSortedTodos.map((todo) => (
                <div
                  key={todo.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded border border-background-200 bg-background hover:bg-background-100 transition-colors",
                    todo.completed && "opacity-60",
                  )}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                      todo.completed
                        ? "bg-primary border-primary text-white"
                        : "border-background-300 hover:border-primary",
                    )}
                  >
                    {todo.completed && <CheckIcon className="w-3 h-3" />}
                  </button>

                  {/* Priority indicator */}
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      getPriorityColor(todo.priority),
                    )}
                  />

                  {/* Todo content */}
                  <div className="flex-1 min-w-0">
                    {editingId === todo.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              saveEdit();
                            } else if (e.key === "Escape") {
                              cancelEdit();
                            }
                          }}
                          className="flex-1"
                          autoFocus
                        />
                        <Button onClick={saveEdit}>Save</Button>
                        <Button variant="secondary" onClick={cancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <div
                          className={cn(
                            "cursor-pointer",
                            todo.completed && "line-through",
                          )}
                          onClick={() => startEditing(todo.id, todo.text)}
                        >
                          {todo.text}
                        </div>
                        <div className="flex gap-2 text-xs text-foreground-400">
                          <span>{todo.createdAt.toLocaleDateString()}</span>
                          {todo.category && (
                            <Badge className="text-xs">{todo.category}</Badge>
                          )}
                          <Badge className="text-xs">{todo.priority}</Badge>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="p-1 text-foreground-400 hover:text-red-500 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categories */}
      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardSeparator />
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge key={category}>{category}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
