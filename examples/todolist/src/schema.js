import { types, createActions, createSelectors } from "redux-action-schema"

export const Status = types.OneOf(["all", "todo", "completed"])

export const TodoFragment = types.Variant([
    ["tag", types.String],
    ["text", types.String],
])

export const Path = types.ArrayOf(types.String)

export const Route = types.Shape([
    ["path", Path],
    ["query", types.Object], // ObjectMapOf(types.String)
])

export const todoFields = [
    ["id", types.String],
    ["status", Status],
    ["text", types.String],
]

export const Todo = types.Shape(todoFields)

export const ParsedTodo = types.Shape([
    ...todoFields,
    ["parsed", TodoFragment],
    ["tags", types.ArrayOf(types.String)],
])

export const Tag = types.Shape([
    ["value", types.String],
    ["active", types.Boolean],
])

console.log("before data import")

import {
    statusFilter, tagFilter, todos, path, route, filteredTodos, tags,
} from "./data"

console.log("after data import")

export const actions = createActions([
    ["routeChanged", Route],
    ["filteredStatus", Status],
    ["setTagFilter", types.String],
    ["addedTagFilter", types.String],
    ["removedTagFilter", types.String],
    ["clearedTagFilter"],
    ["loadedTodos", types.ArrayOf(Todo)],
    ["addedTodo", Todo],
    ["editedTodo",
        ["id", types.String],
        ["text", types.String]],
    ["toggledTodo",
        ["id", types.String]],
    ["deletedTodo",
        ["id", types.String]],
])

export const selectors = createSelectors([
    ["statusFilter", statusFilter],
    ["tagFilter", tagFilter],
    ["todos", todos],
    ["path", path],
    ["route", route],
    ["filteredTodos", filteredTodos],
    ["tags", tags],
])
