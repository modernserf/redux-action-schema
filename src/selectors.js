import shallowequal from "shallowequal"
import { keyBy, id } from "./util"
import { duplicateSelectorError, unknownSelectorError } from "./errors"
const { types } = require("./types")

export function createSelectors (specs, { mapSelectorName } = {}) {
    const fields = buildFields(specs)
    const selectors = {}
    const createSelector = createSelectorCreator(selectors)

    const selectorArr = fields.map(
        createSelectorField(mapSelectorName, createSelector))

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
        ["reducers", types.ObjectOf(types.Function)]])],
    ["selector", types([
        ["dependencies", types.ArrayOf(types.String)],
        ["selector", types.Function]])],
    ["asyncSelector", types([
        ["dependencies", types.ArrayOf(types.String)],
        ["selector", types.Function]])],
])

export function selector (dependencies, selector) {
    return Selector.selector({ dependencies, selector })
}

export function reducer (reducers, initState) {
    return Selector.reducerMap({ reducers, initState })
}

export function asyncSelector (dependencies, selector) {
    return Selector.asyncSelector({ dependencies, selector })
}

const SelectorDef = types.Record([
    ["id", types.String],
    ["doc", types.String, "optional"],
    ["selector", types.OneOfType([
        types.Function, // raw reducer
        Selector,
    ])],
    ["returnType", types.Type, "optional"],
])

function buildFields (baseFields) {
    // TODO throw error on invalid definition
    return baseFields.map((def) => {
        const field = SelectorDef.toObject(def)
        if (typeof field.selector === "function") {
            field.selector = Selector.plainReducer({
                reducer: field.selector,
            })
        }
        return field
    })
}

function createSelectorField (mapName = id, createSelector) {
    return (field) => {
        const id = mapName(field.id)
        const { payload } = field.selector
        const selector = ({
            plainReducer: (state) => state[id],
            reducerMap: (state) => state[id],
            asyncSelector: (state) => state[id],
            selector: createSelector(
                payload.dependencies,
                payload.selector),
        })[field.selector.type]

        selector.id = id
        selector.field = field
        return selector
    }
}

// (selectors) => ([ids], combineFn) => (state) => data
// (selectors) => ({id: renamedId}, combineFn) => (state) => data
export function createSelectorCreator (allSelectors) {
    return (depNames, fn = id) => {
        let lastDeps
        let lastValue
        const depMap = Array.isArray(depNames)
            ? keyBy(depNames, id, duplicateSelectorError)
            : depNames

        return (state) => {
            const deps = {}
            for (const key in depMap) {
                if (!allSelectors[key]) {
                    throw unknownSelectorError(key)
                }
                const mappedKey = depMap[key]
                deps[mappedKey] = allSelectors[key](state)
            }

            if (shallowequal(deps, lastDeps)) { return lastValue }

            lastDeps = deps
            lastValue = fn(deps)
            return lastValue
        }
    }
}
