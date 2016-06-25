export const mergeIgnoreUndefined = (a, b) => {
    const merged = Object.assign({}, a)
    for (const key in b) {
        if (b[key] !== undefined) {
            merged[key] = b[key]
        }
    }
    return merged
}
