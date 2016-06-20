import { types, makeSchema } from "redux-action-schema"
import { createStore, combineReducers } from "redux"

const visibilityOptions = ["all", "active", "complete"]

const schema = makeSchema([
    ["add_todo",
        ["id", types.Number],
        ["text", types.String]
    ],
    ["toggle_todo", types.Number],
    ["set_visibility", types.OneOf(visibilityOptions)]
])

let id = 0
const actionCreators = {
    ...schema.actionCreators,
    add_todo: (text) => {
        id += 1
        return schema.actionCreators.add_todo({ id, text })
    }
}

const todoReducer = schema.createReducer({
    add_todo: (state, { id, text }) =>
        state.concat([{ id, text, completed: false }])
    toggle_todo: (state, id) =>
        state.map((todo) => todo.id === id
            ? { ...todo, completed: !todo.completed }
            : todo)
}, [])

const visibilityReducer = schema.createReducer({
    set_visibility: (state, option) => option
}, "all")

const mainReducer = combineReducers({
    todos: todoReducer,
    visibility: visibilityReducer,
})

const store = createStore(
    mainReducer,
    applyMiddleware(schema.createMiddleware()))
