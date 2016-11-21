import { types } from "./base"
import { Exactly } from "./collection"
import { Record } from "./record"

const ShapeField = Record([
    ["key", types.String],
    ["doc", types.String, "optional"],
    ["type", types.Type],
    ["optional", Exactly("optional"), "optional"],
])

// Shape(type) -> type
// Shape([["foo", type], ["bar", type]]) -> { foo: type, bar: type }
export function Shape (defs) {
    if (defs.test) { return defs }

    const fields = defs.map(ShapeField.toObject)

    const test = (obj) => fields.every(
        ({ key, type, optional }) =>
            (optional && !(key in obj)) || type.test(obj[key]))

    return {
        test,
        fields,
    }
}
