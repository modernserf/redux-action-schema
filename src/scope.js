export const scopeActionType = "redux-action-schema/scopedAction"

function scopeAction (action, scope) {
    return { type: scopeActionType, payload: { action, scope } }
}

export function createScopedAction (creator, scope) {
    const scopedCreator = (payload) => scopeAction(creator(payload), scope)
    scopedCreator.type = creator.type
    return scopedCreator
}

export function popScope (scopedAction) {
    const { payload: { scope, action } } = scopedAction
    if (scope.length === 1) {
        return { scopeName: scope[0], action }
    }
    return { scopeName: scope[0], action: scopeAction(action, scope.slice(1)) }
}
