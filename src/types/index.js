import { types as baseTypes } from "./base"
import {
    Exactly, Optional, InstanceOf, OneOf, ArrayOf, ObjectOf, OneOfType, Recursive, Tuple,
} from "./collection"
import { Record } from "./record"
import { Shape } from "./shape"
import { Variant } from "./variant"

const types = Object.assign({
    Exactly, Optional, InstanceOf, OneOf, ArrayOf, ObjectOf, OneOfType,
    Recursive, Tuple, Record, Shape, Variant,
}, baseTypes)

for (const key in types) {
    Shape[key] = types[key]
}

export { Shape as types }

const PropType = Record([
    ["name", baseTypes.String],
    ["doc", baseTypes.String, "optional"],
    ["type", baseTypes.Object],
])

export function propTypes (def) {
    return def.reduce((coll, def) => {
        const obj = PropType.toObject(def)
        coll[obj.name] = propType(obj)
        return coll
    }, {})
}

function propType ({ name, doc, type }) {
    return (props, propName, componentName) => {
        if (type.test(props[propName])) { return }
        return new Error(
            "Invalid prop `" + propName + "` supplied to" +
            " `" + componentName + "`. Validation failed."
          )
    }
}
