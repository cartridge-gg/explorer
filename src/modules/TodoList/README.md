# TodoList Component

A comprehensive todo list component built with React and TypeScript that follows the existing design patterns in the codebase.

## Features

- ✅ **Add todos** with text, priority, and optional category
- ✅ **Mark todos as complete/incomplete** with visual feedback
- ✅ **Edit todos inline** by clicking on the text
- ✅ **Delete todos** with a delete button
- ✅ **Filter todos** by status (All, Active, Completed)
- ✅ **Sort todos** by creation date, priority, or alphabetically
- ✅ **Priority levels** (High, Medium, Low) with color indicators
- ✅ **Categories** for organizing todos
- ✅ **Statistics** showing total, active, and completed counts
- ✅ **Clear completed** todos in bulk
- ✅ **Responsive design** that works on all screen sizes

## Usage

### Basic Usage

```tsx
import { TodoList } from "@/modules/TodoList";

function MyPage() {
  return (
    <div>
      <TodoList />
    </div>
  );
}
```

### With Page Layout

```tsx
import { TodoListPage } from "@/modules/TodoList/page";

function App() {
  return <TodoListPage />;
}
```

## Component Structure

### TodoList Component

The main component that manages all todo functionality.

**Props:** None (fully self-contained)

**State:**

- `todos`: Array of Todo items
- `newTodoText`: Text for new todo input
- `newTodoPriority`: Priority for new todo
- `newTodoCategory`: Category for new todo
- `filter`: Current filter (all/active/completed)
- `sortBy`: Current sort method
- `editingId`: ID of todo being edited
- `editText`: Text being edited

### Todo Interface

```typescript
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  priority: "low" | "medium" | "high";
  category?: string;
}
```

## Features in Detail

### Adding Todos

- Enter text in the input field
- Optionally set a category
- Choose priority level (Low, Medium, High)
- Press Enter or click Add button

### Managing Todos

- **Complete/Uncomplete**: Click the checkbox
- **Edit**: Click on the todo text to edit inline
- **Delete**: Click the trash icon
- **Save Edit**: Press Enter or click Save
- **Cancel Edit**: Press Escape or click Cancel

### Filtering and Sorting

- **Filter tabs**: All, Active, Completed
- **Sort dropdown**: By creation date, priority, or alphabetically
- **Clear completed**: Remove all completed todos at once

### Visual Indicators

- **Priority colors**:
  - High: Red dot
  - Medium: Yellow dot
  - Low: Green dot
- **Completion state**: Strikethrough text and reduced opacity
- **Categories**: Displayed as badges
- **Statistics**: Real-time counts in badges

## Design System Integration

The component uses the existing design system components:

- `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardSeparator`
- `Button` with secondary variant
- `Input` for text entry
- `Badge` for statistics and metadata
- `Tabs`, `TabsList`, `TabsTrigger` for filtering
- Consistent color scheme and spacing

## Keyboard Shortcuts

- **Enter**: Add new todo or save edit
- **Escape**: Cancel edit mode

## Responsive Design

- Mobile-first approach
- Flexible layout that adapts to screen size
- Touch-friendly buttons and inputs
- Readable text at all sizes

## Accessibility

- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly
- High contrast colors
- Focus indicators
