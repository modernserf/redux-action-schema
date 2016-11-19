import shallowequal from "shallowequal"
import { keyBy, id } from "./util"
import { duplicateSelectorError, unknownSelectorError } from "./errors"
const { types } = require("./types")

export function createSelectors (specs, { mapSelectorName } = {}) {
    const fields = buildFields(specs)
    const selectors = {}
    const selectorArr = fields.map(
        createSelector(mapSelectorName, selectors))

    Object.assign(
        selectors,
        keyBy(selectorArr, ({ id }) => id, duplicateSelectorError))
    return selectors
}

const Selector = types.Variant([
    ["plainReducer", types([
        ["reducer", types.Function]])],
    ["reducerMap", types([
        ["initState", types.Any],
        ["reducers", types.Object]])],
    ["selector", types([
        ["dependencies", types.ArrayOf(types.String)],
        ["selector", types.Function]])],
    ["asyncSelector", types([
        ["dependencies", types.ArrayOf(types.String)],
        ["selector", types.Function]])],
])

export function selector (dependencies, selector) {
    return Selector.creators.selector({ dependencies, selector })
}

export function reducer (reducers, initState) {
    return Selector.creators.reducerMap({ reducers, initState })
}

export function asyncSelector (dependencies, selector) {
    return Selector.creators.asyncSelector({ dependencies, selector })
}

const SelectorDef = types.Record([
    ["id", types.String],
    ["doc", types.String, "optional"],
    ["selector", types.OneOfType([
        types.Function, // raw reducer
        Selector,
    ])],
    ["returnType", types.Object, "optional"],
])

function buildFields (baseFields) {
    // TODO throw error on invalid definition
    return baseFields.map((def) => {
        const field = SelectorDef.toObject(def)
        if (typeof field.selector === "function") {
            field.selector = Selector.creators.plainReducer({
                reducer: field.selector,
            })
        }
        return field
    })
}

export function createSelector (mapName = id, allSelectors) {
    return (field) => {
        const id = mapName(field.id)
        const { payload } = field.selector
        const selector = ({
            plainReducer: (state) => state[id],
            reducerMap: (state) => state[id],
            asyncSelector: (state) => state[id],
            selector: createDepsSelector(
                payload.dependencies,
                payload.selector,
                allSelectors),
        })[field.selector.type]

        selector.id = id
        selector.field = field
        return selector
    }
}

export function createDepsSelector (dependencies, fn, allSelectors) {
    let lastDeps
    let lastValue
    return (state) => {
        const deps = dependencies.reduce((coll, dep) => {
            // TODO: is this lookup worth caching?
            if (!allSelectors[dep]) {
                throw unknownSelectorError(dep)
            }
            coll[dep] = allSelectors[dep](state)
            return coll
        }, {})

        if (shallowequal(deps, lastDeps)) { return lastValue }

        lastDeps = deps
        lastValue = fn(deps)
        return lastValue
    }
}
