import { reducer, selector } from "redux-action-schema"

console.log("before schema import")

import { Status, TodoFragment } from "./schema"

console.log("after schema import", Status, TodoFragment)

console.log("bisect")

export const statusFilter = reducer({
    routeChanged: (state, { query }) =>
        Status(query.status) ? query.status : state,
    filteredStatus: (state, status) => status,
}, Status.all)

export const tagFilter = reducer({
    routeChanged: (state, { query }) => (query.tags || "").split(","),
    setTagFilter: (state, tag) => [tag],
    addedTagFilter: (state, tag) => state.concat([tag]),
    removedTagFilter: (state, tag) => state.filter((t) => t !== tag),
    clearedTagFilter: () => [],
}, [])

export const tags = selector(
    ["tagFilter", "todos"],
    ({ tagFilter, todos }) => {
        const activeSet = new Set(tagFilter)

        const allTags = [].concat(todos.map((todo) => parseTodo(todo).tags))
        const deduped = [...new Set(allTags)]

        return deduped.map((tag) => ({
            value: tag,
            active: activeSet.has(tag),
        }))
    }
)

export const todos = reducer({
    loadedTodos: (state, todos) => todos,
    addedTodo: (state, todo) => state.concat([todo]),
    editedTodo: (state, { id, text }) => state.map((t) =>
        t.id === id ? { ...t, text } : t),
    toggledTodo: (state, { id }) => state.map((t) =>
        t.id === id ? { ...t, status: toggleStatus(t.status) } : t),
    deletedTodo: (state, { id }) => state.filter((t) => t.id !== id),
}, [])

export const path = reducer({
    routeChanged: (state, { path }) => path,
}, [])

export const route = selector(
    ["statusFilter", "tagFilter", "path"],
    ({ statusFilter, tagFilter, path }) => ({
        path,
        query: {
            status: statusFilter,
            tags: tagFilter.join(","),
        },
    }))

export const filteredTodos = selector(
    ["statusFilter", "tagFilter", "todos"],
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
    })

function toggleStatus (status) {
    return ({
        [Status.todo]: Status.completed,
        [Status.completed]: Status.todo,
    })[status]
}

function parseTodo (todo) {
    const parsed = todo.text.split(/(#\w+)/g).map((t) => {
        if (t[0] === "#" && t[1]) {
            return TodoFragment.creators.tag(t.substr(1))
        } else {
            return TodoFragment.creators.text(t)
        }
    })

    const tags = parsed.reduce((coll, { type, value }) => {
        if (type === "tag") { coll.add(value) }
        return coll
    }, new Set())

    return { ...todo, parsed, tags: [...tags] }
}

console.log("end data")
