import { types as baseTypes } from "./base"
import * as collectionTypes from "./collection"
import { Record } from "./record"
import { Shape } from "./shape"
import { Variant } from "./variant"

export const types = Object.assign({ Record, Shape, Variant }, baseTypes, collectionTypes)
