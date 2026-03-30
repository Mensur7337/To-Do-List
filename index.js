const formEl = document.querySelector("#todo-form"),
      inputEl = document.querySelector("#task-input"),
      startDateEl = document.querySelector("#start-date"),
      endDateEl = document.querySelector("#end-date"),
      newCategoryInput = document.querySelector("#new-category-input"),
      addCategoryBtn = document.querySelector("#add-category-btn"),
      trigger = document.querySelector(".select-trigger"),
      optionsContainer = document.getElementById("category-options"),
      categoryFilterEl = document.getElementById("category-filter"),
      activeListEl = document.getElementById("active-list"),
      completedListEl = document.getElementById("completed-list"),
      editModal = document.getElementById("edit-modal"),
      editForm = document.getElementById("edit-form"),
      searchEl = document.getElementById("search-input"),
      filterStatusEl = document.getElementById("status-filter"),
      dateFromEl = document.getElementById("filter-from"),
      dateToEl = document.getElementById("filter-to");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let categories = JSON.parse(localStorage.getItem("categories")) || ["General", "Work", "Personal"];
let selectedCategory = "General";
let editingTaskId = null;

initApp();

function initApp() {
    renderCategories();
    renderAll();
}

function renderCategories() {
    optionsContainer.innerHTML = "";
    categoryFilterEl.innerHTML = `<option value="">All Categories</option>`;
    const modalCatSelect = document.getElementById("edit-category-select");
    modalCatSelect.innerHTML = "";

    categories.forEach(cat => {
        const div = document.createElement("div");
        div.className = "option-item";
        div.innerHTML = `<span>${cat}</span> ${cat !== 'General' ? `<i class="fas fa-trash-alt delete-cat-btn" data-cat="${cat}"></i>` : ''}`;

        div.onclick = (e) => {
            if (e.target.classList.contains('delete-cat-btn')) return;
            selectedCategory = cat;
            trigger.querySelector("span").textContent = cat;
            document.getElementById("selected-category-display").textContent = cat;
            optionsContainer.classList.remove("active");
        };

        const delBtn = div.querySelector(".delete-cat-btn");
        if (delBtn) {
            delBtn.onclick = async (e) => {
                e.stopPropagation();
                const targetCat = e.target.getAttribute("data-cat");
                const confirmed = await customConfirm(`Delete category "${targetCat}" and all related tasks?`);
                if (confirmed) {
                    categories = categories.filter(c => c !== targetCat);
                    tasks = tasks.filter(t => t.category !== targetCat);
                    if (selectedCategory === targetCat) {
                        selectedCategory = "General";
                        trigger.querySelector("span").textContent = "General";
                        document.getElementById("selected-category-display").textContent = "General";
                    }
                    localStorage.setItem("categories", JSON.stringify(categories));
                    saveAndRenderAll();
                    renderCategories();
                    showToast("Category and related tasks removed.");
                }
            };
        }
     optionsContainer.appendChild(div);
          categoryFilterEl.add(new Option(cat, cat));
        modalCatSelect.add(new Option(cat, cat));
    });
}

trigger.onclick = () => optionsContainer.classList.toggle("active");

addCategoryBtn.onclick = () => {
    const val = newCategoryInput.value.trim();
    if (val && !categories.includes(val)) {
        categories.push(val);
        localStorage.setItem("categories", JSON.stringify(categories));
        newCategoryInput.value = "";
        renderCategories();
        showToast("Category added.");
    } else if(categories.includes(val)) {
        showToast("Category already exists!");
    }
};

function validateDates(s, e) {
    if (s && e && new Date(s) > new Date(e)) {
        showToast("Error: End date cannot be before start date!");
        return false;
    }
    return true;
}

function showToast(message) {
    const container = document.getElementById("toast-container");

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 4000);
}

async function customConfirm(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById("confirm-modal");

        const messageEl = document.getElementById("confirm-message");
        const yesBtn = document.getElementById("confirm-yes");
        const cancelBtn = document.getElementById("confirm-cancel");

        messageEl.textContent = message;
        modal.classList.add("active");

        const handleAction = (choice) => {
            modal.classList.remove("active");
            resolve(choice);
        };

        yesBtn.onclick = () => handleAction(true);
        cancelBtn.onclick = () => handleAction(false);
        modal.onclick = (e) => { if (e.target === modal) handleAction(false); };
    });
}

function saveAndRenderAll() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderAll();
}

function renderAll() {
    renderTaskList(false, activeListEl);
    renderTaskList(true, completedListEl);

    document.getElementById("active-count").textContent = `(${tasks.filter(t => !t.checked).length})`;
    document.getElementById("completed-count").textContent = `(${tasks.filter(t => t.checked).length})`;
}

function renderTaskList(isCompleted, container) {
    container.innerHTML = "";
 let filtered = tasks.filter(t => t.checked === isCompleted);

    if (!isCompleted) {
        filtered.sort((a, b) => {
            const today = new Date().toISOString().split("T")[0];
            const aDue = a.endDate || "9999-99-99";
            const bDue = b.endDate || "9999-99-99";

         if (aDue < today && bDue >= today) return -1;
         if (bDue < today && aDue >= today) return 1;
         if (aDue === today && bDue !== today) return -1;
         if (bDue === today && aDue !== today) return 1;
            return aDue.localeCompare(bDue);
        });
    }

     const search = searchEl.value.toLowerCase();
    const catF = categoryFilterEl.value;
      const statusF = filterStatusEl.value;
    const fromDate = dateFromEl.value;
    const toDate = dateToEl.value;

    filtered = filtered.filter(t => {
         if (statusF !== "all" && (statusF === "completed" ? !t.checked : t.checked)) return false;
    if (!t.name.toLowerCase().includes(search)) return false;
        if (catF && t.category !== catF) return false;
        if (fromDate || toDate) {
            if (!t.endDate) return false;
            if (fromDate && t.endDate < fromDate) return false;
            if (toDate && t.endDate > toDate) return false;
        }
        return true;
    });

    filtered.forEach(task => {
        const li = document.createElement("li");
        const today = new Date().toISOString().split("T")[0];
     if (!task.checked && task.endDate && task.endDate < today) li.classList.add("overdue");
        if (task.checked) li.classList.add("checked");
        if (!task.checked && task.endDate) {
            if (task.endDate < today) {
                li.classList.add("overdue");
            } else if (task.endDate === today) {
                li.classList.add("upcoming");
            } else {
                li.classList.add("future");
            }
        }

        li.innerHTML = `
            <div class="task-info">
                <div class="task-title"><strong>${task.name}</strong></div>
                <div class="task-meta"><i class="fa fa-tag"></i> ${task.category} | <i class="fa fa-calendar"></i> ${task.endDate || 'No Date'}</div>
            </div>
            <div class="actions">
                <i class="fas ${task.checked ? 'fa-check-circle' : 'fa-circle'} btn-check"></i>
                <i class="fas fa-pen-to-square btn-edit"></i>
                <i class="fas fa-trash-can btn-delete"></i>
            </div>
        `;

        li.querySelector(".btn-check").onclick = () => { 
            task.checked = !task.checked; 
            saveAndRenderAll(); 
            showToast(task.checked ? "Task completed! 🎉" : "Task moved to active.");};
        li.querySelector(".btn-delete").onclick = () => deleteTask(task.id);
        li.querySelector(".btn-edit").onclick = () => openEditModal(task);
        container.appendChild(li);
    });
}

async function deleteTask(id) {
    const confirmed = await customConfirm("Do you really want to delete this task?");
    if (confirmed) {
        tasks = tasks.filter(t => t.id !== id);
        saveAndRenderAll();
        showToast("Task deleted successfully.");
    }}

function openEditModal(task) {
    editingTaskId = task.id;
    document.getElementById("edit-name").value = task.name;
    document.getElementById("edit-category-select").value = task.category;
    document.getElementById("edit-start-date").value = task.startDate || "";
    document.getElementById("edit-end-date").value = task.endDate || "";
    editModal.classList.add("active");
}

formEl.onsubmit = (e) => {
    e.preventDefault();
    if (!validateDates(startDateEl.value, endDateEl.value)) return;
    tasks.unshift({ 
        id: Date.now(), 
        name: inputEl.value, 
        category: selectedCategory, 
        startDate: startDateEl.value, 
        endDate: endDateEl.value, 
        checked: false  });
    formEl.reset(); 
    trigger.querySelector("span").textContent = "General"; 
    document.getElementById("selected-category-display").textContent = "General";
    selectedCategory = "General";
    saveAndRenderAll();
    showToast("Task created! ✨");
};

editForm.onsubmit = (e) => {
    e.preventDefault();
const task = tasks.find(t => t.id === editingTaskId);
    const s = document.getElementById("edit-start-date").value;
    const end = document.getElementById("edit-end-date").value;
    if (!validateDates(s, end)) return;
    
    Object.assign(task, { 
        name: document.getElementById("edit-name").value, 
        category: document.getElementById("edit-category-select").value, 
        startDate: s, 
        endDate: end 
    });
    editModal.classList.remove("active");
    saveAndRenderAll();
    showToast("Task updated! ✅");
};

document.getElementById("clear-filters").onclick = () => {
    searchEl.value = "";

    categoryFilterEl.value = "";
    filterStatusEl.value = "all";
    dateFromEl.value = "";
    dateToEl.value = "";
    renderAll();
    showToast("Filters cleared.");
};

[searchEl, filterStatusEl, categoryFilterEl, dateFromEl, dateToEl].forEach(el => {
    if(el) el.oninput = renderAll;
});

document.querySelectorAll('[data-modal="edit"], .close-btn[data-modal="edit"]').forEach(btn => {
    btn.onclick = () => editModal.classList.remove("active");
});

window.onclick = (e) => { 
    if (!e.target.closest('#category-custom-select')) {
        optionsContainer.classList.remove("active"); 
    }
};