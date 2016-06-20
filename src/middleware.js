const defaultMiddlewareOptions = {
    ignorePayloads: false,
    onError: console.error.bind(console, "unknown action:"),
    ignoreActions: ["EFFECT_TRIGGERED", "EFFECT_RESOLVED", "@@router/UPDATE_LOCATION"],
}

const merge = (a, b) => Object.assign({}, a, b)

// TODO: separate onError for unknown actions & bad props

export const middlewareHelper = (tests, unformat) => (options = {}) => {
    const { ignoreActions, ignorePayloads, onError } = merge(defaultMiddlewareOptions, options)
    const ignoreMap = ignoreActions.reduce((obj, key) => { obj[key] = true; return obj }, {})

    const test = (action) => {
        const { type, payload } = unformat(action)
        if (ignoreMap[type]) { return }
        if (tests[type] && ignorePayloads) { return }
        if (tests[type] && tests[type](payload)) { return }
        onError(action)
    }

    return () => (next) => (action) => {
        test(action)
        return next(action)
    }
}
