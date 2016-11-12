export function Exactly (value) {
    return {
        test: (compare) => value === compare,
        schema: JSON.stringify(value),
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
    return {
        test: (val) => values.indexOf(val) !== -1,
        schema: `OneOf<${JSON.stringify(values)}>`,
    }
}

export function ArrayOf (type) {
    return {
        test: (vals) => Array.isArray(vals) && !!vals.every(type.test),
        schema: `Array<${type.schema}>`,
    }
}

export function OneOfType (types) {
    return {
        test: (val) => types.some((type) => type.test(val)),
        schema: `OneOfType<${types.map((t) => t.schema).join("|")}>`,
    }
}

export function Recursive (base, fn) {
    const recur = {
        test: (val) => base.test(val) || fn(recur),
        schema: `Recursive<${base.schema}>`,
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
