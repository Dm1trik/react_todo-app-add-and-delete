/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useRef, useState } from 'react';
import { UserWarning } from './UserWarning';
import { getTodos, createTodo, USER_ID, deleteTodo } from './api/todos';
import { NewTodo } from './Components/NewTodo';
import { TodoList } from './Components/TodoList';
import { ErrorNotification } from './Components/ErrorNotification';
import { Todo } from './types/Todo';
import { Footer } from './Components/Footer/Footer';
import { FILTERS } from './types/Filters';

function getPreparedTodos(todos: Todo[], selectedStatus: string) {
  return todos.filter(todo => {
    let matchesStatus = true;

    if (selectedStatus === FILTERS.active) {
      matchesStatus = !todo.completed;
    } else if (selectedStatus === FILTERS.completed) {
      matchesStatus = todo.completed;
    }

    return matchesStatus;
  });
}

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(FILTERS.all);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [loadingTodoIds, setLoadingTodoIds] = useState<number[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  const visibleTodos = getPreparedTodos(todos, selectedStatus);

  useEffect(() => {
    setErrorMessage('');
    getTodos()
      .then(setTodos)
      .catch(() => setErrorMessage('Unable to load todos'));
  }, []);

  function addTodo(title: string) {
    setErrorMessage('');

    setTempTodo({
      id: 0,
      title,
      userId: USER_ID,
      completed: false,
    });

    return createTodo({
      title,
      userId: USER_ID,
      completed: false,
    })
      .then(newTodo => {
        setTodos(currentTodos => [...currentTodos, newTodo]);
      })
      .catch(err => {
        setErrorMessage('Unable to add a todo');
        throw err;
      })
      .finally(() => {
        setTempTodo(null);
      });
  }

  function removeTodo(todoId: number) {
    setErrorMessage('');

    setLoadingTodoIds(currentIds => [...currentIds, todoId]);

    return deleteTodo(todoId)
      .then(() => {
        setTodos(currentTodos =>
          currentTodos.filter(todo => todo.id !== todoId),
        );
      })
      .catch(err => {
        setErrorMessage('Unable to delete a todo');
        throw err;
      })
      .finally(() => {
        setLoadingTodoIds(currentTodos =>
          currentTodos.filter(id => id !== todoId),
        );
        inputRef.current?.focus();
      });
  }

  function handleClearCompleted() {
    const completedTodos = todos.filter(todo => todo.completed === true);

    completedTodos.forEach(todo => removeTodo(todo.id));
  }

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <NewTodo
          todos={todos}
          onAdd={addTodo}
          onErrorMessage={setErrorMessage}
          inputRef={inputRef}
        />

        {(todos.length > 0 || tempTodo) && (
          <TodoList
            todos={visibleTodos}
            tempTodo={tempTodo}
            loadingTodoIds={loadingTodoIds}
            onDelete={removeTodo}
          />
        )}

        {todos.length > 0 && (
          <Footer
            todos={todos}
            selectedStatus={selectedStatus}
            onSelectedStatus={setSelectedStatus}
            onClearCompleted={handleClearCompleted}
          />
        )}
      </div>

      <ErrorNotification
        errorMessage={errorMessage}
        onErrorMessage={setErrorMessage}
      />
    </div>
  );
};
