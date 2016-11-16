import { types as baseTypes } from "./base"
import {
    Exactly, Optional, InstanceOf, OneOf, ArrayOf, ObjectOf, OneOfType, Recursive, Tuple,
} from "./collection"
import { Record } from "./record"
import { Shape } from "./shape"
import { Variant } from "./variant"

export default Object.assign({
    Exactly, Optional, InstanceOf, OneOf, ArrayOf, ObjectOf, OneOfType, Recursive, Tuple,
    Record, Shape, Variant,
}, baseTypes)
