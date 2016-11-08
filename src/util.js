export function keyBy (arr, fn, err) {
    return arr.reduce((coll, item) => {
        const key = fn(item)
        if (coll[key]) { throw err(key) }
        coll[fn(item)] = item
        return coll
    }, {})
}

export function id (value) { return value }
