# Redux Action Schema
Better action management for Redux

[![build status](https://img.shields.io/travis/modernserf/redux-action-schema/master.svg?style=flat-square)](https://travis-ci.org/modernserf/redux-action-schema)
[![npm version](https://img.shields.io/npm/v/redux-action-schema.svg?style=flat-square)](https://www.npmjs.com/package/redux-action-schema)

Redux Action Schema is a library for managing actions in Redux apps. It is a replacement for the constants file, providing stronger type guarantees while reducing boilerplate.

# Documentation
- [Guide](#guide)
- [API Reference](https://github.com/modernserf/redux-action-schema/blob/master/doc/api.md)

# Examples
- [Basic todo list](https://github.com/modernserf/redux-action-schema/blob/master/examples/todo.js)
- [Async action creators with redux-thunk](https://github.com/modernserf/redux-action-schema/blob/master/examples/async.js)
- [Usage with redux-saga](https://github.com/modernserf/redux-action-schema/blob/master/examples/async-saga.js)

# Guide

```
npm install --save redux-action-schema
```

## Creating a schema

In larger Redux projects, action types are frequently collected in a constants file. From the Redux docs:

> For larger projects, there are some benefits to defining action types as constants:
> - It helps keep the naming consistent because all action types are gathered in a single place.
- Sometimes you want to see all existing actions before working on a new feature. It may be that the action you need was already added by somebody on the team, but you didn’t know.
- The list of action types that were added, removed, and changed in a Pull Request helps everyone on the team keep track of scope and implementation of new features.
- If you make a typo when importing an action constant, you will get `undefined`. Redux will immediately throw when dispatching such an action, and you’ll find the mistake sooner.

But the way this is frequently implemented is primitive and repetitive:
```
export const ADD_TODO = 'ADD_TODO'
export const EDIT_TODO = 'EDIT_TODO'
export const COMPLETE_TODO = 'COMPLETE_TODO'
export const DELETE_TODO = 'DELETE_TODO'
export const COMPLETE_ALL = 'COMPLETE_ALL'
export const CLEAR_COMPLETED = 'CLEAR_COMPLETED'
export const SET_VISIBILITY = 'SET_VISIBILITY'

export const SHOW_ALL = 'show_all'
export const SHOW_COMPLETED = 'show_completed'
export const SHOW_ACTIVE = 'show_active'
```

This gets the job done, but its ugly and repetitive. Furthermore it doesn't provide any information about the _data_ in the action, only the type. Redux Action Schema enables compact action definitions with runtime type checks:

```
const showStates = ["all", "completed", "active"]

const schema = createSchema([
    // match actions with named parameters
    // e.g. { type: "addTodo", payload: { id: 123, text: "here's a todo" } }
    ["addTodo", "here is a docstring",
        ["id", "named params can have docstrings too", types.Number],
        ["text", types.String]],
    ["editTodo",
        ["id", types.Number],
        ["text", types.String]],

    // match actions with single values
    // e.g. { type: "completeTodo", payload: 123 }
    ["completeTodo", types.Number],
    ["deleteTodo", types.Number],

    // match actions with no data
    // e.g. { type: "completeAll" }
    ["completeAll"],
    ["clearCompleted"],

    // match actions with enumerated values
    // e.g. { type: "setVisibility", payload: "completed" }
    ["setVisibility", types.OneOf(showStates)],
])
```

This provides all of the benefits of using constants, but with additional benefits:

- **Consistent naming**: All action types are gathered in the same place. Additionally, the _argument names_ are gathered in the same place, so that those will be consistently named as well.
- **Track changes in pull requests**: You can see actions added, removed and changed at a glance in a pull request. Additionally, you can see changes in the action payloads.
- **Handle typos**: If you make a typo when using one of the created actions, e.g. `schema.actions.compleatTodo`, you will get `undefined`. Additionally, you will get errors if you:
    + use an undefined action creator, e.g. `schema.actionCreators.compleatTodo()`
    + use an unknown action in `createReducer`, e.g. `schema.createReducer({compleatTodo: (state) => state })`
    + dispatch an unknown action when using the validation middleware

## Generating a schema in an existing app

Redux Action Schema also includes a middleware that can **automatically generate** a schema for an existing app. Add the schema observer middleware:
```
import { createSchemaObserver } from "redux-action-schema"
import { createStore, applyMiddleware } from "redux"

/* ... */

// attached to window so its accessible from inside console
window.schemaObserver = createSchemaObserver()

const store = createStore(reducer, applyMiddleware(window.schemaObserver))
```

Run the app (manually or with a test runner). Then, from the console:

<!--  TODO: this is super confusing, but could be explained really simply with a gif (or even a comic strip?) -->

```
>   window.schemaObserver.schemaDefinitionString()
<   "createSchema([
        ["foo"],
        ["bar", types.Number],
        ["baz", types.String.optional],
        ["quux", types.OneOfType.optional(types.Number, types.String)],
        ["xyzzy",
            ["a", types.Number],
            ["b", types.String]]
    ])"
```

You can copy the output of `schemaDefinitionString` from the console into your code and get a head start on

## Generated actions

Protect against typos and automatically handle namespaces with generated actions:

```
schema.actions.addTodo // => "addTodo"
schema.actions.adTodo  // => undefined

// actions can be namespaced:
const fooSchema = createSchema([...], { namespace: "foo" })
schema.actions.addTodo // => "foo_addTodo"
```

## Action creators

An action creator is generated for each action in the schema:

```
const { editTodo, completeTodo } = schema.actionCreators
editTodo({ id: 10, text: "write docs" })
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
