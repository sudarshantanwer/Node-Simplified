let todo = [
    { task: "Learn Node JS", id: 1, status: false },
    { task: "Learn React JS", id: 2, status: true },
    { task: "Learn HTML", id: 3, status: true },
    { task: "Learn MongoDB", id: 4, status: false },
    { task: "Learn DSA", id: 5, status: false },
    { task: "Learn JavaScript", id: 6, status: true },
];

const DB_DELAY = 2000; // 2 seconds

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getAll = async () => {
    await delay(DB_DELAY);
    console.log('DB: Fetched all todos');
    return todo;
};

const getById = async (id) => {
    await delay(DB_DELAY);
    const task = todo.find(t => t.id === id);
    console.log(`DB: Fetched todo with id ${id}`);
    return task;
};

const create = async (newTaskData) => {
    await delay(DB_DELAY);
    const newId = todo.length > 0 ? Math.max(...todo.map(t => t.id)) + 1 : 1;
    const newTask = { ...newTaskData, id: newId };
    todo.push(newTask);
    console.log('DB: Created a new todo');
    return newTask;
};

const update = async (id, updateData) => {
    await delay(DB_DELAY);
    const index = todo.findIndex(t => t.id === id);
    if (index === -1) {
        return null;
    }
    todo[index] = { ...todo[index], ...updateData };
    console.log(`DB: Updated todo with id ${id}`);
    return todo[index];
};

const deleteById = async (id) => {
    await delay(DB_DELAY);
    const index = todo.findIndex(t => t.id === id);
    if (index === -1) {
        return null;
    }
    const deletedTask = todo.splice(index, 1);
    console.log(`DB: Deleted todo with id ${id}`);
    return deletedTask[0];
};

const deleteAll = async () => {
    await delay(DB_DELAY);
    todo = [];
    console.log('DB: Deleted all todos');
    return [];
};


module.exports = {
    getAll,
    getById,
    create,
    update,
    deleteById,
    deleteAll
};