# API Reference

- [types](#types)
- [createSchema](#makeschema)
- [schema methods](#schema)
    + [actions](#actions)
    + [actionCreators](#actioncreators)
    + [createReducer](#createreducer)
    + [createMiddleware](#createmiddleware)
- [createSchemaObserver](#createschemaobserver)

```
import { types, createSchema, createSchemaObserver } from "redux-action-schema"
```

# types

Types are used for schema definitions and action validation.

Any function that takes a value & returns a boolean can be used as a type, but we've provided a few common ones:

```
types.Object // matches any non-Array Object
types.Number // matches numbers
types.String // matches strings
types.Array // matches Arrays
types.Boolean // matches bools
types.Any // matches any non-null
types.OneOf([values...]) // matches members of array
types.ArrayOf(typeFn) // matches arrays where each element matches typeFn
types.OneOfType(typeA, typeB, ...) // matches any of its arguments
```

Each of the types also has an `optional` variant that also matches `null` and `undefined`:

```
types.Object.optional // matches { foo: bar }, null, undefined
types.ArrayOf.optional(types.Number) // matches [1,2,3], null, undefined
types.ArrayOf(types.Number.optional) // matches [1, null, 3]
```

# createSchema

```
createSchema(actions, [options])
```

### Arguments

- `actions` _(Array)_: A list of action definitions to validate against. See [next section](#action-definitions) for more on this.
- `[options]` _(Object)_: Additional options for building the schema:
    + `namespace` _(String)_: prefix for action type strings handled by this schema. For example, `schema = createSchema(["foo"], { namespace: "ns"})` will use `schema.actions.foo` but expect actions like `{ type: "ns_foo" }`

### Returns

(){ [actions](#actions), [actionCreators](#actioncreators), [createReducer](#createreducer), [createMiddleware](#createmiddleware) } = : a collection of objects and functions for working with and validating actions.


## Action definitions

```
// no parameters
[typeName]
[typeName, docstring]

// single parameter
[typeName, typeFn]
[typeName, docstring, typeFn]

// named parameters
[typeName, docstring,
    [paramName, typeFn],
    [paramName, docstring, typeFn],
    ...
]
```

# Schema methods

## actions

```
schema.actions.<ACTION_NAME>
```

An object mapping action names to their string representations. By default, these are identical, e.g. `actions.foo === "foo"`; however, if the schema is created with a namespace parameter, that will be prepended to the action name, e.g. given `{ namespace: "ns" }` then `actions.foo === "ns_foo"`.

## actionCreators

An object mapping action names to functions that create actions of that type.

```
schema.actionCreators.foo(value) => { type: "foo", payload: value }
```

## createReducer

```
schema.createReducer(reducerMap, [initialState])
```

### Arguments

- `reducerMap` _(Object)_ : map of action types to reducer functions, with signature `(state, payload, action) => nextState`
- `[initState]` _(Any)_ : initial state provided to reducer functions.

### Returns

(`(state = initState, action) => nextState`): a reducer function that handles all of the actions in the reducer map.

### Throws

`createReducer` throws if a key in the reducer map does not correspond to an action type, or if a value in the reducer map is not a function.

## createMiddleware

```
schema.createMiddleware([options])
```

### Arguments

- `[options]`
    + `ignorePayloads` _(Boolean)_: Don't type check payloads, only check type names. You may want to use this for performance reasons. **Default value:** `false`.
    + `onError` (`(action) => ()`): Callback called when an action doesn't validate. **Default value:** `console.error("unknown action:", action)`
    + `ignoreActions` _(Array<String>)_: List of actions not in schema that shouldn't cause validation errors, e.g. those used by third-party middleware. **Default value:** `["EFFECT_TRIGGERED", "EFFECT_RESOLVED", "@@router/UPDATE_LOCATION"]`, which are used by popular libraries redux-saga and react-redux-router.

### Returns

(`middleware`): a Redux middleware.

# createSchemaObserver

```
createSchemaObserver()
```

### Returns

(`observerMiddleware`): a redux middleware, with additional methods for schema generation.

## schemaDefinitionString

```
observerMiddleware.schemaDefinitionString()
```

### Returns

_(String)_: source code for a schema definition.
