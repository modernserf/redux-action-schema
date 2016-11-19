const test = require("tape")
const { types, createSelectors, selector, reducer } = require("../index.js")

test("createSelectors", (t) => {
    const fooReducer = (state = "", action) => state

    const barReducer = reducer({
        actionA: (state, payload) => state,
        actionB: (state, payload) => state,
    }, "")

    const bazSelector = selector(["foo", "bar"], ({ foo, bar }) => ({
        foo, bar,
    }))

    const selectorMap = createSelectors([
        ["foo", "a plain reducer", fooReducer],
        ["bar", "a schematized reducer", barReducer],
        ["baz", "a pure selector", bazSelector],
    ])

    const state = {
        foo: "foo",
        bar: "bar",
        quux: "quux",
    }

    t.equals(state.foo, selectorMap.foo(state))
    t.equals(state.bar, selectorMap.bar(state))
    t.deepEquals(
        { foo: state.foo, bar: state.bar },
        selectorMap.baz(state))
    t.end()
})

test("createSelectors with return types", (t) => {
    const fooReducer = (state = "", action) => state

    const barReducer = reducer({
        actionA: (state, payload) => state,
        actionB: (state, payload) => state,
    }, "")

    const bazSelector = selector(["foo", "bar"], ({ foo, bar }) => ({
        foo, bar,
    }))

    t.doesNotThrow(() => {
        createSelectors([
            ["foo", "a plain reducer", fooReducer],
            ["bar", "a schematized reducer", barReducer, types.String],
            ["baz", bazSelector, types([
                ["foo", types.String],
                ["bar", types.String]])],
        ])
    })

    t.end()
})

test("createSelectors throws on invalid selector defs", (t) => {
    t.throws(() => {
        const fooReducer = (state = "", action) => state
        createSelectors([
            ["foo", fooReducer],
            ["bar"], // missing a selector
        ])
    })

    t.throws(() => {
        createSelectors([
            ["foo", (state) => state],
            ["bar", (state) => state],
            ["foo", "duplicate definition", (state) => state],
        ])
    })

    t.throws(() => {
        createSelectors([
            ["foo", (state) => state],
            ["bar", "wrong type", types.String],
        ])
    })

    t.end()
})

test("selectors are memoized", (t) => {
    const fooReducer = (state = "", action) => state

    let calledCount = 0

    const barSelector = selector(["foo"], ({ foo }) => {
        calledCount++
        return foo
    })

    const selectors = createSelectors([
        ["foo", fooReducer],
        ["bar", barSelector],
    ])

    const state = { foo: "foo" }

    t.equals(calledCount, 0)
    t.equals(selectors.bar(state), "foo")
    t.equals(calledCount, 1)
    t.equals(selectors.bar(state), "foo")
    t.equals(calledCount, 1)

    state.foo = "foo2"
    t.equals(selectors.bar(state), "foo2")
    t.equals(calledCount, 2)

    t.end()
})

test("selectors throw on dependency cycles")

test("namespaced selectors")

test("nested selectors")

test("selectors throw on missing dependencies")
