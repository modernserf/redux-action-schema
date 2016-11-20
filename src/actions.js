import { duplicateActionError, namespaceError } from "./errors"
import { scopeActionType, createScopedAction, popScope } from "./scope"
const { types } = require("./types")

export function createActions (fields, { mapActionType } = {}) {
    return types.Variant(fields, {
        mapType: mapActionType,
        namespaceError: namespaceError,
        duplicateError: duplicateActionError,
    })
}

// mergeActions([...actions, check for collisions])

export function combineActions (actionsByScope, rootActions, parentScope) {
    const res = rootActions ? Object.assign({}, rootActions) : {}

    for (const scopeName in actionsByScope) {
        const scope = parentScope
            ? parentScope.concat([scopeName])
            : [scopeName]
        const scopedActions = {}
        const actions = actionsByScope[scopeName]

        // recursive combinations
        if (!actions.test) {
            res[scopeName] = combineActions(actions, null, scope)
            continue
        }

        for (const actionType in actions) {
            scopedActions[actionType] = createScopedAction(
                actions[actionType],
                scope)
        }
        res[scopeName] = scopedActions
    }

    res.get = (type) => {
        return rootActions.get(type) || actionsByScope[type]
    }

    res.matchedType = (action) => {
        const rootMatch = rootActions.matchedType(action)
        if (rootMatch) { return rootMatch }
        if (action.type !== scopeActionType) { return undefined }
        const { scopeName, action: poppedAction } = popScope(action)
        return res[scopeName].matchedType(poppedAction)
    }

    res.test = (action) => {
        if (rootActions && rootActions.test(action)) { return true }
        if (action.type !== scopeActionType) { return false }
        const { scopeName, action: poppedAction } = popScope(action)
        return res[scopeName].test(poppedAction)
    }

    return res
}
