(() => {
  const timeout = (duration) => {
    return new Promise((resolve) => setTimeout(resolve, duration));
  };

  const getToken = ()=> document.querySelector("[data-scl-csrf-token]").getAttribute("data-scl-csrf-token");

  const minTimeFetch = async (minTime, resource, options) => {
    // Wraps fetch in an API where it has a minimum run time (in case it's really quick so
    // the user has a chance to see "Saving" or similar, and also avoids it from raising an
    // exception, so calling code doesn't need try/catch blocks
    const start = performance.now();
    let error = null;
    let response = null;

    try {
      response = await fetch(resource, options);
      if (!response.ok) {
        throw new Error();
      }

    } catch (_error) {
      error = _error;
    }

    const end = performance.now();
    await timeout(Math.max(750, performance.now() - start));

    return { error, response };
  };

  const registerEditButton = (editButton) => {
    let isEditable = false;
    const token = getToken();

    const save = async () => {
      isEditable = !isEditable;

      const data = {};
      const id = editButton.getAttribute("data-scl-edit-id");
      const target = editButton.getAttribute("data-scl-edit-target");
      const method = editButton.getAttribute("data-scl-method");
      const endpoint = editButton.getAttribute("data-scl-endpoint");

      editButton.innerHTML = isEditable ? "Save" : "Edit";

      const contentSource = Array.from(
        document.querySelectorAll(`[data-scl-edit-source="${target}"]`)
      );
      contentSource.map((source) =>
        source.toggleAttribute("contenteditable", isEditable)
      );

      if (isEditable) return;

      editButton.disabled = true;
      editButton.innerHTML = "Saving...";

      contentSource.forEach((item) => {
        data["id"] = id;
        data[item.getAttribute("data-scl-payload")] = item.innerHTML;
      });

      const { error, response } = await minTimeFetch(750, endpoint, {
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": token,
        },
        method: method,
        body: JSON.stringify(data),
      });

      editButton.innerHTML = error ? "Error!" : "Saved";
      await timeout(750);

      editButton.disabled = false;
      editButton.innerHTML = "Edit";
    };

    editButton.addEventListener("click", save);
  };

  const registerSaveTranscriptButton = (button) => {
    const token = getToken();
    const targetId = button.getAttribute("data-transcript-target");
    const endPoint = button.getAttribute("data-scl-endpoint");

    const saveTranscript = async () => {
      button.innerHTML = "Saving...";
      const data = document.querySelector(
        `#transcription-target-${targetId} p span`
      ).innerHTML;
      const { error, response } = await minTimeFetch(750, endPoint, {
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": token,
        },
        method: "POST",
        body: JSON.stringify({ contents: data }),
      });

      button.innerHTML = error ? "Error!" : "Saved";
      await timeout(750);
      window.location.reload();
    };

    button.addEventListener("click", saveTranscript);
  };

  const registerDeleteTranscriptButton = (button) => {
    const token = getToken();
    noteId = button.getAttribute("data-scl-notes-id");
    endPoint = button.getAttribute("data-scl-endpoint");
    const deleteNote = async () => {
      button.innerHTML = "Deleting...";
      const { error, response } = await minTimeFetch(750, endPoint, {
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": token,
        },
        method: "DELETE",
        body: JSON.stringify({ id: noteId }),
      });

      button.innerHTML = error ? "Error!" : "Deleted";
      await timeout(750);
      window.location.reload();
    };

    button.addEventListener("click", deleteNote);
  };

  const registerPrintButton = (button) => {
    button.addEventListener("click", () => window.print());
  };

  document.addEventListener("DOMContentLoaded", () => {
    document
      .querySelectorAll('[data-module="scl-edit-button"]')
      .forEach(registerEditButton);   
    document
      .querySelectorAll('[data-module="scl-save-transcript"]')
      .forEach(registerSaveTranscriptButton);
    document
      .querySelectorAll('[data-module="scl-delete-transcript"]')
      .forEach(registerDeleteTranscriptButton);
    document
      .querySelectorAll('[data-module="scl-print-button"]')
      .forEach(registerPrintButton);
  });
})();

  (() => {
    const token = document
      .querySelector("[data-scl-csrf-token]")
      .getAttribute("data-scl-csrf-token");

    // Utility functions
    const timeout = (duration) =>
      new Promise((resolve) => setTimeout(resolve, duration));

    const minTimeFetch = async (minTime, resource, options) => {
      const start = performance.now();
      let error = null;
      let response = null;

      try {
        response = await fetch(resource, options);
        if (!response.ok) {
          throw new Error();
        }
      } catch (_error) {
        error = _error;
      }

      const end = performance.now();
      await timeout(Math.max(750, performance.now() - start));

      return { error, response };
    };

    // Helper function to safely create DOM elements
    const createElement = (tag, attributes = {}, children = []) => {
      const element = document.createElement(tag);

      // Set attributes
      Object.entries(attributes).forEach(([key, value]) => {
        if (key === "className") {
          element.className = value;
        } else if (key === "textContent") {
          element.textContent = value;
        } else {
          element.setAttribute(key, value);
        }
      });

      // Append children
      children.forEach((child) => {
        if (typeof child === "string") {
          element.appendChild(document.createTextNode(child));
        } else {
          element.appendChild(child);
        }
      });

      return element;
    };

    // Update the last updated timestamp
    const updateLastUpdated = () => {
      const lastUpdatedElement = document.getElementById(
        "company-last-updated"
      );
      if (lastUpdatedElement) {
        const now = new Date();
        const month = now.toLocaleString("en-US", { month: "long" });
        const day = now.getDate();
        const year = now.getFullYear();
        const hour = now.getHours() % 12 || 12;
        const minute = now.getMinutes().toString().padStart(2, "0");
        const ampm = now.getHours() >= 12 ? "p.m." : "a.m.";

        lastUpdatedElement.textContent = `Last updated: ${month} ${day}, ${year}, ${hour}:${minute} ${ampm}`;
      }
    };

    // Global editing state
    let pageIsEditing = false;

    // Toggle priority actions visibility based on edit mode
    const editButton = document.querySelector(
      '[data-module="scl-edit-button"]'
    );
    if (editButton) {
      const priorityActions = document.querySelectorAll(
        ".scl-priority-actions"
      );
      const addButtons = document.querySelectorAll(
        ".scl-priority-button--hidden"
      );
      const moreToggles = document.querySelectorAll(
        ".scl-priority-more-toggle"
      );

      // Show "Show more" toggle buttons only when not in edit mode
      const updatePriorityVisibility = () => {
        priorityActions.forEach((action) => {
          action.classList.toggle(
            "scl-priority-actions--hidden",
            !pageIsEditing
          );
        });

        addButtons.forEach((button) => {
          button.style.display = pageIsEditing ? "inline-block" : "none";
        });

        // When editing, show all priorities
        if (pageIsEditing) {
          // Hide all "Show more" toggles
          moreToggles.forEach((toggle) => {
            toggle.style.display = "none";
          });

          // Make all priorities visible
          document.querySelectorAll(".scl-priority-item").forEach((item) => {
            item.style.display = "list-item";
          });
        } else {
          // When not editing, manage "Show more" toggles
          refreshPriorityDisplay();
        }
      };

      // Function to refresh priority display based on current state
      const refreshPriorityDisplay = () => {
        const containers = [
          "#company-priorities-container",
          "#hmg-priorities-container",
        ];

        containers.forEach((containerSelector) => {
          const container = document.querySelector(containerSelector);
          if (!container) return;

          const list = container.querySelector(".govuk-list");
          const noMessage = container.querySelector(
            '[id^="no-"][id$="-priorities-message"]'
          );

          // If there's no list but should be (we have items), create it
          if (
            !list &&
            container.querySelectorAll(".scl-priority-item").length > 0
          ) {
            const newList = document.createElement("ul");
            newList.id = containerSelector.replace("#", "") + "-list";
            newList.className = "govuk-list";

            // Move all priority items into the list
            const items = container.querySelectorAll(".scl-priority-item");
            items.forEach((item) => newList.appendChild(item));

            // Add the list to the container
            const addButton = container.querySelector(
              '[id^="add-"][id$="-priority-button"]'
            );
            if (addButton) {
              container.insertBefore(newList, addButton);
            } else {
              container.appendChild(newList);
            }

            // Hide "no priorities" message
            if (noMessage) {
              noMessage.style.display = "none";
            }
            return;
          }

          if (!list) return;

          const items = list.querySelectorAll(".scl-priority-item");
          const moreToggle = list.querySelector(".scl-priority-more-toggle");

          // Update "no priorities" message visibility
          if (noMessage) {
            noMessage.style.display = items.length === 0 ? "block" : "none";
          }

          // If we have no items, remove the list
          if (items.length === 0) {
            list.remove();
            return;
          }

          // Remove any existing "Show more" toggle
          if (moreToggle) {
            moreToggle.remove();
          }

          // If we have more than 5 priorities, add the toggle and hide extras
          if (items.length > 5) {
            // Hide priorities beyond the first 5
            items.forEach((item, index) => {
              if (index >= 5) {
                item.style.display = "none";
              } else {
                item.style.display = "list-item";
              }
            });

            // Create and add the "Show more" toggle
            const newToggle = document.createElement("li");
            newToggle.className = "scl-priority-more-toggle";
            newToggle.dataset.moreText = "Show all priorities";
            newToggle.dataset.lessText = "Show fewer priorities";

            const toggleButton = document.createElement("button");
            toggleButton.className = "govuk-button govuk-button--secondary";
            toggleButton.textContent = "Show all priorities";
            newToggle.appendChild(toggleButton);

            // Insert after the 5th item
            if (items[4] && items[4].nextSibling) {
              list.insertBefore(newToggle, items[4].nextSibling);
            } else {
              list.appendChild(newToggle);
            }

            // Add toggle functionality
            const button = newToggle.querySelector("button");
            let isExpanded = false;

            button.addEventListener("click", () => {
              isExpanded = !isExpanded;
              button.textContent = isExpanded
                ? newToggle.dataset.lessText
                : newToggle.dataset.moreText;

              // Show/hide priorities beyond the first 5
              items.forEach((item, index) => {
                if (index >= 5) {
                  item.style.display = isExpanded ? "list-item" : "none";
                }
              });
            });
          } else {
            // Show all priorities if we have 5 or fewer
            items.forEach((item) => {
              item.style.display = "list-item";
            });
          }
        });
      };

      // Initialize priority visibility
      updatePriorityVisibility();

      // Listen for edit button clicks
      editButton.addEventListener("click", () => {
        pageIsEditing = !pageIsEditing;
        updatePriorityVisibility();

        // Force refresh all priority items to update their visibility state
        document.querySelectorAll(".scl-priority-actions").forEach((action) => {
          action.classList.toggle(
            "scl-priority-actions--hidden",
            !pageIsEditing
          );
        });

        // Update the last updated timestamp when saving
        if (!pageIsEditing) {
          updateLastUpdated();

          // Check each container for empty priority lists and update messages
          [
            "#company-priorities-container",
            "#hmg-priorities-container",
          ].forEach((selector) => {
            const container = document.querySelector(selector);
            if (!container) return;

            const list = container.querySelector(".govuk-list");
            const noMessage = container.querySelector(
              '[id^="no-"][id$="-priorities-message"]'
            );

            // If list exists but has no items, or doesn't exist, show the message
            if (
              (!list ||
                list.querySelectorAll(".scl-priority-item").length === 0) &&
              noMessage
            ) {
              noMessage.style.display = "block";
              if (list) list.remove();
            }
          });

          // Then refresh the overall display
          refreshPriorityDisplay();
        }
      });
    }

    // Handle Company Priorities
    const setupPriorityHandlers = (containerSelector, type) => {
      const container = document.querySelector(containerSelector);
      if (!container) return;

      const duns = container.getAttribute("data-company-duns");
      const insightType = container.getAttribute("data-insight-type");

      const listId = `${insightType.replace("_", "-")}-list`;
      const noMessageId = `no-${insightType.replace("_", "-")}-message`;
      const addButtonId = `add-${insightType.replace("_", "-")}-button`;

      const list = document.getElementById(listId);
      const noMessage = document.getElementById(noMessageId);
      const addButton = document.getElementById(addButtonId);

      // Add new priority
      addButton.addEventListener("click", () => {
        // Hide "no priorities" message when adding a new priority
        if (noMessage) {
          noMessage.style.display = "none";
        }

        // Create or get list
        let priorityList = list;
        if (!priorityList) {
          priorityList = document.createElement("ul");
          priorityList.id = listId;
          priorityList.className = "govuk-list";
          container.insertBefore(priorityList, addButton);
        }

        // Create a new priority item at the end of the list
        const newItem = document.createElement("li");
        newItem.className = "scl-priority-item scl-priority-item--new";

        // Generate a temporary ID for the new item
        const tempId = "new-priority-" + Date.now();
        newItem.setAttribute("data-temp-id", tempId);

        // Create the form elements
        const editingDiv = createElement("div", {
          className: "scl-priority-editing",
        });

        // Title field
        const titleGroup = createElement("div", {
          className: "govuk-form-group",
        });
        const titleLabel = createElement(
          "label",
          {
            className: "govuk-label",
            for: `${tempId}-title`,
          },
          ["Priority"]
        );
        const titleInput = createElement("input", {
          className: "govuk-input",
          id: `${tempId}-title`,
          name: "title",
          type: "text",
        });

        titleGroup.appendChild(titleLabel);
        titleGroup.appendChild(titleInput);

        // Details field
        const detailsGroup = createElement("div", {
          className: "govuk-form-group",
        });
        const detailsLabel = createElement(
          "label",
          {
            className: "govuk-label",
            for: `${tempId}-details`,
          },
          ["Details"]
        );
        const detailsTextarea = createElement("textarea", {
          className: "govuk-textarea",
          id: `${tempId}-details`,
          name: "details",
          rows: "5",
        });

        detailsGroup.appendChild(detailsLabel);
        detailsGroup.appendChild(detailsTextarea);

        // Buttons
        const buttonGroup = createElement("div", {
          className: "govuk-button-group",
        });
        const saveButton = createElement(
          "button",
          {
            className: "govuk-button scl-priority-save",
          },
          ["Save"]
        );
        const cancelButton = createElement(
          "button",
          {
            className:
              "govuk-button govuk-button--secondary scl-priority-cancel",
          },
          ["Cancel"]
        );

        buttonGroup.appendChild(saveButton);
        buttonGroup.appendChild(cancelButton);

        // Assemble the form
        editingDiv.appendChild(titleGroup);
        editingDiv.appendChild(detailsGroup);
        editingDiv.appendChild(buttonGroup);

        newItem.appendChild(editingDiv);
        priorityList.appendChild(newItem);

        // Scroll to the new item
        newItem.scrollIntoView({ behavior: "smooth", block: "center" });

        // Focus the title input
        setTimeout(() => {
          titleInput.focus();
        }, 100);

        // Setup save/cancel handlers
        setupNewPriorityHandlers(newItem, duns, insightType);
      });

      // Setup handlers for a new priority item
      const setupNewPriorityHandlers = (item, duns, insightType) => {
        const saveButton = item.querySelector(".scl-priority-save");
        const cancelButton = item.querySelector(".scl-priority-cancel");
        const titleInput = item.querySelector('input[name="title"]');
        const detailsInput = item.querySelector('textarea[name="details"]');

        // Cancel adding
        cancelButton.addEventListener("click", () => {
          item.remove();

          // Check if this was the only item and show "no priorities" message if needed
          const listElement = document.getElementById(listId);
          if (
            listElement &&
            listElement.querySelectorAll(".scl-priority-item").length === 0
          ) {
            listElement.remove();
            if (noMessage) {
              noMessage.style.display = "block";
            }
          }
        });

        // Save new priority
        saveButton.addEventListener("click", async () => {
          const title = titleInput.value.trim();
          const details = detailsInput.value.trim();

          if (!title) {
            alert("Please enter a title for the priority");
            return;
          }

          saveButton.textContent = "Saving...";
          saveButton.disabled = true;

          const endpoint = `/api/v1/company/${duns}/insights/${insightType}`;

          const { error, response } = await minTimeFetch(750, endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": token,
            },
            body: JSON.stringify({ title, details }),
          });

          if (error) {
            saveButton.textContent = "Error!";
            await timeout(750);
            saveButton.textContent = "Save";
            saveButton.disabled = false;
            return;
          }

          const data = await response.json();

          // Replace editing form with the saved priority content
          item.setAttribute("data-priority-id", data.id);
          item.removeAttribute("data-temp-id");
          item.classList.remove("scl-priority-item--new");

          // Clear existing content
          while (item.firstChild) {
            item.removeChild(item.firstChild);
          }

          // Create the content elements
          const contentDiv = createElement("div", {
            className: "scl-priority-content",
          });

          // Title
          const titleElement = createElement(
            "b",
            {
              className: "scl-priority-title",
            },
            [data.title]
          );

          // Details with line breaks
          const detailsElement = createElement("div", {
            className: "scl-priority-details",
          });
          data.details.split("\n").forEach((line, index, array) => {
            detailsElement.appendChild(document.createTextNode(line));
            if (index < array.length - 1) {
              detailsElement.appendChild(document.createElement("br"));
            }
          });

          // Author info
          const authorInfo = createElement(
            "p",
            {
              className: "govuk-body-s govuk-!-margin-top-1",
            },
            [
              `Added by ${data.created_by} on ${new Date(
                data.created_at
              ).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}`,
            ]
          );

          contentDiv.appendChild(titleElement);
          contentDiv.appendChild(detailsElement);
          contentDiv.appendChild(authorInfo);

          // Action buttons
          const actionsDiv = createElement("div", {
            className: `scl-priority-actions ${
              !pageIsEditing ? "scl-priority-actions--hidden" : ""
            }`,
          });

          const editButton = createElement(
            "button",
            {
              className:
                "govuk-button govuk-button--secondary scl-button-edit-priority",
            },
            ["Edit"]
          );

          const deleteButton = createElement(
            "button",
            {
              className:
                "govuk-button govuk-button--warning scl-button-delete-priority",
            },
            ["Delete"]
          );

          actionsDiv.appendChild(editButton);
          actionsDiv.appendChild(deleteButton);

          item.appendChild(contentDiv);
          item.appendChild(actionsDiv);

          // Add event listeners to the new buttons
          setupItemEventListeners(item);

          // Hide "no priorities" message if it exists
          if (noMessage) {
            noMessage.style.display = "none";
          }

          // Refresh the priority display
          refreshPriorityDisplay();

          // Update the last updated timestamp
          updateLastUpdated();
        });
      };

      // Setup edit/delete buttons for a priority item
      const setupItemEventListeners = (item) => {
        const editButton = item.querySelector(".scl-button-edit-priority");
        const deleteButton = item.querySelector(".scl-button-delete-priority");
        const priorityId = item.getAttribute("data-priority-id");

        // Edit priority in place
        editButton.addEventListener("click", async () => {
          // Get current content
          const titleElement = item.querySelector(".scl-priority-title");
          const detailsElement = item.querySelector(".scl-priority-details");

          const currentTitle = titleElement.textContent.trim();
          // Get text content with newlines preserved
          let currentDetails = "";
          if (detailsElement) {
            // Extract text and preserve line breaks
            Array.from(detailsElement.childNodes).forEach((node) => {
              if (node.nodeType === Node.TEXT_NODE) {
                currentDetails += node.textContent;
              } else if (node.nodeName === "BR") {
                currentDetails += "\n";
              }
            });
          }

          // Save original DOM structure
          item.setAttribute("data-original-structure", "saved");
          // Store the original elements for later restore
          const origContent = item.cloneNode(true);

          // Clear the item
          while (item.firstChild) {
            item.removeChild(item.firstChild);
          }

          // Create editing form
          const editingDiv = createElement("div", {
            className: "scl-priority-editing",
          });

          // Title field
          const titleGroup = createElement("div", {
            className: "govuk-form-group",
          });
          const titleLabel = createElement(
            "label",
            {
              className: "govuk-label",
              for: `edit-${priorityId}-title`,
            },
            ["Priority"]
          );
          const titleInput = createElement("input", {
            className: "govuk-input",
            id: `edit-${priorityId}-title`,
            name: "title",
            type: "text",
            value: currentTitle,
          });

          titleGroup.appendChild(titleLabel);
          titleGroup.appendChild(titleInput);

          // Details field
          const detailsGroup = createElement("div", {
            className: "govuk-form-group",
          });
          const detailsLabel = createElement(
            "label",
            {
              className: "govuk-label",
              for: `edit-${priorityId}-details`,
            },
            ["Details"]
          );
          const detailsTextarea = createElement("textarea", {
            className: "govuk-textarea",
            id: `edit-${priorityId}-details`,
            name: "details",
            rows: "5",
          });
          detailsTextarea.textContent = currentDetails.trim();

          detailsGroup.appendChild(detailsLabel);
          detailsGroup.appendChild(detailsTextarea);

          // Buttons
          const buttonGroup = createElement("div", {
            className: "govuk-button-group",
          });
          const saveButton = createElement(
            "button",
            {
              className: "govuk-button scl-priority-update",
            },
            ["Save"]
          );
          const cancelButton = createElement(
            "button",
            {
              className:
                "govuk-button govuk-button--secondary scl-priority-cancel-edit",
            },
            ["Cancel"]
          );

          buttonGroup.appendChild(saveButton);
          buttonGroup.appendChild(cancelButton);

          // Assemble the form
          editingDiv.appendChild(titleGroup);
          editingDiv.appendChild(detailsGroup);
          editingDiv.appendChild(buttonGroup);

          item.appendChild(editingDiv);

          // Setup save/cancel handlers for editing
          const updateButton = item.querySelector(".scl-priority-update");

          // Cancel editing
          cancelButton.addEventListener("click", () => {
            // Restore original content by replacing the entire item
            while (item.firstChild) {
              item.removeChild(item.firstChild);
            }

            // Clone each child node from the original content
            Array.from(origContent.childNodes).forEach((node) => {
              item.appendChild(node.cloneNode(true));
            });

            item.removeAttribute("data-original-structure");

            // Re-setup event listeners
            setupItemEventListeners(item);
          });

          // Update priority
          updateButton.addEventListener("click", async () => {
            const title = titleInput.value.trim();
            const details = detailsTextarea.value.trim();

            if (!title) {
              alert("Please enter a title for the priority");
              return;
            }

            updateButton.textContent = "Saving...";
            updateButton.disabled = true;

            const endpoint = `/api/v1/insights/${priorityId}`;

            const { error, response } = await minTimeFetch(750, endpoint, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": token,
              },
              body: JSON.stringify({ title, details }),
            });

            if (error) {
              updateButton.textContent = "Error!";
              await timeout(750);
              updateButton.textContent = "Save";
              updateButton.disabled = false;
              return;
            }

            const data = await response.json();

            // Clear current content
            while (item.firstChild) {
              item.removeChild(item.firstChild);
            }

            // Create the content elements
            const contentDiv = createElement("div", {
              className: "scl-priority-content",
            });

            // Title
            const titleElement = createElement(
              "b",
              {
                className: "scl-priority-title",
              },
              [data.title]
            );

            // Details with line breaks
            const detailsElement = createElement("div", {
              className: "scl-priority-details",
            });
            data.details.split("\n").forEach((line, index, array) => {
              detailsElement.appendChild(document.createTextNode(line));
              if (index < array.length - 1) {
                detailsElement.appendChild(document.createElement("br"));
              }
            });

            // Author info
            const authorInfo = createElement(
              "p",
              {
                className: "govuk-body-s govuk-!-margin-top-1",
              },
              [
                `Added by ${data.created_by} on ${new Date(
                  data.created_at
                ).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}`,
              ]
            );

            contentDiv.appendChild(titleElement);
            contentDiv.appendChild(detailsElement);
            contentDiv.appendChild(authorInfo);

            // Action buttons
            const actionsDiv = createElement("div", {
              className: `scl-priority-actions ${
                !pageIsEditing ? "scl-priority-actions--hidden" : ""
              }`,
            });

            const editButton = createElement(
              "button",
              {
                className:
                  "govuk-button govuk-button--secondary scl-button-edit-priority",
              },
              ["Edit"]
            );

            const deleteButton = createElement(
              "button",
              {
                className:
                  "govuk-button govuk-button--warning scl-button-delete-priority",
              },
              ["Delete"]
            );

            actionsDiv.appendChild(editButton);
            actionsDiv.appendChild(deleteButton);

            item.appendChild(contentDiv);
            item.appendChild(actionsDiv);

            // Re-setup event listeners
            setupItemEventListeners(item);

            // Update the last updated timestamp
            updateLastUpdated();
          });
        });

        // Delete priority
        deleteButton.addEventListener("click", async () => {
          if (!confirm("Are you sure you want to delete this priority?")) {
            return;
          }

          deleteButton.textContent = "Deleting...";
          deleteButton.disabled = true;

          const { error } = await minTimeFetch(
            750,
            `/api/v1/insights/${priorityId}`,
            {
              method: "DELETE",
              headers: {
                "X-CSRFToken": token,
              },
            }
          );

          if (error) {
            deleteButton.textContent = "Error!";
            await timeout(750);
            deleteButton.textContent = "Delete";
            deleteButton.disabled = false;
            return;
          }

          // Remove item from UI
          item.remove();

          // Check if list is now empty
          const listElement = document.getElementById(listId);
          if (
            listElement &&
            listElement.querySelectorAll(".scl-priority-item").length === 0
          ) {
            listElement.remove();
            if (noMessage) {
              noMessage.style.display = "block";
            }
          } else if (listElement) {
            // Refresh the priority display
            refreshPriorityDisplay();
          }

          // Update the last updated timestamp
          updateLastUpdated();
        });
      };

      // Setup event listeners for existing items
      const items = container.querySelectorAll(".scl-priority-item");
      items.forEach(setupItemEventListeners);
    };

    // Initialize priority handlers when DOM is loaded
    document.addEventListener("DOMContentLoaded", () => {
      setupPriorityHandlers(
        "#company-priorities-container",
        "company_priority"
      );
      setupPriorityHandlers("#hmg-priorities-container", "hmg_priority");

      // Ensure initial state of "no priorities" messages is correct
      refreshPriorityDisplay();
    });

    // Function to refresh priority display across the page
    const refreshPriorityDisplay = () => {
      if (pageIsEditing) return; // Don't refresh during edit mode

      const containers = [
        "#company-priorities-container",
        "#hmg-priorities-container",
      ];

      containers.forEach((containerSelector) => {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const list = container.querySelector(".govuk-list");
        const noMessage = container.querySelector(
          '[id^="no-"][id$="-priorities-message"]'
        );

        // Update "no priorities" message visibility
        if (noMessage) {
          if (!list || !list.querySelectorAll(".scl-priority-item").length) {
            noMessage.style.display = "block";
            if (list) list.remove();
            return;
          } else {
            noMessage.style.display = "none";
          }
        }

        if (!list) return;

        const items = Array.from(list.querySelectorAll(".scl-priority-item"));
        const moreToggle = list.querySelector(".scl-priority-more-toggle");

        // Remove any existing "Show more" toggle
        if (moreToggle) {
          moreToggle.remove();
        }

        // If we have more than 5 priorities, add the toggle and hide extras
        if (items.length > 5) {
          // Hide priorities beyond the first 5
          items.forEach((item, index) => {
            if (index >= 5) {
              item.style.display = "none";
            } else {
              item.style.display = "list-item";
            }
          });

          // Create and add the "Show more" toggle
          const newToggle = createElement("li", {
            className: "scl-priority-more-toggle",
          });

          newToggle.dataset.moreText = "Show all priorities";
          newToggle.dataset.lessText = "Show fewer priorities";

          const toggleButton = createElement("button", {
            className: "govuk-button govuk-button--secondary",
            textContent: "Show all priorities",
          });

          newToggle.appendChild(toggleButton);

          // Insert after the 5th item
          if (items[4] && items[4].nextSibling) {
            list.insertBefore(newToggle, items[4].nextSibling);
          } else {
            list.appendChild(newToggle);
          }

          // Add toggle functionality
          const button = newToggle.querySelector("button");
          let isExpanded = false;

          button.addEventListener("click", () => {
            isExpanded = !isExpanded;
            button.textContent = isExpanded
              ? newToggle.dataset.lessText
              : newToggle.dataset.moreText;

            // Show/hide priorities beyond the first 5
            items.forEach((item, index) => {
              if (index >= 5) {
                item.style.display = isExpanded ? "list-item" : "none";
              }
            });
          });
        } else {
          // Show all priorities if we have 5 or fewer
          items.forEach((item) => {
            item.style.display = "list-item";
          });
        }
      });
    };
  })();
