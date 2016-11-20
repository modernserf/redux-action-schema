const test = require("tape")
const {
    createActions, createActionMonitor, types,
} = require("../index.js")
const { createStore, applyMiddleware } = require("redux")
const thunk = require("redux-thunk").default

function createStoreWithMiddleware (def, options) {
    const actions = createActions(def)
    const reducer = (state = {}) => state

    const actionMonitor = createActionMonitor(actions, options)
    const store = createStore(reducer, applyMiddleware(actionMonitor))
    return store
}

test("handle unknown action", (t) => {
    const store = createStoreWithMiddleware([
        ["foo"],
        ["bar", types.String],
    ], {
        onUnknownAction: () => { throw new Error("unknown action") },
    })

    t.doesNotThrow(() => {
        store.dispatch({ type: "foo" })
    })
    t.doesNotThrow(() => {
        store.dispatch({ type: "EFFECT_TRIGGERED" })
    })
    t.doesNotThrow(() => {
        store.dispatch({ type: "bar", payload: "world", meta: { a: 1 } })
    })
    t.throws(() => {
        store.dispatch({ type: "quux" })
    })
    t.end()
})

test("handle bad payload", (t) => {
    const store = createStoreWithMiddleware([
        ["foo"],
        ["bar", types.String],
    ], {
        onMismatchedPayload: () => { throw new Error("mismatched payload") },
    })

    t.doesNotThrow(() => {
        store.dispatch({ type: "foo" })
    })
    t.doesNotThrow(() => {
        store.dispatch({ type: "EFFECT_TRIGGERED" })
    })
    t.doesNotThrow(() => {
        store.dispatch({ type: "bar", payload: "world", meta: { a: 1 } })
    })
    t.throws(() => {
        store.dispatch({ type: "bar", payload: { a: "bad argument" } })
    }, "payload when none expected")
    t.throws(() => {
        store.dispatch({ type: "foo", payload: "arg" })
    }, "payload doesn't match")
    t.end()
})

test("create middleware with filtered actions", (t) => {
    const ignored = new Set(["baz", "quux"])

    const store = createStoreWithMiddleware([
        ["foo"],
        ["bar", types.String],
    ], {
        filterActions: (action) => !ignored.has(action.type),
        onUnknownAction: () => { throw new Error("unknown action") },
    })

    t.doesNotThrow(() => {
        store.dispatch({ type: "foo" })
    })
    t.throws(() => {
        store.dispatch({ type: "EFFECT_TRIGGERED" })
    })
    t.doesNotThrow(() => {
        store.dispatch({ type: "baz" })
    })
    t.end()
})

test("works with other middleware actions", (t) => {
    const actions = createActions([
        ["foo"],
        ["bar", types.String],
    ])
    const reducer = (state = {}) => state

    const actionMonitor = createActionMonitor(actions, {
        onUnknownAction: () => { throw new Error("unknown action") },
    })

    const store = createStore(reducer, applyMiddleware(actionMonitor, thunk))

    const fooThunk = () => (dispatch) => {
        dispatch({ type: "foo" })
    }

    const quuxThunk = () => (dispatch) => {
        dispatch({ type: "quux" })
    }

    t.doesNotThrow(() => {
        store.dispatch(fooThunk())
    })

    t.throws(() => {
        store.dispatch(quuxThunk())
    })
    t.end()
})
