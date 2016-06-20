export { types } from "./types.js"

import { middlewareHelper } from "./middleware"
import { reducerHelper } from "./reducer"
import { parseAction } from "./parse"

const merge = (a, b) => Object.assign({}, a, b)

const defaultParams = {
    format: (type, payload) => ({ type, payload }),
    unformat: (action) => action,
    namespace: "",
}

export function makeSchema (schema, params = {}) {
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

            if (!args.length) { return format(nType) }
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
        if (!args.length) {
            obj[nType] = (payload) => payload === undefined
        } else if (args.length === 1 && args[0].wholePayload) {
            obj[nType] = args[0].test
        } else {
            obj[nType] = (payload) =>
                payload &&
                typeof payload === "object" &&
                args.every(({ id, test }) => test(payload[id])) &&
                Object.keys(payload).length === args.length
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
