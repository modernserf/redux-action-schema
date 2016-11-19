export function keyBy (arr, fn, err) {
    return arr.reduce((coll, item) => {
        const key = fn(item)
        if (coll[key]) { throw err(key) }
        coll[fn(item)] = item
        return coll
    }, {})
}

export function id (value) { return value }

export function pickAndRename (source, nameMap) {
    const res = {}
    for (const key in nameMap) { // eslint-disable-line guard-for-in
        const nextKey = nameMap[key]
        res[nextKey] = source[key]
    }
    return res
}

export function pick (source, names) {
    const res = {}
    for (var i = 0; i < names.length; i++) {
        res[names[i]] = source[names[i]]
    }
    return res
}
