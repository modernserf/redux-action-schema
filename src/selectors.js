import { combineReducers } from "redux"
import { connect } from "react-redux"

export function createSelectorSchema (specs) {
    // TODO: handle types
    const specMap = specs.reduce((m, [key, ...rest]) => {
        m[key] = rest; return m
    }, {})
    return {
        createRootReducer: createRootReducer(specMap),
    }
}

function createRootReducer (schema) {
    return function (reducers) {
        const baseReducers = {}
        const selectors = {}

        for (const key in schema) {
            if (!reducers[key]) {
                throw new Error(`Unknown selector ${key}`)
            }
        }
        for (const key in reducers) {
            if (!schema[key]) {
                throw new Error(`Selector "${key}" not in schema`)
            }
            const reducer = reducers[key]

            // plain reducer
            if (typeof reducer === "function") {
                baseReducers[key] = reducer
                selectors[key] = (state) => state[key]
                continue
            }

            // selector
            const [deps, fn] = splitEnd(reducer)
            const selectDeps = createDepsSelector(deps, selectors)
            selectors[key] = (state) => fn(selectDeps(state))
        }

        const mainReducer = combineReducers(baseReducers)

        const select = createSelect(selectors)
        mainReducer.select = select
        return mainReducer
    }
}

// TODO: memo
function createDepsSelector (deps, selectors) {
    return (state) => deps.reduce((coll, dep) => {
        if (!selectors[dep]) {
            throw new Error(`Unknown selector ${dep}`)
        }
        coll[dep] = selectors[dep](state)
        return coll
    }, {})
}

const id = (x) => x

function createSelect (selectors) {
    return function select (deps, mapper = id) {
        const selector = createDepsSelector(deps, selectors)
        return (state) => mapper(selector(state))
    }
}

function splitEnd (arr) {
    return [
        arr.slice(0, arr.length - 1),
        arr[arr.length - 1],
    ]
}

export function createConnector (actionSchema, select) {
    return (selections, actions, merge) => {
        const selector = Array.isArray(selections)
            ? select(selections)
            : selectAndRename(select, selections)

        const boundActions = Array.isArray(actions)
            ? pick(actionSchema.actionCreators, actions)
            : pickAndRename(actionSchema.actionCreators, actions)

        return merge
            ? connect(selector, boundActions, merge)
            : connect(selector, boundActions)
    }
}

function pickAndRename (source, nameMap) {
    const res = {}
    for (const key in nameMap) { // eslint-disable-line guard-for-in
        const nextKey = nameMap[key]
        res[nextKey] = source[key]
    }
    return res
}

function pick (source, names) {
    const res = {}
    for (var i = 0; i < names.length; i++) {
        res[names[i]] = source[names[i]]
    }
    return res
}

function selectAndRename (select, nameMap) {
    return select(Object.keys(nameMap), (data) => pickAndRename(data, nameMap))
}
