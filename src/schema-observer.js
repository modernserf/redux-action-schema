import { types } from "./types/index"

const nullType = (val) => val === undefined || val === null

// not perfect, but probably sufficient
// const pojo = (obj) => obj && obj.constructor === Object

const basicTypes = [
    nullType, types.String, types.Number, types.Boolean, types.Array, types.Object,
]

export function createSchemaObserver () {
    const receivedActions = []

    const middleware = function () {
        return (next) => (action) => {
            receivedActions.push(action)
            next(action)
        }
    }

    middleware.receivedActions = () => {
        return receivedActions.reduce((map, action) => {
            if (!action || !action.type) { return map }

            const { type, payload } = action
            if (map[type]) {
                map[type].push(payload)
            } else {
                map[type] = [payload]
            }
            return map
        }, {})
    }

    middleware.receivedTypes = () => {
        const actions = middleware.receivedActions()

        const receivedTypes = {}
        for (const key in actions) {
            receivedTypes[key] = findType(actions[key])
        }
        return receivedTypes
    }

    middleware.schemaDefinitionString = () => {
        return defString(middleware.receivedTypes())
    }

    return middleware
}

function findType (payloads) {
    const typeList = payloads.reduce((t, payload) => {
        t = t || [guess(payload)]

        // match existing type
        for (let i = 0; i < t.length; i++) {
            if (t[i].test(payload)) { return t }
        }

        // add new type
        t.push(guess(payload))
        return t
    }, [])

    if (typeList.length === 1 && typeList[0].test === nullType) { return [] }

    if (typeList.every((t) => t.args)) {
        return fitTypesPerArg(typeList)
    }

    return [Object.assign(fitTypes(typeList), { wholePayload: true })]
}

function guess (payload, depth = 0) {
    // if (!depth && pojo(payload)) {
        // const args = Object.keys(payload)
            // .map((key) => ({ id: key, test: guess(payload[key], 1).test }))
        // return { args, test: testArgs(args) }
    // }

    for (let i = 0; i < basicTypes.length; i++) {
        if (basicTypes[i](payload)) { return { test: basicTypes[i] } }
    }

    // idk, functions maybe?
    return { test: types.Any }
}

function fitTypesPerArg (typeList) {
    if (typeList.length === 1) { return typeList[0].args }

    // list list key args -> map key list args
    const argMap = typeList.reduce((map, { args }) => {
        args.forEach((arg) => {
            const { id, test } = arg
            if (map[id]) {
                // check for dupe test
                for (let j = 0; j < map[id].length; j++) {
                    const { test: matchTest } = map[id][j]
                    if (test === matchTest) { return }
                }
                // add new test
                map[id].push(arg)
            } else {
                // init tests
                map[id] = [arg]
            }
        })

        return map
    }, {})

    const possibleKeys = Object.keys(argMap)
    const everNull = typeList.reduce((en, { args }) => {
        const hasArg = args.reduce((m, v) => {
            m[v.id] = v
            return m
        }, {})

        return possibleKeys.reduce((en_, key) => {
            if (!hasArg[key]) { en_[key] = true }
            return en_
        }, en)
    }, {})

    for (const key in everNull) {
        argMap[key].push({ id: key, test: nullType })
    }

    // map key list args -> list key test
    const argDest = []
    for (const key in argMap) {
        const param = fitTypes(argMap[key])
        argDest.push(Object.assign(param, { id: key }))
    }
    return argDest
}

function fitTypes (typeList) {
    if (typeList.length === 1) { return typeList[0] }

    const optional = typeList.some((t) => t.test === nullType)

    const hasAnyType = typeList.some((t) => t.test === types.Any)
    if (hasAnyType) {
        return optional
            ? { test: types.Any.optional }
            : { test: types.Any }
    }

    const valueTypes = typeList
        .map((t) => t.args ? types.Object : t.test)
        .filter((t) => t !== nullType)
    const singleValue = valueTypes.length === 1

    if (optional) {
        return singleValue
           ? { test: valueTypes[0].optional }
           : {
               test: types.OneOfType.optional.apply(null, valueTypes),
               subTypes: valueTypes,
               optional: true,
           }
    }

    return singleValue
        ? { test: valueTypes[0] }
        : {
            test: types.OneOfType.apply(null, valueTypes),
            subTypes: valueTypes,
        }
}

const tab = "    "

function defString (actionMap) {
    const actions = Object.keys(actionMap)
        .map((type) => ({ type, args: actionMap[type] }))

    return `
createSchema([
    ${actions.map(printAction).join(`,\n${tab}`)}
])`
}

function printAction (action) {
    return `["${action.type}"${printArgs(action.args)}]`
}

function printArgs (args) {
    if (!args.length) { return "" }
    if (args.length === 1 && args[0].wholePayload) {
        return `, ${printFnBlock(args[0])}`
    }
    return [""].concat(args.map(printNamedArg)).join(`,\n${tab}${tab}`)
}

const printFn = (fn) => `types.${fn._typeName}`

function printFnBlock (argTest) {
    if (argTest.subTypes) {
        const subTypesStr = argTest.subTypes.map(printFn).join(", ")
        const optStr = argTest.optional ? ".optional" : ""
        return `types.OneOfType${optStr}(${subTypesStr})`
    }
    return printFn(argTest.test)
}

function printNamedArg (arg) {
    return `["${arg.id}", ${printFnBlock(arg)}]`
}
