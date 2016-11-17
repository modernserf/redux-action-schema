import React, { Component } from "react"
import { types, propTypes } from "redux-action-schema"
import { connect, Visibility, Status, Todo as TodoType, TodoList as TodoListType } from "./data"
import "./App.css"

const TodoInput = connect([], ["addedTodo"])(class TodoInput extends Component {
    static propTypes = propTypes([
        ["addedTodo", types.Function],
    ])
    state = {
        text: "",
    }
    onSubmit = (e) => {
        e.preventDefault()
        this.props.addedTodo({ text: this.state.text })
        this.setState({ text: "" })
    }
    onChange = (e) => {
        this.setState({ text: e.target.value })
    }
    render () {
        const { text } = this.state
        return (
            <form className="TodoInput" onSubmit={this.onSubmit}>
                <input type="text" value={text} onChange={this.onChange}/>
            </form>
        )
    }
})

const TodoHeader = connect(
[],
["completedAll"]
)(class TodoHeader extends Component {
    static propTypes = propTypes([
        ["completedAll", types.Function],
    ])
    render () {
        const { completedAll } = this.props

        return (
            <div className="TodoHeader">
                <div className="TodoHeader__completed">
                    <button onClick={completedAll}>v</button>
                </div>
                <div className="TodoHeader__input-wrap">
                    <TodoInput/>
                </div>
            </div>
        )
    }
})

class ToggleButton extends React.Component {
    static propTypes = propTypes([
        ["status", Status],
        ["onToggle", types.Function],
    ])
    render () {
        const { status, onToggle } = this.props
        const completed = status === Status.completed

        return (
            <button className={`ToggleButton ${completed ? "--completed" : ""}`}
                onClick={onToggle}>
                <span className="ToggleButton__check">✔︎</span>
            </button>
        )
    }
}

class Todo extends React.Component {
    state = {
        edit: false,
        text: "",
    }
    onEditStart = () => {
        this.setState({ edit: true, text: this.props.data.text })
    }
    onEditCancel = () => {
        this.setState({ edit: false, text: "" })
    }
    onChange = (e) => {
        this.setState({ text: e.target.value })
    }
    onEditComplete = (e) => {
        e.preventDefault()
        this.props.onEdit(this.state.text)
        this.onEditCancel()
    }
    static propTypes = propTypes([
        ["data", TodoType],
        ["onEdit", types.Function],
        ["onToggle", types.Function],
        ["onDelete", types.Function],
    ])
    render () {
        const { edit, text: editText } = this.state
        const {
            data: { text, status },
            onToggle, onDelete,
        } = this.props

        return edit ? (
            <div className="Todo --editing">
                <form className="Todo__edit-form"
                    onSubmit={this.onEditComplete}>
                    <input type="text" value={editText}
                        onChange={this.onChange}
                        ref={(el) => el && el.focus()}
                        onBlur={this.onEditCancel}/>
                </form>
            </div>
        ) : (
            <div className="Todo">
                <div className="Todo__toggle-wrap">
                    <ToggleButton status={status} onToggle={onToggle} />
                </div>
                <div className="Todo__content"
                    onDoubleClick={this.onEditStart}>
                    {text}
                </div>
                <button className="Todo__delete-button"
                    onClick={onDelete}>×</button>
            </div>
        )
    }
}

const TodoList = connect(
["filteredTodos"],
["editedTodo", "toggledTodo", "deletedTodo"]
)(class TodoList extends Component {
    static propTypes = propTypes([
        ["filteredTodos", TodoListType],
        ["editedTodo", types.Function],
        ["toggledTodo", types.Function],
        ["deletedTodo", types.Function],
    ])
    render () {
        const { filteredTodos: todos, editedTodo, toggledTodo, deletedTodo } = this.props

        return (
            <div className="TodoList">
                <ul>{todos.map((todo) =>
                    <li key={todo.id}>
                        <Todo data={todo}
                            onEdit={(text) => editedTodo({ text, id: todo.id })}
                            onToggle={() => toggledTodo(todo.id)}
                            onDelete={() => deletedTodo(todo.id)}/>
                    </li>
                )}</ul>
            </div>
        )
    }
})

const visibilityLabels = [
    { id: Visibility.all, label: "All" },
    { id: Visibility.active, label: "Active" },
    { id: Visibility.completed, label: "Completed" },
]

const VisibilitySettings = connect(
    ["visibility"],
    ["setVisibility"]
)(class VisibilitySettings extends Component {
    static propTypes = propTypes([
        ["visibility", Visibility],
        ["setVisibility", types.Function],
    ])
    render () {
        const { visibility, setVisibility } = this.props
        return (
            <div className="VisibilitySettings">
                <ul>{visibilityLabels.map(({ id, label }) =>
                    <li key={id}
                        className={`VisibilitySettings__item
                            ${visibility === id ? "--active" : ""}`}>
                        <button onClick={() => setVisibility(id)}>
                            {label}
                        </button>
                    </li>
                )}</ul>
            </div>
        )
    }
})

const TodoFooter = connect(
    ["activeCount", "hasCompletedTodos"],
    ["clearedCompleted"]
)(class TodoFooter extends Component {
    static propTypes = propTypes([
        ["activeCount", types.Number],
        ["hasCompletedTodos", types.Boolean],
        ["clearedCompleted", types.Function],
    ])
    render () {
        const { activeCount, hasCompletedTodos, clearedCompleted } = this.props
        const countText = activeCount > 1 ? `${activeCount} items left`
            : activeCount === 1 ? "1 item left"
            : "No items left"

        return (
            <div className={`TodoFooter
                    ${hasCompletedTodos ? "--completed-todos" : ""}`}>
                <div className="TodoFooter__count">{countText}</div>
                <VisibilitySettings />
                <div className="TodoFooter__clear">
                    <button onClick={clearedCompleted}>Clear completed</button>
                </div>
            </div>
        )
    }
})

class App extends Component {
    render () {
        return (
            <div className="App">
                <h1 className="App__title">todos</h1>
                <div className="App__container">
                    <header>
                        <TodoHeader />
                    </header>
                    <TodoList />
                    <footer>
                        <TodoFooter />
                    </footer>
                </div>
            </div>
        )
    }
}

export default App
