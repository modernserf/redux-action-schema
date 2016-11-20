const test = require("tape")
const { types } = require("../index.js")

test("type checking", (t) => {
    const vals = [
        null, undefined, false, "foo", 0, { a: 1, b: "b" }, [1, 2, 3],
    ]

    t.deepEquals(vals.map(types.Object.test),
        [false, false, false, false, false, true, false])
    t.deepEquals(vals.map(types.Number.test),
        [false, false, false, false, true, false, false])
    t.deepEquals(vals.map(types.String.test),
        [false, false, false, true, false, false, false])
    t.deepEquals(vals.map(types.Boolean.test),
        [false, false, true, false, false, false, false])
    t.deepEquals(vals.map(types.Array.test),
        [false, false, false, false, false, false, true])
    t.deepEquals(vals.map(types.Any.test),
        [false, false, true, true, true, true, true])
    t.end()
})

test("Type", (t) => {
    t.true(types.Type.test(types.Object))
    t.true(types.Type.test({ test: (value) => true }))
    t.true(types.Type.test(/foo/))
    t.false(types.Type.test({}))
    t.false(types.Type.test(""))
    t.false(types.Type.test(() => {}))
    t.end()
})

test("Exactly", (t) => {
    t.true(types.Exactly("foo").test("foo"))
    t.true(types.Exactly(0).test(0))
    t.false(types.Exactly(0).test(""))
    t.end()
})

test("Optional", (t) => {
    const _N = types.Optional(types.Number)
    t.true(_N.test(123))
    t.true(_N.test(undefined))
    t.true(_N.test(null))
    t.false(_N.test("string"))
    t.end()
})

test("InstanceOf", (t) => {
    const _Date = types.InstanceOf(Date)
    t.true(_Date.test(new Date()))
    t.false(_Date.test(Date.now()))
    t.end()
})

test("OneOf", (t) => {
    const Enum = types.OneOf(["foo", "bar", "baz"])

    t.true(Enum.test("foo"))
    t.false(Enum.test("quux"))
    t.false(Enum.test(null))

    t.true(Enum.foo === "foo")
    t.true(Enum.quux === undefined)

    t.end()
})

test("OneOfType", (t) => {
    const vals = [
        null, undefined, false, "", 0, { a: 1, b: "b" },
    ]

    t.deepEquals(vals.map(types.OneOfType([types.Number, types.String]).test),
        [false, false, false, true, true, false])

    const T = types.OneOfType([types.Number, types.String])
    t.equal(T.matchedType(123), types.Number)

    t.end()
})

test("ArrayOf", (t) => {
    t.true(types.ArrayOf(types.Number).test([1, 2, 3]))
    t.false(types.ArrayOf(types.Number).test(["foo", "bar", "baz"]))
    t.false(types.ArrayOf(types.Number).test([1, 2, "foo", 4]))
    t.false(types.ArrayOf(types.Number).test([1, 2, null, 4]))
    t.end()
})

test("ObjectOf", (t) => {
    t.true(types.ObjectOf(types.Number).test({ foo: 1, bar: 2 }))
    t.false(types.ObjectOf(types.Number).test({ foo: 1, bar: "string" }))
    t.false(types.ObjectOf(types.Number).test({ foo: 1, bar: 2, baz: undefined }))
    t.end()
})

test("Tuple", (t) => {
    const Point = types.Tuple([types.Number, types.Number])
    t.true(Point.test([10, 20]))
    t.false(Point.test([10, 20, 30]))
    t.false(Point.test(["10", 20]))
    t.false(Point.test([10]))

    t.true(types.Tuple([]).test([]))

    t.end()
})

test("Record", (t) => {
    const Point = types.Record([
        ["x", types.Number],
        ["y", types.Number],
    ])
    t.true(Point.test([10, 20]))
    t.false(Point.test([10, 20, 30]))
    t.false(Point.test(["10", 20]))
    t.false(Point.test([10]))

    t.deepEquals(Point.toObject([10, 20]), { x: 10, y: 20 })

    const Action = types.Record([
        ["type", types.String],
        ["doc", types.String, "optional"],
        ["payloadType", types.Object, "optional"],
    ])

    t.true(Action.test(["fooAction"]))
    t.true(Action.test(["fooAction", "with a doc", types.Number]))
    t.true(Action.test(["barAction", Point]))

    const RestAction = types.Record([
        ["type", types.String],
        ["doc", types.String, "optional"],
    ], ["payloadType", types.Record])

    t.true(RestAction.test(["fooAction"]))
    t.true(RestAction.test(["fooAction", "with a doc"]))
    t.true(RestAction.test(
        ["fooAction",
            ["a", types.Number],
            ["b", types.Number]]))

    const action = RestAction.toObject(
        ["fooAction",
            ["id", types.Number]])

    const payloadObj = action.payloadType.toObject([123])
    t.deepEquals(payloadObj, { id: 123 })

    t.end()
})

test("Shape", (t) => {
    const Point = types([
        ["x", types.Number],
        ["y", types.Number],
    ])

    t.true(Point.test({ x: 10, y: 20 }))
    t.false(Point.test({ x: 20 }))
    t.false(Point.test({ x: "foo", y: "bar" }))

    const Location = types.Shape([
        ["id", types.String],
        ["point", types([
            ["x", types.Number],
            ["y", types.Number]])],
    ])

    t.true(Location.test({ id: "foo", point: { x: 10, y: 20 } }))

    t.end()
})

test.skip("ExactShape")

test("Variant", (t) => {
    const Maybe = types.Variant([
        ["just", types.Any],
        ["nothing"],
    ])

    t.deepEquals(Maybe.just("value"), {
        type: "just", payload: "value",
    })
    t.deepEquals(Maybe.nothing(), { type: "nothing" })

    const variant = types.Variant([
        ["foo"],
        ["bar", types.String],
        ["baz", "has a comment", types([
            ["a", types.Number],
            ["b", types.Number]])],
    ])

    t.deepEquals(variant.foo(), { type: "foo" })
    t.deepEquals(variant.bar("value"), {
        type: "bar", payload: "value",
    })
    t.deepEquals(variant.baz({ a: 10, b: 20 }),
        { type: "baz", payload: { a: 10, b: 20 } })

    t.end()
})

test("Variant mapping", (t) => {
    const variant = types.Variant([
        ["foo"],
        ["bar", types.String],
    ], { mapType: (type) => "namespace/" + type })

    t.deepEquals(variant.foo(), { type: "namespace/foo" })
    t.deepEquals(variant.bar("value"), {
        type: "namespace/bar", payload: "value",
    })

    t.end()
})
