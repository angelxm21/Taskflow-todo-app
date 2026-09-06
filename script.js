/* =========================================================
   TASKFLOW — JAVASCRIPT
   CRUD + LocalStorage + Filtering + Search + Sorting
   ========================================================= */


/* ================= STATE ================= */

let tasks = JSON.parse(localStorage.getItem("taskflow_tasks")) || [];

let currentFilter = "all";
let currentEditId = null;


/* ================= DOM ELEMENTS ================= */

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");

const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");

const filterButtons = document.querySelectorAll(".filter-btn");

const totalTasks = document.getElementById("totalTasks");
const activeTasks = document.getElementById("activeTasks");
const completedTasks = document.getElementById("completedTasks");
const progressText = document.getElementById("progressText");

const progressRing = document.getElementById("progressRing");
const progressValue = document.getElementById("progressValue");

const lowCount = document.getElementById("lowCount");
const mediumCount = document.getElementById("mediumCount");
const highCount = document.getElementById("highCount");

const currentDate = document.getElementById("currentDate");

const clearCompleted = document.getElementById("clearCompleted");
const clearAll = document.getElementById("clearAll");

const modalOverlay = document.getElementById("modalOverlay");
const closeModal = document.getElementById("closeModal");
const cancelEdit = document.getElementById("cancelEdit");
const saveEdit = document.getElementById("saveEdit");

const editTitle = document.getElementById("editTitle");
const editDescription = document.getElementById("editDescription");
const editPriority = document.getElementById("editPriority");
const editDueDate = document.getElementById("editDueDate");

const toast = document.getElementById("toast");


/* ================= LOCAL STORAGE ================= */

function saveTasks() {
    localStorage.setItem(
        "taskflow_tasks",
        JSON.stringify(tasks)
    );
}


/* ================= DATE ================= */

function updateDate() {

    const today = new Date();

    currentDate.textContent = today.toLocaleDateString(
        "en-US",
        {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        }
    );
}


/* ================= ESCAPE HTML ================= */

function escapeHTML(value) {

    const div = document.createElement("div");

    div.textContent = value;

    return div.innerHTML;
}


/* ================= ADD TASK ================= */

taskForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const title = taskInput.value.trim();

    if (!title) {
        showToast(
            "Please enter a task.",
            "warning"
        );

        return;
    }


    const newTask = {

        id: Date.now(),

        title: title,

        description: "",

        completed: false,

        priority: "medium",

        dueDate: "",

        createdAt: Date.now()

    };


    tasks.unshift(newTask);

    saveTasks();

    taskInput.value = "";

    render();

    showToast(
        "Task added successfully.",
        "success"
    );

    taskInput.focus();

});


/* ================= GET VISIBLE TASKS ================= */

function getVisibleTasks() {

    let filteredTasks = [...tasks];


    /* FILTER */

    if (currentFilter === "active") {

        filteredTasks = filteredTasks.filter(
            task => !task.completed
        );

    }

    if (currentFilter === "completed") {

        filteredTasks = filteredTasks.filter(
            task => task.completed
        );

    }


    /* SEARCH */

    const searchTerm =
        searchInput.value.trim().toLowerCase();


    if (searchTerm) {

        filteredTasks = filteredTasks.filter(task =>

            task.title.toLowerCase().includes(searchTerm) ||

            task.description.toLowerCase().includes(searchTerm)

        );

    }


    /* SORT */

    const sortType = sortSelect.value;


    if (sortType === "newest") {

        filteredTasks.sort(
            (a, b) => b.createdAt - a.createdAt
        );

    }


    else if (sortType === "oldest") {

        filteredTasks.sort(
            (a, b) => a.createdAt - b.createdAt
        );

    }


    else if (sortType === "alphabetical") {

        filteredTasks.sort(
            (a, b) =>
                a.title.localeCompare(b.title)
        );

    }


    else if (sortType === "priority") {

        const priorityOrder = {
            high: 1,
            medium: 2,
            low: 3
        };

        filteredTasks.sort(
            (a, b) =>
                priorityOrder[a.priority] -
                priorityOrder[b.priority]
        );

    }


    else if (sortType === "dueDate") {

        filteredTasks.sort((a, b) => {

            if (!a.dueDate) return 1;

            if (!b.dueDate) return -1;

            return (
                new Date(a.dueDate) -
                new Date(b.dueDate)
            );

        });

    }


    return filteredTasks;
}


/* ================= RENDER TASKS ================= */

function renderTasks() {

    const visibleTasks = getVisibleTasks();


    if (visibleTasks.length === 0) {

        taskList.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ✓
                </div>

                <h3>No tasks found</h3>

                <p>
                    ${
                        tasks.length === 0
                            ? "Add your first task and start organizing your day."
                            : "Try changing your filter or search."
                    }
                </p>

            </div>

        `;

        return;
    }


    taskList.innerHTML = visibleTasks
        .map(createTaskHTML)
        .join("");

}


/* ================= CREATE TASK HTML ================= */

function createTaskHTML(task) {

    const priorityLabel =
        task.priority.charAt(0).toUpperCase() +
        task.priority.slice(1);


    const dueDate = task.dueDate
        ? formatDate(task.dueDate)
        : "";


    return `

        <div
            class="task-item ${
                task.completed ? "completed" : ""
            }"
            data-id="${task.id}"
        >

            <input
                type="checkbox"
                class="task-check"
                data-action="toggle"
                ${
                    task.completed
                        ? "checked"
                        : ""
                }
                aria-label="Complete task"
            >


            <div class="task-content">

                <div class="task-title">
                    ${escapeHTML(task.title)}
                </div>


                ${
                    task.description
                        ? `
                            <div class="task-description">
                                ${escapeHTML(
                                    task.description
                                )}
                            </div>
                        `
                        : ""
                }


                <div class="task-meta">

                    <span
                        class="badge badge-${task.priority}"
                    >
                        ${priorityLabel}
                    </span>


                    ${
                        dueDate
                            ? `
                                <span class="due-date">
                                    Due ${dueDate}
                                </span>
                            `
                            : ""
                    }

                </div>

            </div>


            <div class="task-actions">

                <button
                    type="button"
                    class="icon-btn edit"
                    data-action="edit"
                    title="Edit task"
                    aria-label="Edit task"
                >
                    ✎
                </button>


                <button
                    type="button"
                    class="icon-btn delete"
                    data-action="delete"
                    title="Delete task"
                    aria-label="Delete task"
                >
                    ×
                </button>

            </div>

        </div>

    `;
}


/* ================= FORMAT DATE ================= */

function formatDate(dateString) {

    const date = new Date(
        dateString + "T00:00:00"
    );

    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric"
        }
    );
}


/* ================= TASK DELEGATION ================= */

taskList.addEventListener("click", function (event) {

    const actionElement =
        event.target.closest("[data-action]");


    if (!actionElement) {
        return;
    }


    const taskElement =
        actionElement.closest(".task-item");


    if (!taskElement) {
        return;
    }


    const id = Number(
        taskElement.dataset.id
    );


    const action =
        actionElement.dataset.action;


    if (action === "edit") {

        openEditModal(id);

    }


    if (action === "delete") {

        deleteTask(id);

    }

});


/* ================= CHECKBOX DELEGATION ================= */

taskList.addEventListener("change", function (event) {

    if (
        !event.target.matches(
            '[data-action="toggle"]'
        )
    ) {
        return;
    }


    const taskElement =
        event.target.closest(".task-item");


    const id = Number(
        taskElement.dataset.id
    );


    toggleTask(id);

});


/* ================= TOGGLE TASK ================= */

function toggleTask(id) {

    const task = tasks.find(
        task => task.id === id
    );


    if (!task) {
        return;
    }


    task.completed = !task.completed;


    saveTasks();

    render();


    showToast(
        task.completed
            ? "Task completed."
            : "Task marked as active.",
        "success"
    );

}


/* ================= DELETE TASK ================= */

function deleteTask(id) {

    const taskIndex = tasks.findIndex(
        task => task.id === id
    );


    if (taskIndex === -1) {
        return;
    }


    tasks.splice(taskIndex, 1);

    saveTasks();

    render();


    showToast(
        "Task deleted.",
        "error"
    );

}


/* ================= OPEN EDIT MODAL ================= */

function openEditModal(id) {

    const task = tasks.find(
        task => task.id === id
    );


    if (!task) {
        return;
    }


    currentEditId = id;


    editTitle.value =
        task.title;

    editDescription.value =
        task.description || "";

    editPriority.value =
        task.priority || "medium";

    editDueDate.value =
        task.dueDate || "";


    modalOverlay.classList.add("active");

    editTitle.focus();

}


/* ================= CLOSE EDIT MODAL ================= */

function closeEditModal() {

    modalOverlay.classList.remove(
        "active"
    );

    currentEditId = null;

}


/* ================= SAVE EDIT ================= */

saveEdit.addEventListener("click", function () {

    if (!currentEditId) {
        return;
    }


    const task = tasks.find(
        task => task.id === currentEditId
    );


    if (!task) {
        return;
    }


    const title =
        editTitle.value.trim();


    if (!title) {

        showToast(
            "Task title cannot be empty.",
            "warning"
        );

        return;
    }


    task.title = title;

    task.description =
        editDescription.value.trim();

    task.priority =
        editPriority.value;

    task.dueDate =
        editDueDate.value;


    saveTasks();

    closeEditModal();

    render();


    showToast(
        "Task updated successfully.",
        "success"
    );

});


/* ================= MODAL EVENTS ================= */

closeModal.addEventListener(
    "click",
    closeEditModal
);


cancelEdit.addEventListener(
    "click",
    closeEditModal
);


modalOverlay.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            modalOverlay
        ) {
            closeEditModal();
        }

    }
);


/* ================= ESCAPE KEY ================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape" &&
            modalOverlay.classList.contains(
                "active"
            )
        ) {
            closeEditModal();
        }

    }
);


/* ================= FILTERS ================= */

filterButtons.forEach(button => {

    button.addEventListener(
        "click",
        function () {

            filterButtons.forEach(btn =>
                btn.classList.remove("active")
            );


            this.classList.add("active");


            currentFilter =
                this.dataset.filter;


            renderTasks();

        }
    );

});


/* ================= SEARCH ================= */

searchInput.addEventListener(
    "input",
    renderTasks
);


/* ================= SORT ================= */

sortSelect.addEventListener(
    "change",
    renderTasks
);


/* ================= CLEAR COMPLETED ================= */

clearCompleted.addEventListener(
    "click",
    function () {

        const completed =
            tasks.filter(
                task => task.completed
            ).length;


        if (completed === 0) {

            showToast(
                "There are no completed tasks.",
                "warning"
            );

            return;
        }


        tasks =
            tasks.filter(
                task => !task.completed
            );


        saveTasks();

        render();


        showToast(
            "Completed tasks cleared.",
            "success"
        );

    }
);


/* ================= CLEAR ALL ================= */

clearAll.addEventListener(
    "click",
    function () {

        if (tasks.length === 0) {

            showToast(
                "There are no tasks to clear.",
                "warning"
            );

            return;
        }


        const confirmed =
            confirm(
                "Are you sure you want to delete all tasks?"
            );


        if (!confirmed) {
            return;
        }


        tasks = [];

        saveTasks();

        render();


        showToast(
            "All tasks cleared.",
            "success"
        );

    }
);


/* ================= STATISTICS ================= */

function updateStats() {

    const total =
        tasks.length;


    const completed =
        tasks.filter(
            task => task.completed
        ).length;


    const active =
        total - completed;


    const progress =
        total === 0
            ? 0
            : Math.round(
                (completed / total) * 100
            );


    totalTasks.textContent =
        total;

    activeTasks.textContent =
        active;

    completedTasks.textContent =
        completed;

    progressText.textContent =
        `${progress}%`;

    progressValue.textContent =
        `${progress}%`;


    /* Progress ring */

    const circumference = 2 * Math.PI * 65;

    const offset =
        circumference -
        (progress / 100) * circumference;


    progressRing.style.strokeDasharray =
        circumference;

    progressRing.style.strokeDashoffset =
        offset;


    /* Priority counts */

    lowCount.textContent =
        tasks.filter(
            task => task.priority === "low"
        ).length;


    mediumCount.textContent =
        tasks.filter(
            task => task.priority === "medium"
        ).length;


    highCount.textContent =
        tasks.filter(
            task => task.priority === "high"
        ).length;

}


/* ================= TOAST ================= */

let toastTimer;


function showToast(
    message,
    type = "success"
) {

    clearTimeout(toastTimer);


    toast.textContent =
        message;


    toast.className =
        `toast ${type} show`;


    toastTimer =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 2500);

}


/* ================= RENDER ================= */

function render() {

    renderTasks();

    updateStats();

}


/* ================= KEYBOARD SHORTCUT ================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            (event.ctrlKey ||
                event.metaKey) &&
            event.key.toLowerCase() === "k"
        ) {

            event.preventDefault();

            searchInput.focus();

            searchInput.select();

        }

    }
);


/* ================= INITIALIZE ================= */

updateDate();

render();

taskInput.focus();