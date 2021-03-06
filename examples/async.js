const { types, createSchema } = require("redux-action-schema")
const { createStore, combineReducers, applyMiddleware } = require("redux")
const thunk = require("redux-thunk").default

const api = {
    load: () => window.fetch("/todos").then((res) => res.json()),
    save: (data) => window.fetch("/todos", {
        method: "post",
        body: JSON.stringify(data),
    }),
}

const schema = createSchema([
    ["addTodo",
        ["id", types.Number],
        ["text", types.String]],
    ["toggleTodo", types.Number],
    ["loadTodos", types.Array]])

// save the original synchronous action creator for loadTodos
const { loadTodos } = schema.actionCreators

// replace it in the actionCreators object with a thunk-producing action creator
schema.actionCreators.loadTodos = () => (dispatch) => {
    api.load().then((todos) => {
        // call the _original_ action creator to create an action
        dispatch(loadTodos(todos))
    })
}

// note -- there is no corresponding "saveTodos" action
schema.actionCreators.saveTodos = () => (dispatch, getState) => {
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

const store = createStore(
    mainReducer,
    applyMiddleware(thunk, schema.createMiddleware()))

module.exports = { store, schema }
