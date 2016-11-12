const test = require("tape")
const { types } = require("../dist/index.js")

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

test("Exactly", (t) => {
    t.true(types.Exactly("foo").test("foo"))
    t.true(types.Exactly(0).test(0))
    t.false(types.Exactly(0).test(""))
    t.end()
})

test.skip("InstanceOf")

test("OneOf", (t) => {
    const e = ["foo", "bar", "baz"]

    t.true(types.OneOf(e).test("foo"))
    t.false(types.OneOf(e).test("quux"))
    t.false(types.OneOf(e).test(null))
    t.end()
})

test("OneOfType", (t) => {
    const vals = [
        null, undefined, false, "", 0, { a: 1, b: "b" },
    ]

    t.deepEquals(vals.map(types.OneOfType([types.Number, types.String]).test),
        [false, false, false, true, true, false])
    t.end()
})

test("ArrayOf", (t) => {
    t.true(types.ArrayOf(types.Number).test([1, 2, 3]))
    t.false(types.ArrayOf(types.Number).test(["foo", "bar", "baz"]))
    t.false(types.ArrayOf(types.Number).test([1, 2, "foo", 4]))
    t.false(types.ArrayOf(types.Number).test([1, 2, null, 4]))
    // TODO: optional
    // t.true(types.ArrayOf(types.Number.optional).test([1, 2, null, 4]))
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

test("Recursive", (t) => {
    const List = types.Recursive(
        types.Tuple([]),
        (recur) => types.Tuple([types.Any, recur]))

    t.true(List.test([]))
    t.true(List.test(["foo", []]))
    t.true(List.test(["foo", ["bar", ["baz", []]]]))
    t.false(List.test(["foo", "bar"]))
    t.false(List.test(["foo", ["bar", "baz"]]))
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
    t.end()
})

test.skip("Shape")
