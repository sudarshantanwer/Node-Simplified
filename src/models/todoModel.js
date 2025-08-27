// Enhanced todo model with user association
let todos = [
    { task: "Learn Node JS", id: 1, status: false, userId: 1, createdAt: new Date(), updatedAt: new Date() },
    { task: "Learn React JS", id: 2, status: true, userId: 1, createdAt: new Date(), updatedAt: new Date() },
    { task: "Learn HTML", id: 3, status: true, userId: 1, createdAt: new Date(), updatedAt: new Date() },
    { task: "Learn MongoDB", id: 4, status: false, userId: 1, createdAt: new Date(), updatedAt: new Date() },
    { task: "Learn DSA", id: 5, status: false, userId: 1, createdAt: new Date(), updatedAt: new Date() },
    { task: "Learn JavaScript", id: 6, status: true, userId: 1, createdAt: new Date(), updatedAt: new Date() },
];

let nextTodoId = 7;

class TodoModel {
    static getAllTodos() {
        return todos;
    }

    static getTodosByUserId(userId) {
        return todos.filter(todo => todo.userId === userId);
    }

    static getTodoById(id, userId = null) {
        const todo = todos.find(t => t.id === id);
        if (userId && todo && todo.userId !== userId) {
            return null; // User doesn't have access to this todo
        }
        return todo;
    }

    static createTodo(todoData, userId) {
        const newTodo = {
            id: nextTodoId++,
            task: todoData.task,
            status: todoData.status || false,
            userId,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        todos.push(newTodo);
        return newTodo;
    }

    static updateTodo(id, updateData, userId) {
        const todoIndex = todos.findIndex(t => t.id === id);
        
        if (todoIndex === -1) {
            return null; // Todo not found
        }

        const todo = todos[todoIndex];
        
        // Check if user has permission to update this todo
        if (userId && todo.userId !== userId) {
            return false; // User doesn't have permission
        }

        // Update todo
        todos[todoIndex] = {
            ...todo,
            ...updateData,
            id, // Ensure ID doesn't change
            userId: todo.userId, // Ensure userId doesn't change
            createdAt: todo.createdAt, // Ensure createdAt doesn't change
            updatedAt: new Date()
        };

        return todos[todoIndex];
    }

    static deleteTodo(id, userId) {
        const todoIndex = todos.findIndex(t => t.id === id);
        
        if (todoIndex === -1) {
            return null; // Todo not found
        }

        const todo = todos[todoIndex];
        
        // Check if user has permission to delete this todo
        if (userId && todo.userId !== userId) {
            return false; // User doesn't have permission
        }

        const deletedTodo = todos.splice(todoIndex, 1)[0];
        return deletedTodo;
    }

    static deleteAllTodosByUserId(userId) {
        const userTodos = todos.filter(todo => todo.userId === userId);
        todos = todos.filter(todo => todo.userId !== userId);
        return userTodos;
    }

    static deleteAllTodos() {
        const deletedTodos = [...todos];
        todos = [];
        nextTodoId = 1;
        return deletedTodos;
    }

    static getTodoStats(userId = null) {
        const relevantTodos = userId ? this.getTodosByUserId(userId) : todos;
        
        return {
            total: relevantTodos.length,
            completed: relevantTodos.filter(todo => todo.status === true).length,
            pending: relevantTodos.filter(todo => todo.status === false).length,
            recentlyCreated: relevantTodos.filter(todo => {
                const dayAgo = new Date();
                dayAgo.setDate(dayAgo.getDate() - 1);
                return new Date(todo.createdAt) > dayAgo;
            }).length
        };
    }

    static searchTodos(query, userId = null) {
        const relevantTodos = userId ? this.getTodosByUserId(userId) : todos;
        
        return relevantTodos.filter(todo => 
            todo.task.toLowerCase().includes(query.toLowerCase())
        );
    }

    static getTodosByStatus(status, userId = null) {
        const relevantTodos = userId ? this.getTodosByUserId(userId) : todos;
        
        return relevantTodos.filter(todo => todo.status === status);
    }

    static paginateTodos(page = 1, limit = 10, userId = null) {
        const relevantTodos = userId ? this.getTodosByUserId(userId) : todos;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        
        return {
            todos: relevantTodos.slice(startIndex, endIndex),
            totalCount: relevantTodos.length,
            currentPage: page,
            totalPages: Math.ceil(relevantTodos.length / limit),
            hasNextPage: endIndex < relevantTodos.length,
            hasPrevPage: page > 1
        };
    }
}

module.exports = TodoModel;