const uncons = (array) => [array[0], array.slice(1)]

export function parseAction (action) {
    const [type, docAndArgs] = uncons(action)
    if (!docAndArgs.length) { return { type, args: [], doc: "" } }

    if (typeof docAndArgs[0] === "string") {
        const [doc, args] = uncons(docAndArgs)
        return { type, doc, args: args.map(parseArg) }
    }
    return { type, doc: "", args: docAndArgs.map(parseArg) }
}

function parseArg (arg, i) {
    if (typeof arg === "function" && i === 0) {
        return { test: arg, doc: "", wholePayload: true }
    }
    if (arg.length === 3) {
        const [id, doc, test] = arg
        return { id, doc, test }
    }
    const [id, test] = arg
    return { id, doc: "", test }
}
