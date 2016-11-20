import { types as baseTypes } from "./base"

export function Exactly (value) {
    return {
        test: (compare) => value === compare,
    }
}

export function Optional (type) {
    return {
        test: (val) => type.test(val) || val === null || val === undefined,
    }
}

export function InstanceOf (ctor) {
    return {
        test: (instance) => instance instanceof ctor,
    }
}

// OneOf([a, b, c])
// TODO: OneOf takes object and matches values
// TODO: OneOf({ nickname: 'value' })
export function OneOf (values) {
    const valueMap = values.reduce((m, k) => { m[k] = k; return m }, {})

    return Object.assign({}, valueMap, {
        test: (val) => !!valueMap[val],
        get: (val) => valueMap[val],
    })
}

export function ArrayOf (type) {
    return {
        test: (vals) => Array.isArray(vals) && !!vals.every(type.test),
    }
}

export function ObjectOf (type) {
    return {
        test: (obj) => baseTypes.Object.test(obj) &&
            Object.keys(obj).every((key) => type.test(obj[key])),
    }
}

export function OneOfType (types) {
    return {
        test: (val) => types.some((type) => type.test(val)),
        matchedType: (val) => types.find((type) => type.test(val)),
    }
}

// Point2D = Tuple([Number, Number])
export function Tuple (types) {
    return {
        test: (vals) => vals.length === types.length &&
            types.every((type, i) => type.test(vals[i])),
    }
}
