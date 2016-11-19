import { connect } from "react-redux"
import { createSelectorCreator } from "./selectors"
import { pickAndRename, pick } from "./util"

export function createConnector (actionSchema, selectorSchema) {
    const createSelector = createSelectorCreator(selectorSchema)

    return (selections, actions, merge) => {
        const selector = createSelector(selections)

        const boundActions = Array.isArray(actions)
            ? pick(actionSchema, actions)
            : pickAndRename(actionSchema, actions)

        return merge
            ? connect(selector, boundActions, merge)
            : connect(selector, boundActions)
    }
}
