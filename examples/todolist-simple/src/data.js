import {
    types, createActions, createSelectors, reducer, selector,
    createRootReducer,
} from "redux-action-schema"
import { createConnector } from "redux-action-schema/connector"

export const Status = types.OneOf(["completed", "active"])
export const Visibility = types.OneOf(["all", "completed", "active"])

const TodoID = types.Number

export const Todo = types.Shape([
    ["id", TodoID],
    ["text", types.String],
    ["status", Status],
])

export const TodoList = types.ArrayOf(Todo)

export const actions = createActions([
    ["addedTodo",
        ["text", types.String]],
    ["editedTodo",
        ["id", TodoID],
        ["text", types.String]],
    ["toggledTodo", TodoID],
    ["deletedTodo", TodoID],
    ["completedAll"],
    ["clearedCompleted"],
    ["setVisibility", Visibility],
])

const todoStore = reducer({
    addedTodo: ({ todos, nextID }, { text }) => ({
        nextID: nextID + 1,
        todos: todos.concat([{ id: nextID, status: Status.active, text }]),
    }),
    editedTodo: ({ todos, nextID }, { id, text }) => ({
        nextID,
        todos: todos.map((todo) => todo.id === id ? { ...todo, text } : todo),
    }),
    toggledTodo: ({ todos, nextID }, id) => ({
        nextID,
        todos: todos.map((todo) =>
            todo.id === id ? {
                ...todo,
                status: todo.status === Status.completed ? Status.active : Status.completed,
            } : todo),
    }),
    deletedTodo: ({ todos, nextID }, id) => ({
        nextID,
        todos: todos.filter((todo) => todo.id !== id),
    }),
    completedAll: ({ todos, nextID }) => ({
        nextID,
        todos: todos.map((todo) => ({ ...todo, status: Status.completed })),
    }),
    clearedCompleted: ({ todos, nextID }) => ({
        nextID,
        todos: todos.filter((todo) => todo.status !== Status.completed),
    }),
}, { todos: [], nextID: 1 })

const visibility = reducer({
    setVisibility: (_, visibility) => visibility,
}, Visibility.all)

const todos = selector(["todoStore"], ({ todoStore }) => todoStore.todos)

const filteredTodos = selector(
    ["todos", "visibility"],
    ({ todos, visibility }) => visibility === Visibility.all
        ? todos
        : todos.filter(({ status }) => status === visibility))

const activeCount = selector(["todos"], ({ todos }) =>
    todos.filter(({ status }) => status === Status.active).length)

const hasCompletedTodos = selector(["todos"], ({ todos }) =>
    todos.some(({ status }) => status === Status.completed))

export const selectors = createSelectors([
    ["todoStore", todoStore,
        ["nextID", TodoID],
        ["todos", types.ArrayOf(Todo)]],
    ["todos", todos, types.ArrayOf(Todo)],
    ["filteredTodos", filteredTodos, types.ArrayOf(Todo)],
    ["visibility", visibility, Visibility],
    ["activeCount", activeCount, types.Number],
    ["hasCompletedTodos", hasCompletedTodos, types.Boolean],
])

export const rootReducer = createRootReducer(actions, selectors)
export const connect = createConnector(actions, selectors)
