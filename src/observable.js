import Observable from "zen-observable"

// resource(
//     ["foo", "bar", "baz"], // selectors
//     ["quuxSent", "plughHappened"], // actions
// ({ foo, bar, baz }, { quuxSent, plughHappened }) => {
//     return new O
// })

// export function createResourceCreator (actions, selectors) {
//     return (selectorNames, actionNames, createObservable) {
//         const selector$ = selectorNames.reduce(createSelectorObservable, {})
//         const action$ = actionNames.reduce(createActionObservable, {})
//         return createObservable(selector$,action$)
//     }
// }

export function createRootObservable (store) {
    return new Observable((o) => {
        store.subscribe(() => {
            const state = store.getState()
            o.next(state)
        })
    })
}

export function createSelectorObservable (selector, root) {
    let lastValue
    return root.map(selector).filter((nextValue) => {
        if (lastValue === nextValue) { return false }
        lastValue = nextValue
        return true
    })
}
