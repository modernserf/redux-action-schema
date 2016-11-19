import { types } from "./base"
import { Record } from "./record"
import { Shape } from "./shape"
import { keyBy, id } from "../util"
import { duplicateVariantError, namespaceError } from "../errors"

const VariantField = Record([
    ["type", types.String],
    ["doc", types.String, "optional"],
    // ["creator", types.Function, "optional"],
    ["payloadType", types.Object, "optional"],
])

export const VariantBody = Shape([
    ["type", types.String],
    ["payload", types.Any, "optional"],
])

export function Variant (defs, {
    mapType = id,
    duplicateError = duplicateVariantError,
} = {}) {
    const fields = defs.fields ? defs.fields : defs.map(VariantField.toObject)

    const creators = keyBy(
        fields.map((field) => {
            const type = mapType(field.type)
            const creator = field.creator ? field.creator
                : field.payloadType ? (payload) => ({ type, payload })
                : () => ({ type })

            creator.type = type
            creator.field = field

            return creator
        }),
        ({ field }) => field.type,
        duplicateError)

    keyBy(fields, ({ type }) => mapType(type), namespaceError)

    const test = (val) => {
        if (!val || !val.type) { return false }
        if (!creators[val.type]) { return false }

        const { payloadType } = creators[val.type].field
        if ((val.payloadType && !payloadType) ||
            (payloadType && !payloadType.test(val.payload))) {
            return false
        }

        return true
    }

    return {
        fields,
        test,
        creators,
    }
}
