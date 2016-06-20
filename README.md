# Redux Action Schema
Better action management for Redux

[![build status](https://img.shields.io/travis/modernserf/redux-action-schema/master.svg?style=flat-square)](https://travis-ci.org/modernserf/redux-action-schema)
[![npm version](https://img.shields.io/npm/v/redux-action-schema.svg?style=flat-square)](https://www.npmjs.com/package/redux-action-schema)

Redux Action Schema is a library for managing actions in Redux apps. It is a replacement for the constants file, providing stronger type guarantees while reducing boilerplate.

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

const schema = makeSchema([
    ["add_todo", "here is a docstring",
        ["id", todoID],
        ["text", types.String]],
    ["edit_todo",
        ["id", "params can have docstrings too", todoID],
        ["text", types.String]]
    ["complete_todo", todoID],
    ["delete_todo", todoID],
    ["complete_all"],
    ["clear_completed"],
    ["set_visibility", types.OneOf(show)]
])
```

## Using actions & action creators

The schema automatically generates action constants and action creators.

### Actions

Protect against typos and automatically handle namespaces with generated actions:

```
schema.actions.add_todo // => "add_todo"
schema.actions.ad_todo  // => undefined

const fooSchema = makeSchema([...], { namespace: "foo" })
schema.actions.add_todo // => "foo_add_todo"
```

### Action creators

An action creator is generated for each action in the schema:

```
const { edit_todo, complete_todo } = schema.actionCreators
edit_todo({id: 10, text: "write docs"})
// => { type: "edit_todo", payload: { id: 10, text: "write docs" } }

complete_todo(20) // => { type: "complete_todo", payload: 20 }

edit_todo.byPosition(10, "write GOOD docs")
// => { type: "edit_todo", payload: { id: 10, text: "write GOOD docs" } }
```

## Reducers

The schema can be used to create and validate simple reducers a la redux-action's [handleActions](https://github.com/acdlite/redux-actions#handleactionsreducermap-defaultstate):

```
const todoReducer = schema.createReducer({
    add_todo: (state, { id, text }) =>
        state.concat([{ id, text, completed: false }])
    complete_todo: (state, id) =>
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
store.dispatch({ type: "complete_todo", payload: "notAnID" }) // error
```

You may choose to use all these features at once, or mix and match -- you don't need to use the action creators or createReducer to benefit from the middleware, nor vice versa.
