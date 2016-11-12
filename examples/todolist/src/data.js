import { createConnector } from "redux-schema"
import {
    selectorSchema, actionSchema, Status, TodoFragment,
} from "./schema"

const statusFilter = actionSchema.createReducer({
    routeChanged: (state, { query }) =>
        Status(query.status) ? query.status : state,
    filteredStatus: (state, status) => status,
}, Status.all)

const tagFilter = actionSchema.createReducer({
    routeChanged: (state, { query }) => (query.tags || "").split(","),
    setTagFilter: (state, tag) => [tag],
    addedTagFilter: (state, tag) => state.concat([tag]),
    removedTagFilter: (state, tag) => state.filter((t) => t !== tag),
    clearedTagFilter: () => [],
}, [])

const todos = actionSchema.createReducer({
    loadedTodos: (state, todos) => todos,
    addedTodo: (state, todo) => state.concat([todo]),
    editedTodo: (state, { id, text }) => state.map((t) =>
        t.id === id ? { ...t, text } : t),
    toggledTodo: (state, { id }) => state.map((t) =>
        t.id === id ? { ...t, status: toggleStatus(t.status) } : t),
    deletedTodo: (state, { id }) => state.filter((t) => t.id !== id),
}, [])

const path = actionSchema.createReducer({
    routeChanged: (state, { path }) => path,
}, [])

const route = ["statusFilter", "tagFilter", "path",
    ({ statusFilter, tagFilter, path }) => ({
        path,
        query: {
            status: statusFilter,
            tags: tagFilter.join(","),
        },
    })]

const filteredTodos = ["statusFilter", "tagFilter", "todos",
    ({ statusFilter, tagFilter, todos }) => {
        const tagSet = new Set(tagFilter)
        const hasTag = tagFilter.length
            ? (tags) => tags.some((tag) => tagSet.has(tag))
            : () => true
        const hasStatus = (status) =>
            statusFilter === Status.all || statusFilter === status

        return todos
            .map(parseTodo)
            .filter((todo) => hasTag(todo.tags) && hasStatus(todo.status))
    }]

const reducer = selectorSchema.createReducer({
    // base reducers
    statusFilter,
    tagFilter,
    todos,
    path,
    // selectors
    route,
    filteredTodos,
})

// reducer is a function with a 'select' method glued on it

// create an anonymous selector
reducer.select(["filteredTodos", "route"])
// ==> (appState) => ({ filteredTodos, route })
// and map
reducer.select(["filteredTodos", "route"], (selections) => value)
// ==> (appState) => value

const connect = createConnector({ selectors, actions })

connect(
    ["filteredTodos", "tags"],
    ["setTagFilter", "addedTagFilter", "removedTagFilter"],
    (selections, actionCreators, props) => value
)(Component)

function toggleStatus (status) {
    return ({
        [Status.todo]: Status.completed,
        [Status.completed]: Status.todo,
    })[status]
}

function parseTodo (todo) {
    const parsed = todo.text.split(/(#\w+)/g).map((t) => {
        if (t[0] === "#" && t[1]) {
            return TodoFragment.tag.create(t.substr(1))
        } else {
            return TodoFragment.text.create(t)
        }
    })

    const tags = parsed.reduce((coll, { type, value }) => {
        if (type === "tag") { coll.add(value) }
        return coll
    }, new Set())

    return { ...todo, parsed, tags: [...tags] }
}
