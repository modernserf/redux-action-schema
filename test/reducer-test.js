const test = require("tape")
const { makeSchema, types } = require("../dist/index.js")

const merge = (a, b) => Object.assign({}, a, b)

test("create reducer", (t) => {
    const { createReducer } = makeSchema([
        ["foo"],
        ["bar", types.String],
        ["baz", ["a", types.Number], ["b", types.Number]],
    ])

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
    const { createReducer } = makeSchema([
        ["foo"],
    ])

    t.throws(() => {
        createReducer({
            foo: (state) => state,
            quux: (state) => state,
        })
    })
    t.end()
})

test("throws if reducer created with non-function", (t) => {
    const { createReducer } = makeSchema([
        ["foo"],
        ["bar", types.String],
    ])

    t.throws(() => {
        createReducer({
            foo: (state) => state,
            bar: "a string",
        })
    })
    t.end()
})

test("create namespaced reducer", (t) => {
    const { createReducer } = makeSchema([
        ["foo"],
        ["bar", types.String],
    ], { namespace: "ns" })

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
