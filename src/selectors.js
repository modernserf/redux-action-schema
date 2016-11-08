import { combineReducers } from 'redux'

export function createSchema (specs) {
    // TODO: handle types
    const specMap = specs.reduce((m, [key, ...rest]) => {
        m[key] = rest; return m
    }, {})
    return {
        createReducer: createReducer(specMap),
    }
}

function createReducer (schema) {
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
            if (typeof reducer === 'function') {
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
    return function (deps, mapper = id) {
        return mapper(createDepsSelector(deps, selectors))
    }
}

function splitEnd (arr) {
    return [
        arr.slice(0, arr.length - 2),
        arr[arr.length - 1],
    ]
}
