import { types as baseTypes } from "./base"

export function Exactly (value) {
    return {
        test: (compare) => value === compare,
        schema: JSON.stringify(value),
    }
}

export function Optional (type) {
    return {
        test: (val) => type.test(val) || val === null || val === undefined,
        schema: `Optional<${type.schema}>`,
    }
}

export function InstanceOf (ctor) {
    return {
        test: (instance) => instance instanceof ctor,
        schema: ctor.name,
    }
}

// OneOf([a, b, c])
// TODO: OneOf takes object and matches values
// TODO: OneOf({ nickname: 'value' })
export function OneOf (values) {
    const valueMap = values.reduce((m, k) => { m[k] = k; return m }, {})

    return {
        test: (val) => !!valueMap[val],
        values: valueMap,
        schema: `OneOf<${JSON.stringify(values)}>`,
    }
}

export function ArrayOf (type) {
    return {
        test: (vals) => Array.isArray(vals) && !!vals.every(type.test),
        schema: `Array<${type.schema}>`,
    }
}

export function ObjectOf (type) {
    return {
        test: (obj) => baseTypes.Object.test(obj) &&
            Object.keys(obj).every((key) => type.test(obj[key])),
        schema: `Object<${type.schema}>`,
    }
}

export function OneOfType (types) {
    return {
        test: (val) => types.some((type) => type.test(val)),
        schema: `OneOfType<${types.map((t) => t.schema).join("|")}>`,
        matchedType: (val) => types.find((type) => type.test(val)),
    }
}

export function Recursive (base, fn) {
    const recur = {
        test: (val) => base.test(val) || fn(recur).test(val),
        schema: `Recursive<${base.schema}>`,
        matchedType: () => base,
    }
    return recur
}

// Point2D = Tuple([Number, Number])
export function Tuple (types) {
    return {
        test: (vals) => vals.length === types.length &&
            types.every((type, i) => type.test(vals[i])),
        schema: `(${types.map((t) => t.schema).join(",")})`,
    }
}
