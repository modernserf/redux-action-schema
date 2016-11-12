import { connect } from "react-redux"
import { createDepsSelector } from "./selectors"
import { id } from "./util"

export function createConnector (actionSchema, selectorSchema) {
    const select = (dependencies, mapper = id) =>
        createDepsSelector(dependencies, mapper, selectorSchema)

    return (selections, actions, merge) => {
        const selector = Array.isArray(selections)
            ? select(selections)
            : selectAndRename(select, selections)

        const boundActions = Array.isArray(actions)
            ? pick(actionSchema, actions)
            : pickAndRename(actionSchema, actions)

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
