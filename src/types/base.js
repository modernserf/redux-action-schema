const tests = [
    ["Object", (val) => !!val && !Array.isArray(val) && typeof val === "object"],
    ["Number", (val) => typeof val === "number"],
    ["String", (val) => typeof val === "string"],
    ["Boolean", (val) => val === true || val === false],
    ["Function", (val) => typeof val === "function"],
    ["Array", Array.isArray],
    ["Any", (val) => val !== undefined && val !== null],
]

export const types = tests.reduce((obj, [key, test]) => {
    obj[key] = { test }
    return obj
}, {})
