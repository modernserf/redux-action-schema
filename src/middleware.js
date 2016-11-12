const defaultIgnoreActions = [
    "EFFECT_TRIGGERED", "EFFECT_RESOLVED",  // redux-saga
    "@@router/UPDATE_LOCATION",             // redux-router
].reduce((m, k) => { m[k] = k; return m }, {})

export function createActionMonitor (actions, {
    filterActions = (action) => !defaultIgnoreActions[action.type],
    onUnknownAction = (action) => console.error("unknown action:", action),
    onMismatchedPayload = null,
} = {}) {
    const mergedActions = flattenActionTree(actions)

    const test = (action) => {
        if (typeof action !== "object") { return }
        if (!filterActions(action)) { return }

        if (!mergedActions[action.type]) {
            if (onUnknownAction) { onUnknownAction(action) }
        } else if (onMismatchedPayload) {
            const { payloadType } = mergedActions[action.type].field

            if ((action.payload && !payloadType) ||
                (payloadType && !payloadType.test(action.payload))) {
                onMismatchedPayload(action, payloadType)
            }
        }
    }

    return () => (next) => (action) => {
        test(action)
        return next(action)
    }
}

function flattenActionTree (tree, res = {}) {
    for (const key in tree) {
        if (typeof tree[key] === "function") {
            const action = tree[key]
            res[action.type] = action
        } else {
            flattenActionTree(tree[key], res)
        }
    }
    return res
}
