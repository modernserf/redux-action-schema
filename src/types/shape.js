import { types } from "./base"
import { Exactly, OneOfType } from "./collection"
import { Record } from "./record"

const ShapeField = OneOfType([
    Record([
        ["key", types.String],
        ["doc", types.String, "optional"],
        ["type", types.Object],
        ["optional", Exactly("optional"), "optional"],
    ]),
    Record([
        ["key", types.String],
        ["doc", types.String, "optional"],
    ], ["children", Record]),
])

ShapeField.toObject = (val) => {
    return ShapeField.matchedType(val).toObject(val)
}

export function Shape (defs) {
    const fields = defs.map((def) => {
        const o = ShapeField.toObject(def)
        if (o.children) {
            o.type = Shape(o.children.defs)
        }
        o.schema = `${o.key}${o.optional ? "?" : ""}:${o.type.schema}` +
            o.doc ? ` -- ${o.doc}` : ""

        return o
    })

    const test = (obj) => fields.every(
        ({ key, type, optional }) =>
            (optional && !(key in obj)) || type.test(obj[key]))

    const fieldSchema = fields.map(({schema}) => `\n    ${schema}`).join("")

    return {
        test,
        schema: `Object{${fieldSchema}}`,
        fields,
    }
}
