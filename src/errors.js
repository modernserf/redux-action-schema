export function duplicateActionError (type) {
    return new Error(`Multiple actions defined with type "${type}"`)
}

export function unknownActionError (type) {
    return new Error(`Unknown action type "${type}"`)
}

export function reducerHandlerError (type) {
    return new Error(`Handler for type "${type}" is not a function`)
}

export function namespaceError (type) {
    return new Error("Namespace must be a function or a string")
}
