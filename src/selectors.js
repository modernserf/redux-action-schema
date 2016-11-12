import shallowequal from "shallowequal"
import { types } from "./types/index"
import { keyBy, id } from "./util"
import { duplicateSelectorError, unknownSelectorError } from "./errors"

export function createSelectors (specs, { mapSelectorName } = {}) {
    const fields = buildFields(specs)
    const selectors = {}
    const selectorArr = fields.map(
        createSelector(mapSelectorName, selectors))

    Object.assign(
        selectors,
        keyBy(selectorArr, ({ name }) => name, duplicateSelectorError))
    return selectors
}

const Selector = types.Variant([
    ["plainReducer",
        ["reducer", types.Function]],
    ["reducerMap",
        ["initState", types.Any],
        ["reducers", types.Object]],
    ["selector",
        ["dependencies", types.ArrayOf(types.String)],
        ["selector", types.Function]],
])

export function selector (dependencies, selector) {
    return Selector.creators.selector({ dependencies, selector })
}

export function reducer (reducers, initState) {
    return Selector.creators.reducerMap({ reducers, initState })
}

const SelectorDef = types.Record([
    ["name", types.String],
    ["doc", types.String, "optional"],
    ["selector", types.OneOfType([
        types.Function, // raw reducer
        Selector,
    ])],
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

function createSelector (field, mapName = id, allSelectors) {
    const name = mapName(field.name)
    const { payload } = field.selector
    const selector = ({
        plainReducer: (state) => state[name],
        reducerMap: (state) => state[name],
        selector: createDepsSelector(
            payload.dependencies,
            payload.selector,
            allSelectors),
    })[field.selector.type]

    selector.name = name
    selector.field = field
    return selector
}

export function createDepsSelector (dependencies, fn, allSelectors) {
    let lastDeps
    let lastValue
    return (state) => {
        const deps = dependencies.reduce((coll, dep) => {
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
