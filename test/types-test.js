const test = require("tape")
const { types } = require("../dist/index.js")

test("type checking", (t) => {
    const vals = [
        null, undefined, false, "foo", 0, { a: 1, b: "b" }, [1, 2, 3]
    ]

    t.deepEquals(vals.map(types.Object),
        [false, false, false, false, false, true, false])
    t.deepEquals(vals.map(types.Number),
        [false, false, false, false, true, false, false])
    t.deepEquals(vals.map(types.String),
        [false, false, false, true, false, false, false])
    t.deepEquals(vals.map(types.Array),
        [false, false, false, false, false, false, true])
    t.deepEquals(vals.map(types.Any),
        [false, false, true,  true,  true,  true, true])
    t.end()
})

test("optional type checking", (t) => {
    const vals = [
        null, undefined, false, "", 0, { a: 1, b: "b" }
    ]

    t.deepEquals(vals.map(types.Object.optional),
        [true, true, false, false, false, true])
    t.deepEquals(vals.map(types.Number.optional),
        [true, true, false, false, true, false])
    t.deepEquals(vals.map(types.String.optional),
        [true, true, false, true, false, false])
    t.deepEquals(vals.map(types.Any.optional),
        [true, true, true, true,  true,  true])
    t.end()
})

test("enum type checking", (t) => {
    const e = ["foo","bar","baz"]

    t.true(types.OneOf(e)("foo"))
    t.false(types.OneOf(e)("quux"))
    t.false(types.OneOf(e)(null))
    t.true(types.OneOf.optional(e)(null))
    t.false(types.OneOf.optional(e)("quux"))
    t.end()
})

test("one of type", (t) => {
    const vals = [
        null, undefined, false, "", 0, { a: 1, b: "b" }
    ]

    t.deepEquals(vals.map(types.OneOfType(types.Number, types.String)),
        [false, false, false, true, true, false])
    t.deepEquals(vals.map(
        types.OneOfType.optional(types.Number, types.String))
        [true,  true,  false, true, true, false])
    t.end()
})

test("array of type", (t) => {
    t.true(types.ArrayOf(types.Number)([1, 2, 3]))
    t.false(types.ArrayOf(types.Number)(["foo", "bar", "baz"]))
    t.false(types.ArrayOf(types.Number)([1, 2, "foo", 4]))
    t.false(types.ArrayOf(types.Number)([1, 2, null, 4]))
    t.false(types.ArrayOf.optional(types.Number)([1, 2, null, 4]))
    t.true(types.ArrayOf.optional(types.Number)(null))
    t.false(types.ArrayOf.optional(types.Number)(0))
    t.true(types.ArrayOf(types.Number.optional)([1, 2, null, 4]))
    t.end()
})
