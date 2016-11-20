import { createSelectorCreator } from "./selectors"
const { types } = require("./types")

export const Promise = types.Variant([
    ["pending"],
    ["resolved", "data", types.Any],
    ["rejected", "error", types.Any],
])

export const promiseActions = types.Variant([
    ["requestedPromise", types([
        ["id", types.String]])],
    ["resolvedPromise", types([
        ["id", types.String],
        ["data", types.Any]])],
    ["rejectedPromise", types([
        ["id", types.String],
        ["error", types.Any]])],
], { mapType: (type) => `redux-action-schema/${type}` })

const {
    requestedPromise, resolvedPromise, rejectedPromise,
} = promiseActions

export function createPromiseMiddleware (selectors) {
    const promiseHandlers = Object.keys(selectors)
        .map((id) => selectors[id])
        .filter(({ field }) => field.selector.type === "asyncSelector")
        .map((selector) => createPromiseChangeHandler(selector, selectors))

    return ({ dispatch, getState }) => {
        return (next) => (action) => {
            const res = next(action)

            promiseHandlers.forEach((onChange) => {
                onChange(dispatch, getState)
            })
            return res
        }
    }
}

function createPromiseChangeHandler ({ id, field }, allSelectors) {
    const { dependencies } = field.selector.payload
    const select = createSelectorCreator(allSelectors)(dependencies)

    let lastState
    let lastPromise
    return (dispatch, getState) => {
        const myState = select(getState())
        if (myState === lastState) { return }
        lastState = myState
        dispatch(requestedPromise({ id }))
        const promise = field.selector.payload.selector(myState)
        lastPromise = promise
        promise.then((data) => {
            if (promise === lastPromise) {
                dispatch(resolvedPromise({ id, data }))
            }
        }, (error) => {
            if (promise === lastPromise) {
                dispatch(rejectedPromise({ id, error }))
            }
        })
    }
}

export function createPromiseReducer (id, createReducerCreator) {
    const createReducer = createReducerCreator(promiseActions)

    const isValid = (payload) => payload.id === id

    return createReducer({
        requestedPromise: (state, payload) => isValid(payload)
            ? Promise.pending()
            : state,
        resolvedPromise: (state, payload) => isValid(payload)
            ? Promise.resolved(payload.data)
            : state,
        rejectedPromise: (state, payload) => isValid(payload)
            ? Promise.rejected(payload.error)
            : state,
    }, Promise.pending())
}
