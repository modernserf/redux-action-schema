# API Reference

# types

## base types
- `Object`
- `Number`
- `String`
- `Boolean`
- `Function`
- `Array`
- `Type` matches a type object
- `Any` matches anything besides `null` or `undefined`

## parameterized types
- Exactly(value)
- Optional(type)
- InstanceOf(constructor)
- OneOf([value])
- ArrayOf(type)
- ObjectOf(type)
- OneOfType([type])
- Tuple(shape)
- Record([fields])
- Shape([fields])
- Variant([records])

## propTypes(definition)

## propTypes template

# actions

## createActions(definitions)

## actionSchema template

## combineActions({scope: actions}, [rootActions])

# selectors

## createSelectors(definitions)

## selectorSchema template

## selector types
- plain reducer function
- reducerMap(reducers, initState)
- selector(dependencies, combineState)
- asyncSelector
- observableSelector

## createSelectorCreator(selectors) => (dependencies, [combineState])

## combineSelectors({ scope: selectors }, [rootSelectors])

# reducers

## createReducerCreator(actions, [scope]) => (reducerMap, initState, [scope])
TODO scope as arg to factory or function?

## createRootReducer(actions, selectors)

# connector

## createConnector(actions, selectors)
