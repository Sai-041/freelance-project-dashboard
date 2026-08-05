    const showProjectFormButton = document.querySelector("#show-project-form");
    const projectForm = document.querySelector("#project-form");
    const projectNameInput = document.querySelector("#project-name");
    const clientNameInput = document.querySelector("#client-name");
    const projectStatusInput = document.querySelector("#project-status");
    const startDateInput = document.querySelector("#start-date");
    const endDateInput = document.querySelector("#end-date");
    const projectBudgetInput = document.querySelector("#project-budget");
    const projectProgressInput = document.querySelector("#project-progress");
    const progressValue = document.querySelector("#progress-value");
    const cancelProjectButton = document.querySelector("#cancel-project");
    const formTitle = document.querySelector("#form-title");
    const submitProjectButton = document.querySelector("#submit-project");
    const formError = document.querySelector("#form-error");
    const projectsContainer = document.querySelector("#projects");
    const projectCount = document.querySelector("#project-count");
    const projectSearchInput = document.querySelector("#project-search");
    const projectSortInput = document.querySelector("#project-sort");
    const emptyState = document.querySelector("#empty-state");
    const emptyStateTitle = document.querySelector("#empty-state-title");
    const emptyStateMessage = document.querySelector("#empty-state-message");
    const createFirstProjectButton = document.querySelector("#create-first-project");
    const filterButtons = document.querySelectorAll(".filter-button");
    const totalProjectsValue = document.querySelector("#summary-total-projects");
    const inProgressValue = document.querySelector("#summary-in-progress");
    const completedValue = document.querySelector("#summary-completed");
    const totalBudgetValue = document.querySelector("#summary-total-budget");
    const exportDataButton = document.querySelector("#export-data");
    const importDataButton = document.querySelector("#import-data");
    const importFileInput = document.querySelector("#import-file");
    const resetDataButton = document.querySelector("#reset-data");
    const backupMessage = document.querySelector("#backup-message");
    const toast = document.querySelector("#toast");
    const confirmModal = document.querySelector("#confirm-modal");
    const confirmTitle = document.querySelector("#confirm-title");
    const confirmMessage = document.querySelector("#confirm-message");
    const confirmCancelButton = document.querySelector("#confirm-cancel");
    const confirmAcceptButton = document.querySelector("#confirm-accept");
    const storageKey = "freelanceProjects";
    const storageVersionKey = "freelanceProjectsVersion";
    const currentStorageVersion = "2";
    let editingProjectId = null;
    let activeFilter = "All";
    let searchQuery = "";
    let activeSort = "default";
    let resetConfirmationTimer = null;
    let toastTimer = null;
    let confirmResolver = null;
    let previouslyFocusedElement = null;
    const defaultProjects = [
      {
        id: "default-3d-commercial",
        name: "3D Commercial",
        client: "AP Boots",
        status: "In Progress",
        startDate: "",
        endDate: "",
        budget: "",
        progress: 0
      },
      {
        id: "default-product-animation",
        name: "Product Animation",
        client: "Brand X",
        status: "In Progress",
        startDate: "",
        endDate: "",
        budget: "",
        progress: 0
      }
    ];

    function createProjectId() {
      return `project-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function loadProjects() {
      try {
        const storedProjects = localStorage.getItem(storageKey);
        const parsedProjects = storedProjects ? JSON.parse(storedProjects) : [];

        if (!Array.isArray(parsedProjects)) {
          return [...defaultProjects];
        }

        const normalizedProjects = parsedProjects.map(function (project) {
          return {
            id: project.id || createProjectId(),
            name: project.name,
            client: project.client,
            status: project.status || "In Progress",
            startDate: project.startDate || "",
            endDate: project.endDate || "",
            budget: project.budget ?? "",
            progress: Math.min(100, Math.max(0, Number(project.progress) || 0))
          };
        });

        if (localStorage.getItem(storageVersionKey) !== currentStorageVersion) {
          const migratedProjects = [...defaultProjects, ...normalizedProjects];
          saveProjects(migratedProjects);
          localStorage.setItem(storageVersionKey, currentStorageVersion);
          return migratedProjects;
        }

        return normalizedProjects;
      } catch (error) {
        console.error("Saved projects could not be loaded.", error);
        return [...defaultProjects];
      }
    }

    function saveProjects(projects) {
      localStorage.setItem(storageKey, JSON.stringify(projects));
    }

    function showToast(message, type = "success") {
      clearTimeout(toastTimer);
      toast.textContent = message;
      toast.classList.toggle("toast-error", type === "error");
      toast.hidden = false;

      toastTimer = setTimeout(function () {
        toast.hidden = true;
      }, 3500);
    }

    function closeConfirmModal(result) {
      confirmModal.hidden = true;

      if (confirmResolver) {
        confirmResolver(result);
        confirmResolver = null;
      }

      previouslyFocusedElement?.focus();
    }

    function showConfirmModal({ title, message, confirmLabel = "Confirm", destructive = false }) {
      previouslyFocusedElement = document.activeElement;
      confirmTitle.textContent = title;
      confirmMessage.textContent = message;
      confirmAcceptButton.textContent = confirmLabel;
      confirmAcceptButton.classList.toggle("destructive", destructive);
      confirmModal.hidden = false;
      confirmCancelButton.focus();

      return new Promise(function (resolve) {
        confirmResolver = resolve;
      });
    }

    confirmCancelButton.addEventListener("click", function () {
      closeConfirmModal(false);
    });

    confirmAcceptButton.addEventListener("click", function () {
      closeConfirmModal(true);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !confirmModal.hidden) {
        closeConfirmModal(false);
      }
    });

    function normalizeImportedProject(project) {
      const validStatuses = ["Planning", "In Progress", "Review", "Completed"];
      const validDatePattern = /^\d{4}-\d{2}-\d{2}$/;

      if (!project || typeof project !== "object" || Array.isArray(project)) {
        throw new Error("A project has an invalid format.");
      }

      const startDate = project.startDate || "";
      const endDate = project.endDate || "";
      const budget = project.budget === "" || project.budget == null ? "" : Number(project.budget);
      const progress = project.progress === undefined ? 0 : Number(project.progress);

      if ((startDate && !validDatePattern.test(startDate)) || (endDate && !validDatePattern.test(endDate))) {
        throw new Error("A project contains an invalid date.");
      }

      if (startDate && endDate && endDate < startDate) {
        throw new Error("A project has an end date before its start date.");
      }

      if (budget !== "" && (!Number.isFinite(budget) || budget < 0)) {
        throw new Error("A project contains an invalid budget.");
      }

      if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
        throw new Error("A project contains an invalid progress value.");
      }

      return {
        id: typeof project.id === "string" && project.id ? project.id : createProjectId(),
        name: typeof project.name === "string" && project.name.trim() ? project.name.trim() : "Not set",
        client: typeof project.client === "string" && project.client.trim() ? project.client.trim() : "Not set",
        status: validStatuses.includes(project.status) ? project.status : "In Progress",
        startDate,
        endDate,
        budget,
        progress
      };
    }

    function formatDate(dateValue) {
      if (!dateValue) {
        return "Not set";
      }

      return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }).format(new Date(`${dateValue}T00:00:00`));
    }

    function getDeadlineIndicator(endDate) {
      if (!endDate) {
        return {
          label: "Not set",
          className: "deadline-not-set",
          detail: "End date not set"
        };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const deadline = new Date(`${endDate}T00:00:00`);
      const millisecondsPerDay = 1000 * 60 * 60 * 24;
      const daysRemaining = Math.ceil((deadline - today) / millisecondsPerDay);

      if (daysRemaining < 0) {
        const overdueDays = Math.abs(daysRemaining);
        return {
          label: "Overdue",
          className: "deadline-overdue",
          detail: `${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue`
        };
      }

      if (daysRemaining <= 7) {
        return {
          label: "Due Soon",
          className: "deadline-due-soon",
          detail: daysRemaining === 0 ? "Due today" : `Due in ${daysRemaining} days`
        };
      }

      return {
        label: "On Track",
        className: "deadline-on-track",
        detail: `${daysRemaining} days remaining`
      };
    }

    function formatBudget(budgetValue) {
      if (budgetValue === "" || budgetValue === null || budgetValue === undefined) {
        return "Not set";
      }

      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
      }).format(budgetValue);
    }

    function formatBudgetInput(budgetValue) {
      if (budgetValue === "" || budgetValue === null || budgetValue === undefined) {
        return "";
      }

      const digits = String(budgetValue).replace(/\D/g, "");
      return digits ? Number(digits).toLocaleString("en-US") : "";
    }

    function createMetaRow(labelText, valueText) {
      const row = document.createElement("p");
      row.className = "meta-row";

      const label = document.createElement("span");
      label.className = "meta-label";
      label.textContent = labelText;

      const value = document.createElement("span");
      value.className = "meta-value";
      value.textContent = valueText;

      row.append(label, value);
      return row;
    }

    function createProjectCard(project) {
      const card = document.createElement("article");
      const statusSlug = project.status.toLowerCase().replaceAll(" ", "-");
      card.className = `card card-${statusSlug}`;

      const title = document.createElement("h3");
      title.textContent = project.name;

      const client = document.createElement("p");
      client.textContent = `Client: ${project.client}`;

      const status = document.createElement("p");
      status.className = `status status-${statusSlug}`;
      status.textContent = project.status;

      const deadlineData = getDeadlineIndicator(project.endDate);
      const deadlineIndicator = document.createElement("span");
      deadlineIndicator.className = `deadline-indicator ${deadlineData.className}`;
      deadlineIndicator.textContent = deadlineData.label;
      deadlineIndicator.title = deadlineData.detail;
      deadlineIndicator.setAttribute("aria-label", `Deadline: ${deadlineData.label}. ${deadlineData.detail}`);

      const statusRow = document.createElement("div");
      statusRow.className = "card-status-row";
      statusRow.append(status, deadlineIndicator);

      const projectMeta = document.createElement("div");
      projectMeta.className = "project-meta";
      projectMeta.append(
        createMetaRow("Start", formatDate(project.startDate)),
        createMetaRow("End", formatDate(project.endDate)),
        createMetaRow("Budget", formatBudget(project.budget))
      );

      const progress = Math.min(100, Math.max(0, Number(project.progress) || 0));
      const projectProgress = document.createElement("div");
      projectProgress.className = "project-progress";

      const progressHeading = document.createElement("div");
      progressHeading.className = "progress-heading";
      progressHeading.innerHTML = `<span>Progress</span><span>${progress}%</span>`;

      const progressTrack = document.createElement("div");
      progressTrack.className = "progress-track";
      progressTrack.setAttribute("role", "progressbar");
      progressTrack.setAttribute("aria-label", `${project.name} progress`);
      progressTrack.setAttribute("aria-valuemin", "0");
      progressTrack.setAttribute("aria-valuemax", "100");
      progressTrack.setAttribute("aria-valuenow", String(progress));

      const progressFill = document.createElement("div");
      progressFill.className = "progress-fill";
      progressFill.style.width = `${progress}%`;
      progressTrack.append(progressFill);
      projectProgress.append(progressHeading, progressTrack);

      const openButton = document.createElement("button");
      openButton.type = "button";
      openButton.textContent = "Open Project";
      openButton.addEventListener("click", openProject);

      const editButton = document.createElement("button");
      editButton.className = "edit-button";
      editButton.type = "button";
      editButton.textContent = "Edit";
      editButton.setAttribute("aria-label", `Edit ${project.name}`);
      editButton.addEventListener("click", function () {
        startEditingProject(project);
      });

      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-button";
      deleteButton.type = "button";
      deleteButton.textContent = "Delete";
      deleteButton.setAttribute("aria-label", `Delete ${project.name}`);
      deleteButton.addEventListener("click", async function () {
        const shouldDelete = await showConfirmModal({
          title: "Delete project?",
          message: `Delete “${project.name}”? This action cannot be undone.`,
          confirmLabel: "Delete Project",
          destructive: true
        });

        if (shouldDelete) {
          deleteProject(project.id);
          showToast(`${project.name} deleted.`);
        }
      });

      const actions = document.createElement("div");
      actions.className = "card-actions";
      actions.append(openButton, editButton, deleteButton);

      card.append(title, client, statusRow, projectMeta, projectProgress, actions);
      projectsContainer.append(card);
    }

    function renderProjects() {
      projectsContainer.replaceChildren();
      updateDashboardSummary();

      const normalizedSearch = searchQuery.toLowerCase();
      const filteredProjects = savedProjects.filter(function (project) {
        const matchesStatus = activeFilter === "All" || project.status === activeFilter;
        const matchesSearch = project.name.toLowerCase().includes(normalizedSearch)
          || project.client.toLowerCase().includes(normalizedSearch);

        return matchesStatus && matchesSearch;
      });

      const sortedProjects = sortProjects(filteredProjects);
      sortedProjects.forEach(createProjectCard);
      projectCount.textContent = `${filteredProjects.length} of ${savedProjects.length} projects`;
      emptyState.hidden = filteredProjects.length > 0;

      if (savedProjects.length === 0) {
        emptyStateTitle.textContent = "No projects yet";
        emptyStateMessage.textContent = "Create your first project to start building your dashboard.";
        createFirstProjectButton.hidden = false;
      } else if (filteredProjects.length === 0) {
        emptyStateTitle.textContent = "No matching projects";
        emptyStateMessage.textContent = "Try changing your search text or status filter.";
        createFirstProjectButton.hidden = true;
      }
    }

    function sortProjects(projects) {
      const sortedProjects = [...projects];

      function compareOptionalValues(aValue, bValue, comparison) {
        const aIsEmpty = aValue === "" || aValue === null || aValue === undefined;
        const bIsEmpty = bValue === "" || bValue === null || bValue === undefined;

        if (aIsEmpty && bIsEmpty) return 0;
        if (aIsEmpty) return 1;
        if (bIsEmpty) return -1;
        return comparison(aValue, bValue);
      }

      switch (activeSort) {
        case "name-asc":
          sortedProjects.sort(function (a, b) {
            return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
          });
          break;
        case "name-desc":
          sortedProjects.sort(function (a, b) {
            return b.name.localeCompare(a.name, "en", { sensitivity: "base" });
          });
          break;
        case "deadline-asc":
          sortedProjects.sort(function (a, b) {
            return compareOptionalValues(a.endDate, b.endDate, function (aDate, bDate) {
              return aDate.localeCompare(bDate);
            });
          });
          break;
        case "deadline-desc":
          sortedProjects.sort(function (a, b) {
            return compareOptionalValues(a.endDate, b.endDate, function (aDate, bDate) {
              return bDate.localeCompare(aDate);
            });
          });
          break;
        case "budget-desc":
          sortedProjects.sort(function (a, b) {
            return compareOptionalValues(a.budget, b.budget, function (aBudget, bBudget) {
              return Number(bBudget) - Number(aBudget);
            });
          });
          break;
        case "budget-asc":
          sortedProjects.sort(function (a, b) {
            return compareOptionalValues(a.budget, b.budget, function (aBudget, bBudget) {
              return Number(aBudget) - Number(bBudget);
            });
          });
          break;
      }

      return sortedProjects;
    }

    function updateDashboardSummary() {
      const inProgressProjects = savedProjects.filter(function (project) {
        return project.status === "In Progress";
      });

      const completedProjects = savedProjects.filter(function (project) {
        return project.status === "Completed";
      });

      const totalBudget = savedProjects.reduce(function (total, project) {
        return total + (Number(project.budget) || 0);
      }, 0);

      totalProjectsValue.textContent = savedProjects.length;
      inProgressValue.textContent = inProgressProjects.length;
      completedValue.textContent = completedProjects.length;
      totalBudgetValue.textContent = formatBudget(totalBudget);
    }

    function deleteProject(projectId) {
      const projectIndex = savedProjects.findIndex(function (project) {
        return project.id === projectId;
      });

      if (projectIndex === -1) {
        return;
      }

      savedProjects.splice(projectIndex, 1);
      saveProjects(savedProjects);
      renderProjects();
    }

    const savedProjects = loadProjects();
    renderProjects();

    filterButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        activeFilter = button.dataset.status;

        filterButtons.forEach(function (filterButton) {
          const isActive = filterButton === button;
          filterButton.classList.toggle("active", isActive);
          filterButton.setAttribute("aria-pressed", String(isActive));
        });

        renderProjects();
      });
    });

    projectSearchInput.addEventListener("input", function () {
      searchQuery = projectSearchInput.value.trim();
      renderProjects();
    });

    projectSortInput.addEventListener("change", function () {
      activeSort = projectSortInput.value;
      renderProjects();
    });

    exportDataButton.addEventListener("click", async function () {
      const backup = {
        app: "SAI Studio Project Dashboard",
        exportedAt: new Date().toISOString(),
        projects: savedProjects
      };
      const backupText = JSON.stringify(backup, null, 2);
      const date = new Date().toISOString().slice(0, 10);
      const suggestedName = `sai-studio-backup-${date}.json`;

      if ("showSaveFilePicker" in window) {
        try {
          const fileHandle = await window.showSaveFilePicker({
            suggestedName,
            types: [
              {
                description: "JSON backup file",
                accept: { "application/json": [".json"] }
              }
            ]
          });
          const writableFile = await fileHandle.createWritable();
          await writableFile.write(backupText);
          await writableFile.close();
          backupMessage.textContent = `${savedProjects.length} projects exported successfully.`;
          showToast("Backup saved successfully.");
        } catch (error) {
          if (error.name === "AbortError") {
            backupMessage.textContent = "Export cancelled. No file was saved.";
          } else {
            backupMessage.textContent = "The backup file could not be saved.";
            showToast("The backup file could not be saved.", "error");
          }
        }
        return;
      }

      const file = new Blob([backupText], { type: "application/json" });
      const downloadUrl = URL.createObjectURL(file);
      const downloadLink = document.createElement("a");

      downloadLink.href = downloadUrl;
      downloadLink.download = suggestedName;
      document.body.append(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      setTimeout(function () {
        URL.revokeObjectURL(downloadUrl);
      }, 1000);
      backupMessage.textContent = `${savedProjects.length} projects exported successfully.`;
      showToast("Backup downloaded successfully.");
    });

    importDataButton.addEventListener("click", function () {
      importFileInput.click();
    });

    importFileInput.addEventListener("change", async function () {
      const selectedFile = importFileInput.files[0];

      if (!selectedFile) {
        return;
      }

      try {
        const importedData = JSON.parse(await selectedFile.text());
        const importedProjects = Array.isArray(importedData) ? importedData : importedData.projects;

        if (!Array.isArray(importedProjects)) {
          throw new Error("This is not a valid SAI Studio backup file.");
        }

        if (importedProjects.length > 10000) {
          throw new Error("This backup contains too many projects to import safely.");
        }

        const normalizedProjects = importedProjects.map(normalizeImportedProject);
        const usedProjectIds = new Set();

        normalizedProjects.forEach(function (project) {
          if (usedProjectIds.has(project.id)) {
            project.id = createProjectId();
          }
          usedProjectIds.add(project.id);
        });

        const exportedDate = importedData.exportedAt
          ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(importedData.exportedAt))
          : "Not available";
        const shouldReplace = await showConfirmModal({
          title: "Review Import",
          message: `File: ${selectedFile.name}\nProjects in backup: ${normalizedProjects.length}\nCurrent projects to replace: ${savedProjects.length}\nBackup date: ${exportedDate}\n\nContinue with this import?`,
          confirmLabel: "Import Projects",
          destructive: true
        });

        if (!shouldReplace) {
          backupMessage.textContent = "Import cancelled. Your current projects were not changed.";
          return;
        }

        savedProjects.splice(0, savedProjects.length, ...normalizedProjects);
        saveProjects(savedProjects);
        localStorage.setItem(storageVersionKey, currentStorageVersion);
        renderProjects();
        backupMessage.textContent = `${savedProjects.length} projects imported successfully.`;
        showToast(`${savedProjects.length} projects imported successfully.`);
      } catch (error) {
        backupMessage.textContent = error.message || "The backup file could not be imported.";
        showToast(error.message || "The backup file could not be imported.", "error");
      } finally {
        importFileInput.value = "";
      }
    });

    resetDataButton.addEventListener("click", async function () {
      const isConfirming = resetDataButton.classList.contains("confirming");

      if (!isConfirming) {
        resetDataButton.classList.add("confirming");
        resetDataButton.textContent = "Click Again to Reset";
        backupMessage.textContent = "Click Reset Data once more within 5 seconds to continue.";

        resetConfirmationTimer = setTimeout(function () {
          resetDataButton.classList.remove("confirming");
          resetDataButton.textContent = "Reset Data";
          backupMessage.textContent = "Reset cancelled. Your projects were not changed.";
        }, 5000);
        return;
      }

      clearTimeout(resetConfirmationTimer);
      resetDataButton.classList.remove("confirming");
      resetDataButton.textContent = "Reset Data";

      const shouldReset = await showConfirmModal({
        title: "Reset all project data?",
        message: "Delete all projects stored in this browser? This cannot be undone unless you have exported a backup.",
        confirmLabel: "Delete All Projects",
        destructive: true
      });

      if (!shouldReset) {
        backupMessage.textContent = "Reset cancelled. Your projects were not changed.";
        return;
      }

      savedProjects.splice(0, savedProjects.length);
      saveProjects(savedProjects);
      localStorage.setItem(storageVersionKey, currentStorageVersion);
      renderProjects();
      backupMessage.textContent = "All project data has been reset.";
      showToast("All project data has been reset.");
    });

    function setFormVisibility(isVisible) {
      projectForm.hidden = !isVisible;
      showProjectFormButton.setAttribute("aria-expanded", String(isVisible));

      if (isVisible) {
        projectNameInput.focus();
      } else {
        projectForm.reset();
        progressValue.textContent = "0%";
        endDateInput.min = "";
        formError.textContent = "Please check the values you entered.";
        formError.hidden = true;
        editingProjectId = null;
        formTitle.textContent = "New Project";
        submitProjectButton.textContent = "Add Project";
      }
    }

    function startNewProject() {
      editingProjectId = null;
      projectForm.reset();
      progressValue.textContent = "0%";
      endDateInput.min = "";
      formError.textContent = "Please check the values you entered.";
      formError.hidden = true;
      formTitle.textContent = "New Project";
      submitProjectButton.textContent = "Add Project";
      setFormVisibility(true);
    }

    function startEditingProject(project) {
      editingProjectId = project.id;
      projectNameInput.value = project.name;
      clientNameInput.value = project.client;
      projectStatusInput.value = project.status;
      startDateInput.value = project.startDate;
      endDateInput.value = project.endDate;
      endDateInput.min = project.startDate;
      projectBudgetInput.value = formatBudgetInput(project.budget);
      projectProgressInput.value = project.progress ?? 0;
      progressValue.textContent = `${projectProgressInput.value}%`;
      formError.hidden = true;
      formTitle.textContent = "Edit Project";
      submitProjectButton.textContent = "Save Changes";
      setFormVisibility(true);
      projectForm.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    showProjectFormButton.addEventListener("click", function () {
      if (!projectForm.hidden && editingProjectId === null) {
        setFormVisibility(false);
        return;
      }

      startNewProject();
    });

    createFirstProjectButton.addEventListener("click", function () {
      startNewProject();
      projectForm.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    cancelProjectButton.addEventListener("click", function () {
      setFormVisibility(false);
      showProjectFormButton.focus();
    });

    startDateInput.addEventListener("change", function () {
      endDateInput.min = startDateInput.value;
    });

    projectBudgetInput.addEventListener("input", function () {
      projectBudgetInput.value = formatBudgetInput(projectBudgetInput.value);
    });

    projectProgressInput.addEventListener("input", function () {
      progressValue.textContent = `${projectProgressInput.value}%`;
    });

    projectForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const projectName = projectNameInput.value.trim() || "Not set";
      const clientName = clientNameInput.value.trim() || "Not set";
      const projectStatus = projectStatusInput.value;
      const startDate = startDateInput.value;
      const endDate = endDateInput.value;
      const budgetValue = projectBudgetInput.value.replaceAll(",", "");
      const projectBudget = budgetValue === "" ? "" : Number(budgetValue);
      const projectProgress = Number(projectProgressInput.value);

      if (startDate && endDate && endDate < startDate) {
        formError.textContent = "End date cannot be before the start date.";
        formError.hidden = false;
        return;
      }

      if (budgetValue !== "" && (!Number.isFinite(projectBudget) || projectBudget < 0)) {
        formError.textContent = "Budget must be zero or greater.";
        formError.hidden = false;
        return;
      }

      if (!Number.isFinite(projectProgress) || projectProgress < 0 || projectProgress > 100) {
        formError.textContent = "Progress must be between 0 and 100.";
        formError.hidden = false;
        return;
      }

      formError.hidden = true;

      if (editingProjectId !== null) {
        const projectIndex = savedProjects.findIndex(function (project) {
          return project.id === editingProjectId;
        });

        if (projectIndex !== -1) {
          savedProjects[projectIndex] = {
            ...savedProjects[projectIndex],
            name: projectName,
            client: clientName,
            status: projectStatus,
            startDate,
            endDate,
            budget: projectBudget,
            progress: projectProgress
          };

          saveProjects(savedProjects);
          renderProjects();
        }

        setFormVisibility(false);
        showProjectFormButton.focus();
        return;
      }

      const newProject = {
        id: createProjectId(),
        name: projectName,
        client: clientName,
        status: projectStatus,
        startDate,
        endDate,
        budget: projectBudget,
        progress: projectProgress
      };

      savedProjects.push(newProject);
      saveProjects(savedProjects);
      renderProjects();

      setFormVisibility(false);
      showProjectFormButton.focus();
    });

    function openProject() {
      showToast("Project opened!");
    }
