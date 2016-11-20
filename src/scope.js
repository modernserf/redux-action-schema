const scopeActionType = "redux-action-schema/scopedAction"

function scopeAction (action, scope) {
    return { type: scopeActionType, payload: { action, scope } }
}

export function createScopedAction (creator, scope) {
    const scopedCreator = (payload) => scopeAction(creator(payload), scope)
    scopedCreator.type = creator.type
    return scopedCreator
}

export function getInScope (fn, defaultValue) {
    return (action) => {
        if (action.type !== scopeActionType) { return defaultValue }
        const { scopeName, action: poppedAction } = popScope(action)
        return fn(scopeName, poppedAction)
    }
}

export function actionInScope (actions, scope, actionType) {
    if (actions[actionType]) { return actions[actionType] }
    if (!scope.length) { return undefined }
    const scopeName = scope[0]
    const childScope = scope.slice(1)
    if (!actions[scopeName]) { return undefined }
    return actionInScope(actions[scopeName], childScope, actionType)
}

export function createScopedReducer (reducer, scope) {
    return (state, action) => {
        if (action.type === scopeActionType &&
            scopeEq(action.payload.scope, scope)) {
            return reducer(state, action.payload.action)
        } else {
            return reducer(state, action)
        }
    }
}

function popScope (scopedAction) {
    const { payload: { scope, action } } = scopedAction
    if (scope.length === 1) {
        return { scopeName: scope[0], action }
    }
    return { scopeName: scope[0], action: scopeAction(action, scope.slice(1)) }
}

function scopeEq (a, b) {
    if (a.length !== b.length) { return false }
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) { return false }
    }
    return true
}
