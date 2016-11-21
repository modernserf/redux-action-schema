import { Exactly, Tuple, OneOfType } from "./collection"
import { types as _types } from "./base"

// Record is a format for describing tuples
// Point2D = Record([["x", Number],["y", Number]])
export function Record (defs, restDef = []) {
    const fields = defs.map(parseField)
    const [restKey, restType] = restDef

    const test = (vals) => {
        let valIndex = 0
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i]

            if (field.type.test(vals[valIndex])) { // field matches
                valIndex++
            } else if (!field.optional) { // mandatory field, doesn't match
                return false
            }
            // optional field; continue
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
        if (!test(vals)) {
            throw new Error("Value does not match record shape: " + vals)
        }

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

    return {
        test,
        defs,
        fields,
        toObject,
    }
}

const Optional = Exactly("optional")

const tuples = {
    nameType: Tuple([_types.String, _types.Type]),
    nameCommentType: Tuple([_types.String, _types.String, _types.Type]),
    nameTypeOptional: Tuple([_types.String, _types.Type, Optional]),
    nameCommentTypeOptional: Tuple([
        _types.String, _types.String, _types.Type, Optional,
    ]),
}

const Field = OneOfType([
    tuples.nameType,
    tuples.nameCommentType,
    tuples.nameTypeOptional,
    tuples.nameCommentTypeOptional,
])

// bootstrap record parsing (a field definition is made of fields)
function parseField (arr) {
    const shape = Field.matchedType(arr)
    if (!shape) { throw new Error(`Invalid record field ${arr[0]}`) }

    if (shape === tuples.nameType) {
        const [name, type] = arr
        return { name, type, comment: "", optional: false }
    } else if (shape === tuples.nameCommentType) {
        const [name, comment, type] = arr
        return { name, type, comment, optional: false }
    } else if (shape === tuples.nameTypeOptional) {
        const [name, type] = arr
        return { name, type, comment: "", optional: true }
    } else {
        const [name, comment, type] = arr
        return { name, type, comment, optional: true }
    }
}
