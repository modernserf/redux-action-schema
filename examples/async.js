import { types, createSchema } from "redux-action-schema"
import { createStore, combineReducers, applyMiddleware } from "redux"
import thunk from "redux-thunk"

const api = {
    load: () => window.fetch("/todos").then((res) => res.json()),
    save: (data) => window.fetch("/todos", {
        method: "post",
        body: JSON.stringify(data),
    }),
}

const schema = createSchema([
    ["addTodo", "here is a docstring",
        ["id", types.Number],
        ["text", types.String]],
    ["toggleTodo", types.Number],
    ["loadTodos", types.Array]])

const { loadTodos } = schema.actionCreators
schema.actionCreators.loadTodos = () => (dispatch) => {
    api.load().then((todos) => {
        dispatch(loadTodos(todos))
    })
}

// note -- there is no corresponding "saveTodos" action
schema.actionCreators.saveTodos = () => (_, getState) => {
    api.save(getState().todos)
}

const merge = (a, b) => Object.assign({}, a, b)

const update = (state, id, updateFn) =>
    state.map((todo) => todo.id === id
        ? updateFn(todo)
        : todo)

const todoReducer = schema.createReducer({
    addTodo: (state, { id, text }) =>
        state.concat([{ id, text, completed: false }]),
    toggleTodo: (state, id) => update(state, id,
        (todo) => merge(todo, { completed: !todo.completed })),
    loadTodos: (_, todos) => todos,
}, [])

const visibilityReducer = schema.createReducer({
    set_visibility: (state, option) => option,
}, "all")

const mainReducer = combineReducers({
    todos: todoReducer,
    visibility: visibilityReducer,
})

export const store = createStore(
    mainReducer,
    applyMiddleware(thunk, schema.createMiddleware()))
