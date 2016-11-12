import { Exactly } from "./collection"
import { types } from "./base"

// Record is a format for describing tuples
// Point2D = Record([["x", Number],["y", Number]])
export function Record (defs, restDef = []) {
    const fields = defs.map(parseField)
    const [restKey, restType] = restDef

    const test = (vals) => {
        let valIndex = 0
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i]
            const val = vals[valIndex]

            if (field.type.test(val)) {
                valIndex++
                continue
            }
            if (field.optional) { continue }
            return false
        }
        if (valIndex === vals.length) { return true }
        try {
            restType(vals.slice(valIndex))
            return true
        } catch (e) {
            return false
        }
    }

    const toObject = (vals) => {
        // TODO: throw
        if (!test(vals)) { return }

        const res = {}
        let valIndex = 0
        for (var i = 0; i < fields.length; i++) {
            const field = fields[i]
            const val = vals[valIndex]
            if (field.type.test(val)) {
                valIndex++
                res[field.name] = val
            }
        }

        if (restType) {
            res[restKey] = restType(vals.slice(valIndex))
        }

        return res
    }

    const fieldSchema = fields.map(({schema}) => `\n    ${schema}`).join("")

    return {
        test,
        defs,
        fields,
        schema: `Record{${fieldSchema}\n}`,
        toObject,
    }
}

export const Field = Record([
    ["name", types.String],
    ["comment", "AKA docstring", types.String, "optional"],
    ["type", types.Object],
    ["optional", Exactly("optional"), "optional"],
])

// bootstrap record parsing (a field definition is made of fields)
function parseField (arr) {
    const [a, b, c, d] = arr
    const name = a

    const _comment = b
    const hasComment = typeof _comment === "string"
    const comment = hasComment ? _comment : ""

    const type = hasComment ? c : b

    const _optional = hasComment ? d : c
    const optional = _optional === "optional"

    const schema = `${name}${optional ? "?" : ""}:${type.schema}` +
        comment ? ` -- ${comment}` : ""

    return { name, comment, type, optional, schema }
}
