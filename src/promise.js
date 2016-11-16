import { createDepsSelector } from "./selectors"
const { types } = require("./types")

export const Promise = types.Variant([
    ["pending"],
    ["resolved", "data", types.Any],
    ["rejected", "error", types.Any],
])

export const promiseActions = types.Variant([
    ["requestedPromise", ["id", types.String]],
    ["resolvedPromise",
        ["id", types.String],
        ["data", types.Any]],
    ["rejectedPromise",
        ["id", types.String],
        ["error", types.Any]],
], { mapType: (type) => `redux-action-schema/${type}` })

const {
    requestedPromise, resolvedPromise, rejectedPromise,
} = promiseActions.creators

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
    const depsSelector = createDepsSelector(
        field.selector.payload.dependencies, (x) => x, allSelectors)

    let lastState
    let lastPromise
    return (dispatch, getState) => {
        const myState = depsSelector(getState())
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
    const createReducer = createReducerCreator(promiseActions.creators)

    const isValid = (payload) => payload.id === id

    return createReducer({
        requestedPromise: (state, payload) => isValid(payload)
            ? Promise.creators.pending()
            : state,
        resolvedPromise: (state, payload) => isValid(payload)
            ? Promise.creators.resolved(payload.data)
            : state,
        rejectedPromise: (state, payload) => isValid(payload)
            ? Promise.creators.rejected(payload.error)
            : state,
    }, Promise.creators.pending())
}
