const test = require("tape")
const { makeSchema, types } = require("../src/index.js")
const { createStore, applyMiddleware } = require("redux")

test("create middleware", (t) => {
    const { createReducer, createMiddleware } = makeSchema([
        ["foo"],
        ["bar", types.String],
    ])

    const initState =  { count: 0, message: "hello" }

    const reducer = createReducer({
        foo: (state) => state,
        bar: (state) => state,
    })

    const middleware = createMiddleware({
        onError: () => { throw new Error("unknown action") }
    })

    const store = createStore(reducer, applyMiddleware(middleware))

    t.doesNotThrow(() => {
        store.dispatch({ type: "foo" })
    })
    t.doesNotThrow(() => {
        store.dispatch({ type: "EFFECT_TRIGGERED" })
    })
    t.doesNotThrow(() => {
        store.dispatch({ type: "bar", payload: "world", meta: { a: 1 }})
    })
    t.throws(() => {
        store.dispatch({ type: "bar", payload: { a: "bad argument" }})
    })
    t.throws(() => {
        store.dispatch({ type: "foo", payload: "arg" })
    })
    t.throws(() => {
        store.dispatch({ type: "quux" })
    })
    t.end()
})

test("create middleware with unchecked payloads", (t) => {
    const { createReducer, createMiddleware } = makeSchema([
        ["foo"],
        ["bar", types.String],
    ])

    const initState =  { count: 0, message: "hello" }

    const reducer = createReducer({
        foo: (state) => state,
        bar: (state) => state,
    })

    const middleware = createMiddleware({
        ignorePayloads: true,
        onError: () => { throw new Error("unknown action") }
    })

    const store = createStore(reducer, applyMiddleware(middleware))

    t.doesNotThrow(() => {
        store.dispatch({ type: "foo" })
    })
    t.doesNotThrow(() => {
        store.dispatch({ type: "EFFECT_TRIGGERED" })
    })
    t.doesNotThrow(() => {
        store.dispatch({ type: "bar", payload: "world", meta: { a: 1 }})
    })
    t.doesNotThrow(() => {
        store.dispatch({ type: "bar", payload: { a: "bad argument" }})
    })
    t.throws(() => {
        store.dispatch({ type: "quux" })
    })
    t.end()
})

test("create middleware with ignored actions", (t) => {
    const { createReducer, createMiddleware } = makeSchema([
        ["foo"],
        ["bar", types.String],
    ])

    const initState =  { count: 0, message: "hello" }

    const reducer = createReducer({
        foo: (state) => state,
        bar: (state) => state,
    })

    const middleware = createMiddleware({
        ignoreActions: ["baz", "quux"],
        onError: () => { throw new Error("unknown action") }
    })

    const store = createStore(reducer, applyMiddleware(middleware))

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
