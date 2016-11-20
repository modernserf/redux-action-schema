const test = require("tape")
const {
    types, combineActions, createActions, actionInScope,
} = require("../index")

test("actionInScope", (t) => {
    const actions = combineActions({
        a1: createActions([
            ["foo"],
            ["bar", types.String],
        ]),
        b1: {
            a2: createActions([
                ["foo"],
                ["bar", types.String],
            ]),
            b2: createActions([
                ["foo"],
                ["quux", types.String],
            ]),
        },
    })

    t.true(actionInScope(actions, ["a1"], "foo"))
    t.false(actionInScope(actions, ["b1"], "foo"))
    t.true(actionInScope(actions, ["b1", "a2"], "foo"))
    t.true(actionInScope(actions, ["b1", "a2"], "bar"))
    t.false(actionInScope(actions, ["b1", "b2"], "bar"))
    t.end()
})
