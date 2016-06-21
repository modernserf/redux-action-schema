# Redux Action Schema
Better action management for Redux

[![build status](https://img.shields.io/travis/modernserf/redux-action-schema/master.svg?style=flat-square)](https://travis-ci.org/modernserf/redux-action-schema)
[![npm version](https://img.shields.io/npm/v/redux-action-schema.svg?style=flat-square)](https://www.npmjs.com/package/redux-action-schema)

Redux Action Schema is a library for managing actions in Redux apps. It is a replacement for the constants file, providing stronger type guarantees while reducing boilerplate.

## Table of Contents

- [Guide](#guide)
    + [Creating a schema](#creating-a-schema)
    + [Using actions & action creators](#using-actions--action-creators)
    + [Reducers](#reducers)
    + [Middleware](#middleware)
- [API Reference](#api-reference)
    + [types](#types)
    + [createSchema](#makeschema)
    + [actions](#actions)
    + [actionCreators](#actioncreators)
    + [createReducer](#createreducer)
    + [createMiddleware](#createmiddleware)

# Guide

```
npm install --save redux-action-schema
```

## Creating a schema

In larger Redux projects, action types are frequently collected in a constants file. From the Redux docs:

> For larger projects, there are some benefits to defining action types as constants:
- It helps keep the naming consistent because all action types are gathered in a single place.
- Sometimes you want to see all existing actions before working on a new feature. It may be that the action you need was already added by somebody on the team, but you didn’t know.
- The list of action types that were added, removed, and changed in a Pull Request helps everyone on the team keep track of scope and implementation of new features.
- If you make a typo when importing an action constant, you will get `undefined`. Redux will immediately throw when dispatching such an action, and you’ll find the mistake sooner.

But the way this is frequently implemented is [primitive and repetitive](https://github.com/reactjs/redux/blob/master/examples/todomvc/constants/ActionTypes.js):

```
export const ADD_TODO = 'ADD_TODO'
export const DELETE_TODO = 'DELETE_TODO'
export const EDIT_TODO = 'EDIT_TODO'
export const COMPLETE_TODO = 'COMPLETE_TODO'
export const COMPLETE_ALL = 'COMPLETE_ALL'
export const CLEAR_COMPLETED = 'CLEAR_COMPLETED'

export const SHOW_ALL = 'show_all'
export const SHOW_COMPLETED = 'show_completed'
export const SHOW_ACTIVE = 'show_active'
```

This gets the job done, but its ugly and repetitive. Furthermore it doesn't provide any information about the data in the action, only the type. Redux Action Schema enables compact action definitions with runtime type checks:

```
const show = ["all", "active", "completed"]

// types are functions that return true/false
const todoID = (value) => typeof value === "number" && value > 0

const schema = createSchema([
    ["addTodo", "here is a docstring",
        ["id", todoID],
        ["text", types.String]],
    ["editTodo",
        ["id", "params can have docstrings too", todoID],
        ["text", types.String]]
    ["completeTodo", todoID],
    ["deleteTodo", todoID],
    ["completeAll"],
    ["clearCompleted"],
    ["setVisibility", types.OneOf(show)]])
```

## Using actions & action creators

The schema automatically generates action constants and action creators.

### Generated actions

Protect against typos and automatically handle namespaces with generated actions:

```
schema.actions.addTodo // => "addTodo"
schema.actions.adTodo  // => undefined

const fooSchema = createSchema([...], { namespace: "foo" })
schema.actions.addTodo // => "foo_addTodo"
```

### Action creators

An action creator is generated for each action in the schema:

```
const { editTodo, completeTodo } = schema.actionCreators
editTodo({id: 10, text: "write docs"})
// => { type: "editTodo", payload: { id: 10, text: "write docs" } }

completeTodo(20) // => { type: "completeTodo", payload: 20 }

editTodo.byPosition(10, "write GOOD docs")
// => { type: "editTodo", payload: { id: 10, text: "write GOOD docs" } }
```

## Reducers

The schema can be used to create and validate simple reducers a la redux-action's [handleActions](https://github.com/acdlite/redux-actions#handleactionsreducermap-defaultstate):

```
const todoReducer = schema.createReducer({
    addTodo: (state, { id, text }) =>
        state.concat([{ id, text, completed: false }])
    completeTodo: (state, id) =>
        state.map((todo) => todo.id === id
            ? { ...todo, completed: !todo.completed }
            : todo)
}, [])
```

Unlike `handleActions`, createReducer verifies that a reducer's handled actions are in the schema:

```
schema.createReducer({
    nope: (state, payload) => state
}, initState)

// => Uncaught Error: "unknown action: nope"
```

## Middleware

Finally, the schema generates a redux middleware for checking that dispatched actions are in the schema:

```
const store = createStore(
    reducer,
    applyMiddleware(schema.createMiddleware({
        onError: (action) => console.error(action)
    })))

store.dispatch({ type: "idunno" }) // error
store.dispatch({ type: "completeTodo", payload: "notAnID" }) // error
```

You may choose to use all these features at once, or mix and match -- you don't need to use the action creators or createReducer to benefit from the middleware, nor vice versa.

# API Reference

```
const { types, createSchema } = import "redux-action-schema"
```

## types

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

## createSchema

```
createSchema(actions, [options])
```

### Arguments

- `actions` _(Array)_: A list of action definitions to validate against. See [next section](#action-definitions) for more on this.
- `[options]` _(Object)_: Additional options for building the schema:
    + `namespace` _(String)_: prefix for action type strings handled by this schema. For example, `schema = createSchema(["foo"], { namespace: "ns"})` will use `schema.actions.foo` but expect actions like `{ type: "ns_foo" }`

### Returns

({ [actions](#actions), [actionCreators](#actioncreators), [createReducer](#createreducer), [createMiddleware](#createmiddleware) }): a collection of objects and functions for working with the schema.

### Action definitions

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

## actions

An object mapping action names to their string representations. By default, these are identical, e.g. `actions.foo === "foo"`; however, if the schema is created with a namespace parameter, that will be prepended to the action name, e.g. given `{ namespace: "ns" }` then `actions.foo === "ns_foo"`.

## actionCreators

An object mapping action names to functions that create actions of that type.

```
actionCreators.foo(value) => { type: "foo", payload: value }
```

## createReducer

Create a reducer for handling

```
createReducer(reducerMap, [initialState])
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
createMiddleware([options])
```

### Arguments

- `[options]`
    + `ignorePayloads` _(Boolean)_: Don't type check payloads, only check type names. You may want to use this for performance reasons. **Default value:** `false`.
    + `onError` (`(action) => ()`): Callback called when an action doesn't validate. **Default value:** `console.error("unknown action:", action)`
    + `ignoreActions` _(Array<String>)_: List of actions not in schema that shouldn't cause validation errors, e.g. those used by third-party middleware. **Default value:** `["EFFECT_TRIGGERED", "EFFECT_RESOLVED", "@@router/UPDATE_LOCATION"]`, which are used by popular libraries redux-saga and react-redux-router.

### Returns

(`middleware`): a Redux middleware.
