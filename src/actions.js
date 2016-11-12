import { types } from "./types/index"
import { duplicateActionError, namespaceError } from "./errors"

export function createActions (baseFields, { mapActionType } = {}) {
    const fields = baseFields._actionSchema
        ? extractFields(baseFields)
        : buildFields(baseFields)

    const actionsArr = fields.map(createAction(mapActionType))

    // check for duplicate namespaced actions
    keyBy(actionsArr, ({ type }) => type, namespaceError)
    const actions = keyBy(actionsArr,
        ({ field }) => field.type, duplicateActionError)

    tagAsActions(actions)
    return actions
}

export function combineActions (actionsByNamespace, addNamespace) {
    const res = {}
    for (const namespace in actionsByNamespace) {
        const actions = actionsByNamespace[namespace]
        if (Array.isArray(actions) || actions._actionSchema) {
            res[namespace] = createActions(
                actions,
                { mapActionType: (action) => addNamespace(namespace, action) })
        } else {
            const deepAddNamespace = (ns, action) =>
                addNamespace(namespace, addNamespace(ns, action))
            res[namespace] = combineActions(actions, deepAddNamespace)
        }
    }
    return res
}

const Action = types.OneOfType([
    types.Record([
        ["type", types.String],
        ["doc", types.String, "optional"],
        ["payloadType", types.Object, "optional"],
    ]),
    types.Record([
        ["type", types.String],
        ["doc", types.String, "optional"],
    ], ["payloadType", types.Shape]),
])

Action.toObject = (val) => Action.matchedType(val).toObject(val)

function buildFields (baseFields) {
    return baseFields.map(Action.toObject)
}

function extractFields (actionMap) {
    return Object.keys(actionMap).reduce((coll, key) => {
        coll.push(actionMap[key].field)
        return coll
    }, [])
}

function createAction (mapActionType = id) {
    return (field) => {
        const type = mapActionType(field.type)
        const actionCreator = field.payloadType
            ? (payload) => ({ type, payload })
            : () => ({ type })

        actionCreator.type = type
        actionCreator.field = field

        return actionCreator
    }
}

function keyBy (arr, fn, err) {
    return arr.reduce((coll, item) => {
        const key = fn(item)
        if (coll[key]) { throw err(key) }
        coll[fn(item)] = item
        return coll
    }, {})
}

function tagAsActions (obj) {
    Object.defineProperty(obj, "_actionSchema", { value: true })
}

function id (value) { return value }
