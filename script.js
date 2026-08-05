    const showProjectFormButton = document.querySelector("#show-project-form");
    const projectForm = document.querySelector("#project-form");
    const projectNameInput = document.querySelector("#project-name");
    const clientNameInput = document.querySelector("#client-name");
    const projectStatusInput = document.querySelector("#project-status");
    const startDateInput = document.querySelector("#start-date");
    const endDateInput = document.querySelector("#end-date");
    const projectBudgetInput = document.querySelector("#project-budget");
    const cancelProjectButton = document.querySelector("#cancel-project");
    const formTitle = document.querySelector("#form-title");
    const submitProjectButton = document.querySelector("#submit-project");
    const formError = document.querySelector("#form-error");
    const projectsContainer = document.querySelector("#projects");
    const projectCount = document.querySelector("#project-count");
    const projectSearchInput = document.querySelector("#project-search");
    const projectSortInput = document.querySelector("#project-sort");
    const emptyState = document.querySelector("#empty-state");
    const filterButtons = document.querySelectorAll(".filter-button");
    const totalProjectsValue = document.querySelector("#summary-total-projects");
    const inProgressValue = document.querySelector("#summary-in-progress");
    const completedValue = document.querySelector("#summary-completed");
    const totalBudgetValue = document.querySelector("#summary-total-budget");
    const exportDataButton = document.querySelector("#export-data");
    const importDataButton = document.querySelector("#import-data");
    const importFileInput = document.querySelector("#import-file");
    const backupMessage = document.querySelector("#backup-message");
    const storageKey = "freelanceProjects";
    const storageVersionKey = "freelanceProjectsVersion";
    const currentStorageVersion = "2";
    let editingProjectId = null;
    let activeFilter = "All";
    let searchQuery = "";
    let activeSort = "default";
    const defaultProjects = [
      {
        id: "default-3d-commercial",
        name: "3D Commercial",
        client: "AP Boots",
        status: "In Progress",
        startDate: "",
        endDate: "",
        budget: ""
      },
      {
        id: "default-product-animation",
        name: "Product Animation",
        client: "Brand X",
        status: "In Progress",
        startDate: "",
        endDate: "",
        budget: ""
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
            budget: project.budget ?? ""
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

    function normalizeImportedProject(project) {
      const validStatuses = ["Planning", "In Progress", "Review", "Completed"];

      if (!project || typeof project !== "object" || Array.isArray(project)) {
        throw new Error("A project has an invalid format.");
      }

      return {
        id: typeof project.id === "string" && project.id ? project.id : createProjectId(),
        name: typeof project.name === "string" && project.name.trim() ? project.name.trim() : "Not set",
        client: typeof project.client === "string" && project.client.trim() ? project.client.trim() : "Not set",
        status: validStatuses.includes(project.status) ? project.status : "In Progress",
        startDate: typeof project.startDate === "string" ? project.startDate : "",
        endDate: typeof project.endDate === "string" ? project.endDate : "",
        budget: project.budget === "" || project.budget == null ? "" : Math.max(0, Number(project.budget) || 0)
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
      deleteButton.addEventListener("click", function () {
        if (deleteButton.classList.contains("confirming")) {
          deleteProject(project.id);
          return;
        }

        deleteButton.classList.add("confirming");
        deleteButton.textContent = "Confirm Delete";
        deleteButton.setAttribute("aria-label", `Confirm delete ${project.name}`);

        setTimeout(function () {
          if (deleteButton.isConnected) {
            deleteButton.classList.remove("confirming");
            deleteButton.textContent = "Delete";
            deleteButton.setAttribute("aria-label", `Delete ${project.name}`);
          }
        }, 8000);
      });

      const actions = document.createElement("div");
      actions.className = "card-actions";
      actions.append(openButton, editButton, deleteButton);

      card.append(title, client, statusRow, projectMeta, actions);
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

    exportDataButton.addEventListener("click", function () {
      const backup = {
        app: "SAI Studio Project Dashboard",
        exportedAt: new Date().toISOString(),
        projects: savedProjects
      };
      const file = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const downloadUrl = URL.createObjectURL(file);
      const downloadLink = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);

      downloadLink.href = downloadUrl;
      downloadLink.download = `sai-studio-backup-${date}.json`;
      document.body.append(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      setTimeout(function () {
        URL.revokeObjectURL(downloadUrl);
      }, 1000);
      backupMessage.textContent = `${savedProjects.length} projects exported successfully.`;
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

        const normalizedProjects = importedProjects.map(normalizeImportedProject);
        const shouldReplace = confirm(
          `Import ${normalizedProjects.length} projects? This will replace the projects currently stored in this browser.`
        );

        if (!shouldReplace) {
          backupMessage.textContent = "Import cancelled. Your current projects were not changed.";
          return;
        }

        savedProjects.splice(0, savedProjects.length, ...normalizedProjects);
        saveProjects(savedProjects);
        localStorage.setItem(storageVersionKey, currentStorageVersion);
        renderProjects();
        backupMessage.textContent = `${savedProjects.length} projects imported successfully.`;
      } catch (error) {
        backupMessage.textContent = error.message || "The backup file could not be imported.";
      } finally {
        importFileInput.value = "";
      }
    });

    function setFormVisibility(isVisible) {
      projectForm.hidden = !isVisible;
      showProjectFormButton.setAttribute("aria-expanded", String(isVisible));

      if (isVisible) {
        projectNameInput.focus();
      } else {
        projectForm.reset();
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
      projectBudgetInput.value = project.budget;
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

    cancelProjectButton.addEventListener("click", function () {
      setFormVisibility(false);
      showProjectFormButton.focus();
    });

    startDateInput.addEventListener("change", function () {
      endDateInput.min = startDateInput.value;
    });

    projectForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const projectName = projectNameInput.value.trim() || "Not set";
      const clientName = clientNameInput.value.trim() || "Not set";
      const projectStatus = projectStatusInput.value;
      const startDate = startDateInput.value;
      const endDate = endDateInput.value;
      const budgetValue = projectBudgetInput.value;
      const projectBudget = budgetValue === "" ? "" : Number(budgetValue);

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
            budget: projectBudget
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
        budget: projectBudget
      };

      savedProjects.push(newProject);
      saveProjects(savedProjects);
      renderProjects();

      setFormVisibility(false);
      showProjectFormButton.focus();
    });

    function openProject() {
      alert("Project opened!");
    }
