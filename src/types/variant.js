import { types } from "./base"
import { Record } from "./record"
import { Shape } from "./shape"
import { keyBy, id } from "../util"
import { duplicateVariantError, namespaceError } from "../errors"

const VariantField = Record([
    ["type", types.String],
    ["doc", types.String, "optional"],
    // ["creator", types.Function, "optional"],
], ["payloadType", Shape])

const VariantBody = Shape([
    ["type", types.String],
    ["payload", types.Any, "optional"],
])

export function Variant (defs, {
    mapType = id,
    duplicateError = duplicateVariantError,
} = {}) {
    const fields = defs.map((def) => {
        const field = VariantField.toObject(def)
        const type = mapType(field.type)
        const creator = field.creator ? field.creator
            : field.payloadType ? (payload) => ({ type, payload })
            : () => ({ type })

        creator.type = type
        creator.field = field
        return creator
    })

    const creators = keyBy(
        fields,
        ({ field }) => field.type,
        duplicateError)

    const mappedCreators = keyBy(fields, ({ type }) => type, namespaceError)

    const test = (val) => {
        if (!val || !val.type) { return false }
        if (!creators[val.type]) { return false }

        const { payloadType } = creators[val.type].field
        // has payload when none expected
        if ((val.payload && !payloadType) ||
            // payload doesnt match
            (payloadType && !payloadType.test(val.payload))) {
            return false
        }

        return true
    }

    return Object.assign(creators, {
        test,
        get: (type) => creators[type],
        matchedType: (val) => mappedCreators[val.type],
    })
}
