const duplicate = (kind, field, value) =>
    `Multiple ${kind} defined with ${field} "${value}"`

export function duplicateActionError (type) {
    return new Error(duplicate("actions", "type", type))
}

export function duplicateSelectorError (name) {
    return new Error(duplicate("selectors", "name", name))
}

export function duplicateVariantError (type) {
    return new Error(duplicate("variants", "type", type))
}

const unknown = (kind, value) =>
    `Unknown ${kind} "${value}"`

export function unknownActionError (type) {
    return new Error(unknown("action", type))
}

export function unknownSelectorError (name) {
    return new Error(unknown("selector", name))
}

export function reducerHandlerError (type) {
    return new Error(`Handler for type "${type}" is not a function`)
}

export function namespaceError (type) {
    return new Error(`Multiple types mapped to "${type}"`)
}
