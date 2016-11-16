const test = require("tape")
const { createStore, applyMiddleware } = require("redux")
const {
    createSelectors, createRootReducer, createPromiseMiddleware,
    asyncSelector,
} = require("../index")

test("asyncSelector", (t) => {
    const fetch = mockPromise("value", t)

    const simplePromise = asyncSelector(
        ["foo", "bar"],
        ({ foo, bar }) => fetch(`${foo}/${bar}`))

    const actions = {}

    const selectors = createSelectors([
        ["foo", () => "foo"],
        ["bar", () => "bar"],
        ["simplePromise", simplePromise],
    ])

    const rootReducer = createRootReducer(actions, selectors)
    const middleware = createPromiseMiddleware(selectors)
    const store = createStore(rootReducer, applyMiddleware(middleware))

    t.deepEquals(selectors.simplePromise(store.getState()),
        { type: "pending" })

    store.dispatch({ type: "@@INIT" })

    fetch.resolve(() => {
        t.deepEquals(
            selectors.simplePromise(store.getState()),
            { type: "resolved", payload: "value" })
        t.end()
    })
})

test("asyncSelector errors", (t) => {
    const fetch = mockPromise("value", t)

    const simplePromise = asyncSelector(
        ["foo", "bar"],
        ({ foo, bar }) => fetch(`${foo}/${bar}`))

    const actions = {}

    const selectors = createSelectors([
        ["foo", () => "foo"],
        ["bar", () => "bar"],
        ["simplePromise", simplePromise],
    ])

    const rootReducer = createRootReducer(actions, selectors)
    const middleware = createPromiseMiddleware(selectors)
    const store = createStore(rootReducer, applyMiddleware(middleware))

    t.deepEquals(selectors.simplePromise(store.getState()),
        { type: "pending" })

    store.dispatch({ type: "@@init" })

    fetch.reject(() => {
        t.deepEquals(
            selectors.simplePromise(store.getState()),
            { type: "rejected", payload: "value" })
        t.end()
    })
})

function mockPromise (returnValue, t) {
    const fn = function (arg) {
        fn.argsReceived.push(arg)

        return {
            then: (resolve, reject) => {
                fn.thenArgs = { resolve, reject }
            },
        }
    }
    fn.argsReceived = []
    fn.resolve = (callback) => {
        Promise.resolve(fn.thenArgs.resolve(returnValue)).then(callback)
    }
    fn.reject = (callback) => {
        Promise.reject(fn.thenArgs.reject(returnValue)).catch(callback)
    }

    return fn
}
