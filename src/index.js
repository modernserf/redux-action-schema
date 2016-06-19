const types = {
    Object: (val) => val && typeof val === "object",
    Number: (val) => typeof val === "number",
    String: (val) => typeof val === "string",
}

const merge = (a, b) => Object.assign({}, a, b)
const uncons = (array) => [array[0], array.slice(1)]

// TODO: handle 3rd party actions
const defaultMiddlewareOptions = {
    checkPayloads: false,
    onError: console.error.bind(console, "unknown action:"),
    ignoreActions: ["EFFECT_TRIGGERED","EFFECT_RESOLVED", "@@router/UPDATE_LOCATION"],
}

const middlewareHelper = (tests, unformat) => (options = {}) => {
    const { ignoreActions, checkPayloads, onError } = merge(defaultMiddlewareOptions, options)
    const ignoreMap = ignoreActions.reduce((obj, key) => { obj[key] = true; return obj }, {})
    return () => (next) => (action) => {
        const { type, payload } = unformat(action)
        if (!ignoreMap[type] && !tests[type] || (checkPayloads && !tests[type](payload))) {
            onError(action)
        }
        return next(action)
    }
}

const reducerHelper = (actions, unformat) => (obj, initState) => {
    const nObj = {}
    for (const key in obj) {
        nObj[actions[key]] = obj[key]
    }

    return (state = initState, action) => {
        const { type, payload } = unformat(action)
        return nObj[type]
            ? nObj[type](state, payload)
            : state
    }
}

function parseAction (action) {
    const [type, docAndArgs] = uncons(action)
    if (!docAndArgs.length) { return { type } }

    const hasDoc = types.String(docAndArgs[0])
    if (hasDoc) {
        const [doc, args] = uncons(docAndArgs)
        return { type, doc, args: args.map(parseArg) }
    }
    return { type, args: docAndArgs.map(parseArg) }
}

function parseArg (arg, i) {
    if (typeof arg === "function" && i === 0) {
        return { test: arg, wholePayload: true }
    }
    if (arg.length === 3) {
        const [id, doc, test] = arg
        return { id, doc, test, position: i }
    }
    const [id, test] = arg
    return { id, test, position: i }
}

const defaultParams = {
    format: (type, payload) => ({ type, payload }),
    unformat: (action) => action,
    namespace: "",
}

function makeSchema (schema, params = {}) {
    const { format, unformat, namespace } = merge(defaultParams, params)
    const parsed = schema.map(parseAction)

    const schemaMap = parsed.reduce((obj, action) => {
        obj[action.type] = action
        return obj
    }, {})

    // action type -> namespaced action type
    const actions = parsed.reduce((obj, { type }) => {
        const nType = namespace
            ? namespace + "_" + type
            : type
        obj[type] = nType
        return obj
    }, {})

    // action type -> payload => namespaced action
    const actionCreators = parsed.reduce((obj, { type, args }) => {
        const nType = actions[type]
        const ac = (payload) => format(nType, payload)
        ac.byPosition = function (a, b, c) {
            const [arg0, arg1, arg2] = args
            if (!arg0) { return format(nType) }
            if (arg0.wholePayload) { return format(nType, a) }

            const payload = {}
            payload[arg0.id] = a
            if (arg1) { payload[arg1.id] = b }
            if (arg2) { payload[arg2.id] = c }
            return format(nType, payload)
        }
        obj[type] = ac
        return obj
    }, {})

    // namespaced action type -> test
    const tests = parsed.reduce((obj, { type, args }) => {
        const nType = actions[type]
        if (!args) {
            obj[nType] = () => true
        } else if (args.length === 1 && args[0].wholePayload) {
            obj[nType] = args[0].test
        } else {
            obj[nType] = (payload) =>
                args.every(({ id, test }) => test(payload[id]))
        }
        return obj
    }, {})

    const test = (action) => {
        const { type, payload } = unformat(action)
        return tests[type] && tests[type](payload)
    }

    return {
        schema: schemaMap,
        createMiddleware: middlewareHelper(tests, unformat),
        createReducer: reducerHelper(actions, unformat),
        actions, test, actionCreators,
    }
}

module.exports = { makeSchema, types }
