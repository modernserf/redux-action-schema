import { types } from "./base"
import { Exactly, Recursive } from "./collection"
import { Record } from "./record"

const ShapeField = Recursive(
Record([
    ["key", types.String],
    ["doc", types.String, "optional"],
    ["type", types.Object],
    ["optional", Exactly("optional"), "optional"],
]),
(recur) => Record([
    ["key", types.String],
    ["doc", types.String, "optional"],
], recur))

export function Shape (defs) {
    const fields = defs
        .map((def) => ShapeField.toObject(def, { nameMap: "children" }))
        .map((defObj) => defObj.children
            ? Object.assign(defObj, { type: Shape(defObj.children) })
            : defObj)
        // TODO: share with Record
        .map((o) => Object.assign(o, {
            schema: `${o.key}${o.optional ? "?" : ""}:${o.type.schema}` +
                o.doc ? ` -- ${o.doc}` : "",
        }))

    const test = (obj) => fields.every(
        ({ key, type, optional }) =>
            (optional && !(key in obj)) ||
            type.test(obj[key]))

    const fieldSchema = fields.map(({schema}) => `\n    ${schema}`).join("")

    return {
        test,
        schema: `Object{${fieldSchema}}`,
        fields,
    }
}
