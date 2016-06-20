export const types = {
    Object: (val) =>
        !!val && !Array.isArray(val) && typeof val === "object",
    Number: (val) => typeof val === "number",
    String: (val) => typeof val === "string",
    Boolean: (val) => val === true || val === false,
    Array: Array.isArray,
    Any: (val) => val !== undefined && val !== null,
}

// TODO: OneOfType takes array instead of args?
// TODO: OneOf takes object and matches values
// TODO: types.Flag === types.Boolean.optional

const optional = (fn) => (val) =>
    val === undefined || val === null || fn(val)

for (const key in types) {
    types[key].optional = optional(types[key])
}

const tParams = {
    OneOf: (opts) => (val) => opts.indexOf(val) !== -1,
    ArrayOf: (typeFn) => (val) =>
        Array.isArray(val) && !!val.every(typeFn),
    OneOfType: function (...args) {
        return (val) => args.some((test) => test(val))
    },
}

const compose = (a, b) => function (...args) {
    return a(b.apply(this, args))
}

for (const key in tParams) {
    types[key] = tParams[key]
    types[key].optional = compose(optional, tParams[key])
}
