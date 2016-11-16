import { duplicateActionError, namespaceError } from "./errors"
const { types } = require("./types")

export function createActions (baseFields, { mapActionType } = {}) {
    const fields = baseFields._actionSchema || baseFields

    const actions = types.Variant(fields, {
        mapType: mapActionType,
        namespaceError: namespaceError,
        duplicateError: duplicateActionError,
    })

    tagAsActions(actions.creators, actions)
    return actions.creators
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
                addNamespace(namespace
                    , addNamespace(ns, action))
            res[namespace] = combineActions(actions, deepAddNamespace)
        }
    }
    return res
}

function tagAsActions (obj, test) {
    Object.defineProperty(obj, "_actionSchema", { value: test })
}
