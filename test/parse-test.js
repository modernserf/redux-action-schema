const test = require("tape")
const { createSchema, types } = require("../dist/index.js")

test("parses a valid schema", (t) => {
    try {
        const { schema } = createSchema([
            ["foo", "has no arguments"],
            ["bar"], // no docstring
            ["baz", "has single argument", types.String],
            ["quux", /* no docstring */ types.Number],
            ["plugh", "has single named argument",
                ["a", "argument a", types.String]],
            ["xyzzy", //  no docstring
                ["a", "argument a", types.String],
                ["b", /* no docstring */ types.Number]],
        ])

        t.deepEquals(schema.foo, {
            type: "foo", doc: "has no arguments", args: [],
        })
        t.deepEquals(schema.bar, {
            type: "bar", doc: "", args: [],
        })
        t.deepEquals(schema.baz, {
            type: "baz", doc: "has single argument",
            args: [{ test: types.String, doc: "", wholePayload: true }],
        })
        t.deepEquals(schema.quux, {
            type: "quux", doc: "",
            args: [{ test: types.Number, doc: "", wholePayload: true }],
        })
        t.deepEquals(schema.plugh, {
            type: "plugh", doc: "has single named argument",
            args: [{ id: "a", doc: "argument a", test: types.String }],
        })
        t.deepEquals(schema.xyzzy, {
            type: "xyzzy", doc: "",
            args: [
                { id: "a", doc: "argument a", test: types.String },
                { id: "b", doc: "", test: types.Number },
            ],
        })
    } catch (e) {
        t.fail("valid schema generation threw an error")
    } finally {
        t.end()
    }
})

test.skip("throws on invalid schema")
