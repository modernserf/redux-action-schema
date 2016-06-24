const { types, createSchema } = require("redux-action-schema")
const { createStore, combineReducers, applyMiddleware } = require("redux")
const { default: createSagaMiddleware, takeLatest } = require("redux-saga")
const { call, select, put, fork } = require("redux-saga/effects")

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
    ["saveTodos"],
    ["loadTodos"],
    ["loadTodosResolved", types.Array]])

// sagas
const loadSaga = takeLatest(schema.actions.loadTodos, function * () {
    const data = yield call(api.load)
    yield put(schema.actionCreators.loadTodosResolved(data))
})

const saveSaga = takeLatest(schema.actions.saveTodos, function * () {
    const { todos } = yield select()
    yield call(api.save, todos)
})

function * rootSaga () {
    yield fork(loadSaga)
    yield fork(saveSaga)
}

// reducers
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
    loadTodosResolved: (_, todos) => todos,
}, [])

const visibilityReducer = schema.createReducer({
    set_visibility: (state, option) => option,
}, "all")

const mainReducer = combineReducers({
    todos: todoReducer,
    visibility: visibilityReducer,
})

// store
const sagaMiddleware = createSagaMiddleware()

const store = createStore(
    mainReducer,
    applyMiddleware(sagaMiddleware, schema.createMiddleware()))

sagaMiddleware.run(rootSaga)

module.exports = { store, schema }
