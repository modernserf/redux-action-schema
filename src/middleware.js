import { mergeIgnoreUndefined } from "./util"

const defaultMiddlewareOptions = {
    ignorePayloads: false,
    onError: console.error.bind(console, "unknown action:"),
    ignoreActions: ["EFFECT_TRIGGERED", "EFFECT_RESOLVED", "@@router/UPDATE_LOCATION"],
}

// TODO: separate onError for unknown actions & bad props

export const middlewareHelper = (tests, unformat) => (options = {}) => {
    const { ignoreActions, ignorePayloads, onError } = mergeIgnoreUndefined(defaultMiddlewareOptions, options)
    const ignoreMap = ignoreActions.reduce((obj, key) => { obj[key] = true; return obj }, {})

    const test = (action) => {
        if (typeof action !== "object") { return }

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
