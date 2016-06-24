const test = require("tape")
const { createSchemaObserver, types } = require("../dist/index.js")
const { createStore, applyMiddleware } = require("redux")

test("creates a log of received actions, partitioned by type", (t) => {
    const o = createSchemaObserver()

    const state = {}
    const reducer = () => state
    const store = createStore(reducer, applyMiddleware(o))

    ;[
        { type: "foo" },
        { type: "bar" },
        { type: "foo", payload: 1 },
        { type: "foo", payload: 3 },
        { type: "foo", payload: 100 },
        { type: "foo", payload: 1 },
        { type: "bar", payload: { a: "string", b: "another" } },
    ].forEach((action) => store.dispatch(action))

    t.deepEquals(o.receivedActions(), {
        foo: [undefined, 1, 3, 100, 1],
        bar: [undefined, { a: "string", b: "another" }],
    })
    t.end()
})

test("creates a log of received 1-arg types", (t) => {
    const o = createSchemaObserver()

    const state = {}
    const reducer = () => state
    const store = createStore(reducer, applyMiddleware(o))

    ;[
        { type: "foo", payload: 1 },
        { type: "foo", payload: 3 },
        { type: "bar", payload: "a string" },
    ].forEach((action) => store.dispatch(action))

    t.deepEquals(o.receivedTypes(), {
        foo: [{ wholePayload: true, test: types.Number }],
        bar: [{ wholePayload: true, test: types.String }],
    })
    t.end()
})

test("handles actions with no args (ie. always null)", (t) => {
    const o = createSchemaObserver()

    const state = {}
    const reducer = () => state
    const store = createStore(reducer, applyMiddleware(o))

    ;[
        { type: "foo" },
        { type: "foo" },
    ].forEach((action) => store.dispatch(action))

    t.deepEquals(o.receivedTypes(), {
        foo: [],
    })
    t.end()
})

test("handles nullable types", (t) => {
    const o = createSchemaObserver()

    const state = {}
    const reducer = () => state
    const store = createStore(reducer, applyMiddleware(o))

    ;[
        { type: "foo" },
        { type: "foo", payload: 3 },
        { type: "foo" },
    ].forEach((action) => store.dispatch(action))

    t.deepEquals(o.receivedTypes(), {
        foo: [{ wholePayload: true, test: types.Number.optional }],
    })
    t.end()
})

test("handles union types", (t) => {
    const o = createSchemaObserver()

    const state = {}
    const reducer = () => state
    const store = createStore(reducer, applyMiddleware(o))

    ;[
        { type: "foo", payload: 3 },
        { type: "foo", payload: "string" },
        { type: "bar", payload: 3 },
        { type: "bar", payload: "string" },
        { type: "bar" },
    ].forEach((action) => store.dispatch(action))

    const { foo, bar } = o.receivedTypes()
    const fooType = foo[0].test
    const barType = bar[0].test

    t.true(fooType(10))
    t.true(fooType("a string"))
    t.false(fooType(null))
    t.deepEquals(foo[0].subTypes, [types.Number, types.String])

    t.true(barType(10))
    t.true(barType("a string"))
    t.true(barType(null))
    t.deepEquals(bar[0].subTypes, [types.Number, types.String])

    t.end()
})

test("handles Any type (for function)", (t) => {
    const o = createSchemaObserver()

    const state = {}
    const reducer = () => state
    const store = createStore(reducer, applyMiddleware(o))

    ;[
        { type: "foo", payload: "a string" },
        { type: "foo", payload: () => {} },
        { type: "bar" },
        { type: "bar", payload: 123 },
        { type: "bar", payload: () => {} },
    ].forEach((action) => store.dispatch(action))

    t.deepEquals(o.receivedTypes(), {
        foo: [{ wholePayload: true, test: types.Any }],
        bar: [{ wholePayload: true, test: types.Any.optional }],
    })
    t.end()
})

test("handles objects with 1 named arg", (t) => {
    const o = createSchemaObserver()

    const state = {}
    const reducer = () => state
    const store = createStore(reducer, applyMiddleware(o))

    ;[
        { type: "bar", payload: { a: "string" } },
        { type: "bar", payload: { a: "another" } },
    ].forEach((action) => store.dispatch(action))

    t.deepEquals(o.receivedTypes(), {
        bar: [{ id: "a", test: types.String }],
    })
    t.end()
})

test("handles objects by arg", (t) => {
    const o = createSchemaObserver()

    const state = {}
    const reducer = () => state
    const store = createStore(reducer, applyMiddleware(o))

    ;[
        { type: "bar", payload: { a: "string", b: "another" } },
        { type: "bar", payload: { a: "another", b: "string" } },
    ].forEach((action) => store.dispatch(action))

    t.deepEquals(o.receivedTypes(), {
        bar: [{ id: "a", test: types.String }, { id: "b", test: types.String }],
    })
    t.end()
})

test("handles objects by arg with optionals", (t) => {
    const o = createSchemaObserver()

    const state = {}
    const reducer = () => state
    const store = createStore(reducer, applyMiddleware(o))

    ;[
        { type: "bar", payload: { a: "string", b: "another" } },
        { type: "bar", payload: { a: "another" } },
    ].forEach((action) => store.dispatch(action))

    t.deepEquals(o.receivedTypes(), {
        bar: [{ id: "a", test: types.String }, { id: "b", test: types.String.optional }],
    })
    t.end()
})

test("handles objects by arg with unions", (t) => {
    const o = createSchemaObserver()

    const state = {}
    const reducer = () => state
    const store = createStore(reducer, applyMiddleware(o))

    ;[
        { type: "bar", payload: { a: "string", b: "another" } },
        { type: "bar", payload: { a: "another", b: 23 } },
    ].forEach((action) => store.dispatch(action))

    const { bar } = o.receivedTypes()
    const [a, b] = bar
    t.equals(bar.length, 2)
    t.equals(a.id, "a")
    t.equals(b.id, "b")
    t.equals(a.test, types.String)
    t.deepEquals(b.subTypes, [types.String, types.Number])
    t.end()
})

test("matches non-plain objects as types.Object", (t) => {
    const o = createSchemaObserver()

    const state = {}
    const reducer = () => state
    const store = createStore(reducer, applyMiddleware(o))

    ;[
        { type: "bar", payload: new Date() },
        { type: "bar", payload: new Date() },
    ].forEach((action) => store.dispatch(action))

    t.deepEquals(o.receivedTypes(), {
        bar: [{ wholePayload: true, test: types.Object }],
    })
    t.end()
})

test("matches union of {a, b} & 123 as OneOf(Object, Number)", (t) => {
    const o = createSchemaObserver()

    const state = {}
    const reducer = () => state
    const store = createStore(reducer, applyMiddleware(o))

    ;[
        { type: "bar", payload: { a: "string", b: "another" } },
        { type: "bar", payload: 123 },
    ].forEach((action) => store.dispatch(action))

    const bar = o.receivedTypes().bar[0]
    t.true(bar.wholePayload)
    t.deepEquals(bar.subTypes, [types.Object, types.Number])
    t.end()
})

test("print schema", (t) => {
    const o = createSchemaObserver()

    const state = {}
    const reducer = () => state
    const store = createStore(reducer, applyMiddleware(o))

    ;[
        { type: "foo" },
        { type: "bar", payload: 123 },
        { type: "baz" },
        { type: "baz", payload: "str" },
        { type: "quux", payload: 123 },
        { type: "quux" },
        { type: "quux", payload: "str" },
        { type: "xyzzy", payload: { a: 123, b: "foo" } },
    ].forEach((action) => store.dispatch(action))

    t.comment(o.schemaDefinitionString())

    t.equals(o.schemaDefinitionString(), `
createSchema([
    ["foo"],
    ["bar", types.Number],
    ["baz", types.String.optional],
    ["quux", types.OneOfType.optional(types.Number, types.String)],
    ["xyzzy",
        ["a", types.Number],
        ["b", types.String]]
])`)

    t.end()
})
