import { types, createSchema } from "redux-action-schema"
import { createStore, combineReducers, applyMiddleware } from "redux"

const merge = (a, b) => Object.assign({}, a, b)

// schema

const show = ["all", "active", "completed"]

const todoID = (value) => typeof value === "number" && value > 0

const schema = createSchema([
    ["addTodo", "here is a docstring",
        ["id", todoID],
        ["text", types.String]],
    ["editTodo",
        ["id", "params can have docstrings too", todoID],
        ["text", types.String]],
    ["toggleTodo", todoID],
    ["deleteTodo", todoID],
    ["completeAll"],
    ["clearCompleted"],
    ["setVisibility", types.OneOf(show)]])

// actions

let id = 0
export const actionCreators = merge(schema.actionCreators, {
    addTodo: (text) => {
        id += 1
        return schema.actionCreators.addTodo({ id, text })
    },
})

// reducers

const update = (state, id, updateFn) =>
    state.map((todo) => todo.id === id
        ? updateFn(todo)
        : todo)

const todoReducer = schema.createReducer({
    addTodo: (state, { id, text }) =>
        state.concat([{ id, text, completed: false }]),
    editTodo: (state, { id, text }) => update(state, id,
        (todo) => merge(todo, { text })),
    toggleTodo: (state, id) => update(state, id,
        (todo) => merge(todo, { completed: !todo.completed })),
    deleteTodo: (state, id) =>
        state.filter((todo) => todo.id !== id),
    completeAll: (state) =>
        state.map((todo) => merge(todo, { completed: true })),
    clearCompleted: (state) =>
        state.filter((todo) => !todo.completed),
}, [])

const visibilityReducer = schema.createReducer({
    set_visibility: (state, option) => option,
}, "all")

const mainReducer = combineReducers({
    todos: todoReducer,
    visibility: visibilityReducer,
})

export const visibleTodos = ({ todos, visibility }) => ({
    all: () => todos,
    active: () => todos.filter((t) => !t.completed),
    completed: () => todos.filter((t) => t.completed),
}[visibility]())

// store

export const store = createStore(
    mainReducer,
    applyMiddleware(schema.createMiddleware()))
