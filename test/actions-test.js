const test = require("tape")
const { createSchema, types } = require("../dist/index.js")

test("makes action map", (t) => {
    const { actions } = createSchema([
        ["foo"],
        ["bar"],
        ["baz"],
    ])

    t.deepEquals(actions, { foo: "foo", bar: "bar", baz: "baz" })
    t.end()
})

test("uses default namespace if namespace undefined", (t) => {
    const { actions } = createSchema([
        ["foo"],
        ["bar"],
        ["baz"],
    ], { namespace: undefined })

    t.deepEquals(actions, { foo: "foo", bar: "bar", baz: "baz" })
    t.end()
})

test("makes action map with namespace string", (t) => {
    const { actions } = createSchema([
        ["foo"],
        ["bar"],
        ["baz"],
    ], { namespace: "ns" })

    t.deepEquals(actions, {
        foo: "ns_foo", bar: "ns_bar", baz: "ns_baz",
    })
    t.end()
})

test("makes action map with namespace func", (t) => {
    const { actions } = createSchema([
        ["foo"],
        ["bar"],
        ["baz"],
    ], { namespace: (t) => `ns_${t}` })

    t.deepEquals(actions, {
        foo: "ns_foo", bar: "ns_bar", baz: "ns_baz",
    })
    t.end()
})

test("throws on invalid namespace parameter", (t) => {
    t.throws(() => {
        createSchema([
            ["foo"],
            ["bar"],
            ["baz"],
        ], { namespace: { foo: "bar" } })
    })
    t.end()
})

test("throws on namespace collision", (t) => {
    t.throws(() => {
        createSchema([
            ["foo"],
            ["bar"],
            ["baz"],
        ], { namespace: (t) => "same" })
    })
    t.end()
})

test("makes action creators", (t) => {
    const { actionCreators } = createSchema([
        ["foo"],
        ["bar", types.String],
        ["baz", ["a", types.Number], ["b", types.Number]],
    ])
    t.deepEquals(actionCreators.foo(),
        { type: "foo", payload: undefined })
    t.deepEquals(actionCreators.bar("value"),
        { type: "bar", payload: "value" })
    t.deepEquals(actionCreators.baz({ a: 1, b: 2 }),
        { type: "baz", payload: { a: 1, b: 2 } })
    t.end()
})

test("makes positional argument action creators", (t) => {
    const { actionCreators: ac } = createSchema([
        ["foo"],
        ["bar", types.String],
        ["baz", ["a", types.Number], ["b", types.Number]],
    ])
    t.deepEquals(ac.foo.byPosition("any", "value"),
        { type: "foo", payload: undefined })
    t.deepEquals(ac.bar.byPosition("value", "another"),
        { type: "bar", payload: "value" })
    t.deepEquals(ac.baz.byPosition(0, 2, 3),
        { type: "baz", payload: { a: 0, b: 2 } })
    t.end()
})

test("makes action creators with alternate format", (t) => {
    const format = (type, payload) => payload === undefined
        ? [type]
        : [type, payload]
    const unformat = ([type, payload]) => ({ type, payload })
    const { actionCreators: ac } = createSchema([
        ["foo"],
        ["bar", types.String],
        ["baz", ["a", types.Number], ["b", types.Number]],
    ], { format, unformat })

    t.deepEquals(ac.foo(), ["foo"])
    t.deepEquals(ac.bar("value"), ["bar", "value"])
    t.deepEquals(ac.baz({ a: 1, b: 2 }), ["baz", {a: 1, b: 2}])
    t.deepEquals(ac.baz.byPosition(0, 2), ["baz", {a: 0, b: 2}])
    t.end()
})

test("makes namespaced action creators", (t) => {
    const { actionCreators: ac } = createSchema([
        ["foo"],
        ["bar", types.String],
        ["baz", ["a", types.Number], ["b", types.Number]],
    ], { namespace: "ns" })

    t.deepEquals(ac.foo(),
        { type: "ns_foo", payload: undefined })
    t.deepEquals(ac.bar("value"),
        { type: "ns_bar", payload: "value" })
    t.deepEquals(ac.baz({ a: 1, b: 2 }),
        { type: "ns_baz", payload: { a: 1, b: 2 } })
    t.end()
})

test("tests actions for validity", (t) => {
    const { test: testAction } = createSchema([
        ["foo"],
        ["bar", types.String],
        ["baz", ["a", types.Number], ["b", types.Number]],
    ])

    t.false(testAction({ type: "unknown" }))

    t.true(testAction({ type: "foo" }))
    t.true(testAction({ type: "foo", meta: "something" }))
    t.false(testAction({ type: "foo", payload: {} }))

    t.true(testAction({ type: "bar", payload: "value" }))
    t.false(testAction({ type: "bar" }))
    t.false(testAction({ type: "bar", payload: { a: 3 } }))

    t.true(testAction({ type: "baz", payload: { a: 1, b: 2 } }))
    t.false(testAction({ type: "baz" }))
    t.false(testAction({ type: "baz", payload: { a: 1, b: 2, c: 3 } }))
    t.false(testAction({ type: "baz", payload: { b: 2 } }))
    t.false(testAction({ type: "baz", payload: "value" }))
    t.end()
})
