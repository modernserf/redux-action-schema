import { type, createActionSchema, createSelectorSchema } from "redux-schema"

export const Path = type.ArrayOf(type.String)

export const Route = type([
    ["path", Path],
    ["query", type.ObjectMapOf(type.String)],
])

export const Status = type.OneOf(["all", "todo", "completed"])

const TodoFragment = type.UnionOf([
    ["tag", type.String],
    ["text", type.String],
])

export const todoFields = [
    ["id", type.String],
    ["status", Status],
    ["text", type.String],
]

export const Todo = type(todoFields)

export const ParsedTodo = type([
    ...todoFields,
    ["parsed", TodoFragment],
    ["tags", type.ArrayOf(type.String)],
])

export const Tag = type([
    ["value", type.String],
    ["active", type.Boolean],
])

export const actionSchema = createActionSchema([
    ["routeChanged", Route],
    ["filteredStatus", Status],
    ["setTagFilter", type.String],
    ["addedTagFilter", type.String],
    ["removedTagFilter", type.String],
    ["clearedTagFilter"],
    ["loadedTodos", type.ArrayOf(Todo)],
    ["addedTodo", Todo],
    ["editedTodo",
        ["id", type.String],
        ["text", type.String]],
    ["toggledTodo",
        ["id", type.String]],
    ["deletedTodo",
        ["id", type.String]],
])

export const selectorSchema = createSelectorSchema([
    ["statusFilter", Status],
    ["tagFilter", type.ArrayOf(type.String)],
    ["todos", type.ArrayOf(Todo)],
    ["path", Path],
    ["route", Route],
    ["filteredTodos", type.ArrayOf(ParsedTodo)],
    ["tags", type.ArrayOf(Tag)],
])
