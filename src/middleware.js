const defaultIgnoreActions = [
    "EFFECT_TRIGGERED", "EFFECT_RESOLVED",  // redux-saga
    "@@router/UPDATE_LOCATION",             // redux-router
    "redux-action-schema/requestedPromise", // promise actions
    "redux-action-schema/resolvedPromise",
    "redux-action-schema/rejectedPromise",
].reduce((m, k) => { m[k] = k; return m }, {})

const defaultFilter = (action) => !defaultIgnoreActions[action.type]

const defaultUnknownAction = (action) => console.error("unknown action:", action)

export function createActionMonitor (actions, {
    filterActions = defaultFilter,
    onUnknownAction = defaultUnknownAction,
    onMismatchedPayload = null,
} = {}) {
    const test = (action) => {
        if (typeof action !== "object") { return }
        if (!filterActions(action)) { return }

        if (onUnknownAction && !actions.matchedType(action)) {
            onUnknownAction(action)
        } else if (onMismatchedPayload && !actions.test(action)) {
            onMismatchedPayload(action)
        }
    }

    return () => (next) => (action) => {
        test(action)
        return next(action)
    }
}
