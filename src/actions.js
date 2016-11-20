import { duplicateActionError, namespaceError } from "./errors"
import { createScopedAction, getInScope } from "./scope"
const { types } = require("./types")

export function createActions (fields, { mapActionType } = {}) {
    return types.Variant(fields, {
        mapType: mapActionType,
        namespaceError: namespaceError,
        duplicateError: duplicateActionError,
    })
}

export function mergeActions (actionSchemas) {
    const merged = {}
    const actionTypes = {}
    for (let i = 0; i < actionSchemas.length; i++) {
        const actions = actionSchemas[i]
        for (const key in actions) {
            const action = actions.key
            if (merged[key]) { throw duplicateActionError(key) }
            if (actionTypes[action.type]) { throw namespaceError(action.type) }
            merged[key] = action
            actionTypes[action.type] = action
        }
    }

    merged.test = (val) => actionSchemas.some((actions) => actions.test(val))
    merged.matchedType = (val) =>
        actionSchemas.find()
}

export function combineActions (actionsByScope, parentScope) {
    const res = {}

    for (const scopeName in actionsByScope) {
        const scope = parentScope
            ? parentScope.concat([scopeName])
            : [scopeName]
        const scopedActions = {}
        const actions = actionsByScope[scopeName]

        // recursive combinations
        if (!actions.test) {
            res[scopeName] = combineActions(actions, scope)
            continue
        }

        for (const actionType in actions) {
            scopedActions[actionType] = createScopedAction(
                actions[actionType],
                scope)
        }
        res[scopeName] = scopedActions
    }

    res.matchedType = getInScope(
        (scope, action) => res[scope].matchedType(action), undefined)
    res.test = getInScope(
        (scope, action) => res[scope].test(action), false)
    return res
}
