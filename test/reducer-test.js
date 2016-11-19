const test = require("tape")
const {
    createActions, createReducerCreator, types,
    createSelectors, createRootReducer, reducer, selector,
} = require("../index.js")

const merge = (a, b) => Object.assign({}, a, b)

test("create reducer", (t) => {
    const createReducer = createReducerCreator(createActions([
        ["foo"],
        ["bar", types.String],
        ["baz", types([
            ["a", types.Number],
            ["b", types.Number]])],
    ]))

    const initState = { count: 0, message: "hello" }

    const reducer = createReducer({
        foo: (state) => merge(state, { count: state.count + 1 }),
        bar: (state, message) => merge(state, { message }),
        baz: (state, { a, b }, { meta }) =>
            merge(state, { count: a + b, message: meta || state.message }),
    }, initState)

    t.equal(initState, reducer(undefined, { type: "@@INIT" }))
    t.equal(initState, reducer(initState, { type: "@@INIT" }))
    t.deepEquals({ count: 1, message: "hello" },
        reducer(initState, { type: "foo" }))
    t.deepEquals({ count: 0, message: "world" },
        reducer(initState, { type: "bar", payload: "world" }))
    t.deepEquals({ count: 3, message: "hello" },
        reducer(initState, { type: "baz", payload: { a: 1, b: 2 } }))
    t.deepEquals({ count: 3, message: "world" },
        reducer(initState,
            { type: "baz", payload: { a: 1, b: 2 }, meta: "world" }))
    t.end()
})

test("throws when reducer created with unknown action", (t) => {
    const createReducer = createReducerCreator(createActions([
        ["foo"],
    ]))

    t.throws(() => {
        createReducer({
            foo: (state) => state,
            quux: (state) => state,
        })
    })
    t.end()
})

test("throws if reducer created with non-function", (t) => {
    const createReducer = createReducerCreator(createActions([
        ["foo"],
        ["bar", types.String],
    ]))

    t.throws(() => {
        createReducer({
            foo: (state) => state,
            bar: "a string",
        })
    })
    t.end()
})

test("create namespaced reducer", (t) => {
    const createReducer = createReducerCreator(createActions([
        ["foo"],
        ["bar", types.String],
    ], { mapActionType: (type) => `ns_${type}` }))

    const initState = { count: 0, message: "hello" }

    const reducer = createReducer({
        foo: (state) => merge(state, { count: state.count + 1 }),
        bar: (state, message) => merge(state, { message }),
    }, initState)

    t.equals(initState, reducer(initState, { type: "foo" }))
    t.deepEquals({ count: 1, message: "hello" },
        reducer(initState, { type: "ns_foo" }))
    t.deepEquals({ count: 0, message: "world" },
        reducer(initState, { type: "ns_bar", payload: "world" }))
    t.end()
})

test("createRootReducer", (t) => {
    const actions = createActions([
        ["foo"],
        ["bar", types.String],
        ["baz", types([
            ["a", types.Number],
            ["b", types.Number]])],
    ])

    const selectors = createSelectors([
        ["quux", (state = "") => state],
        ["plugh", reducer({
            foo: ({ a, b }) => ({ a: +1, b: +1 }),
            baz: (_, { a, b }) => ({ a, b }),
        }, { a: 0, b: 0 })],
        ["xyzzy", selector(
            ["quux", "plugh"],
            ({ quux, plugh }) => ({ quux, a: plugh.a }))],
    ])

    const rootReducer = createRootReducer(actions, selectors)

    const initState = rootReducer(undefined, { type: "@@init" })

    t.deepEquals(initState, {
        quux: "",
        plugh: { a: 0, b: 0 },
    })

    t.deepEquals(selectors.quux(initState), "")
    t.deepEquals(selectors.plugh(initState), { a: 0, b: 0 })
    t.deepEquals(selectors.xyzzy(initState), { quux: "", a: 0 })

    const nextState = rootReducer(initState, actions.foo())
    t.deepEquals(selectors.plugh(nextState), { a: 1, b: 1 })
    t.deepEquals(selectors.xyzzy(nextState), { quux: "", a: 1 })

    t.end()
})
