const test = require("tape")
const { createActions, combineActions, types } = require("../dist/index.js")

test("makes action creators", (t) => {
    const actions = createActions([
        ["foo"],
        ["bar", types.String],
        ["baz", "has a comment",
            ["a", types.Number],
            ["b", types.Number]],
    ])
    t.deepEquals(actions.foo(), { type: "foo" })
    t.deepEquals(actions.bar("payload"), { type: "bar", payload: "payload" })
    t.deepEquals(actions.baz({ a: 10, b: 20 }),
        { type: "baz", payload: { a: 10, b: 20 } })

    t.end()
})

test("action creators have extra fields", (t) => {
    const actions = createActions([
        ["foo"],
        ["bar", types.String],
        ["baz", "has a comment",
            ["a", types.Number],
            ["b", types.Number]],
    ])
    t.equals(actions.foo.type, "foo")
    t.deepEquals(actions.foo.field, { type: "foo" })
    t.equals(actions.bar.type, "bar")
    t.deepEquals(actions.bar.field, { type: "bar", payloadType: types.String })

    const bazType = actions.baz.field.payloadType
    t.true(bazType.test({ a: 10, b: 20 }))
    t.false(bazType.test({ a: "string", b: 20 }))

    t.end()
})

test("map action types", (t) => {
    const actions = createActions([
        ["foo"],
        ["bar", types.String],
    ], { mapActionType: (type) => "namespace/" + type })

    t.deepEquals(actions.foo(), { type: "namespace/foo" })
    t.deepEquals(actions.bar("payload"),
        { type: "namespace/bar", payload: "payload" })
    t.deepEquals(actions.foo.type, "namespace/foo")
    t.deepEquals(actions.bar.type, "namespace/bar")
    t.end()
})

test("apply mapActionType to existing actions", (t) => {
    const actions = createActions([
        ["foo"],
        ["bar", types.String],
    ])

    const nsActions = createActions(
        actions,
        { mapActionType: (type) => "namespace/" + type })

    t.deepEquals(actions.foo(), { type: "foo" })
    t.deepEquals(actions.bar("payload"), { type: "bar", payload: "payload" })
    t.deepEquals(nsActions.foo(), { type: "namespace/foo" })
    t.deepEquals(nsActions.bar("payload"),
        { type: "namespace/bar", payload: "payload" })
    t.end()
})

test("combine actions", (t) => {
    const actions = combineActions({
        ns1: [
            ["foo"],
            ["bar", types.String],
        ],
        ns2: createActions([
            ["foo"],
            ["baz", "has a comment",
                ["a", types.Number],
                ["b", types.Number]],
        ]),
    }, (prefix, action) => `${prefix}/${action}`)

    t.deepEquals(actions.ns1.foo(), { type: "ns1/foo" })
    t.deepEquals(actions.ns1.bar("payload"),
        { type: "ns1/bar", payload: "payload" })
    t.deepEquals(actions.ns2.foo(), { type: "ns2/foo" })
    t.deepEquals(actions.ns2.baz({ a: 10, b: 20 }),
        { type: "ns2/baz", payload: { a: 10, b: 20 } })
    t.end()
})

test("deep combine actions", (t) => {
    const ns = (prefix, action) => `${prefix}/${action}`
    const actions = combineActions({
        a1: [
            ["foo"],
            ["bar", types.String],
        ],
        b1: {
            a2: [
                ["foo"],
                ["bar", types.String],
            ],
            b2: [
                ["foo"],
                ["bar", types.String],
            ],
        },
    }, ns)
    console.log(actions)
    t.deepEquals(actions.a1.foo(), { type: "a1/foo" })
    t.deepEquals(actions.b1.a2.foo(), { type: "b1/a2/foo" })
    t.deepEquals(actions.b1.b2.foo(), { type: "b1/b2/foo" })
    t.end()
})

test("throws on duplicate actions", (t) => {
    t.throws(() => {
        createActions([
            ["foo"],
            ["foo"],
            ["baz"],
        ])
    })
    t.end()
})

test("throws on duplicate namespaced actions", (t) => {
    t.throws(() => {
        createActions([
            ["foo"],
            ["bar"],
            ["baz"],
        ], { mapActionType: () => "same" })
    })
    t.end()
})
