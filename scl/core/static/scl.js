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
    const token = getToken()
    const editableSection = Array.from(
      document.querySelectorAll(
        editButton.getAttribute("data-scl-edit-button-target")
      )
    );

    let isEditable = false;

    const toggleEdit = async () => {
      isEditable = !isEditable;
      const endpoint = editButton.getAttribute("data-scl-endpoint");
      editButton.innerHTML = isEditable ? "Save" : "Edit";
      editableSection.map((item) => {
        item.toggleAttribute("contenteditable", isEditable);
      });

      // Only try to save it it's not editable, i.e. we're saving
      if (isEditable) return;

      editButton.disabled = true;
      editButton.innerHTML = "Saving...";

      const data = {};
      editableSection.forEach((item) => {
        data[item.getAttribute("data-scl-editable-field")] = item.innerHTML;
      });

      const { error, response } = await minTimeFetch(750, endpoint, {
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": token,
        },
        method: "PATCH",
        body: JSON.stringify(data),
      });

      editButton.innerHTML = error ? "Error!" : "Saved";
      await timeout(750);

      editButton.disabled = false;
      editButton.innerHTML = "Edit";
    };

    editButton.addEventListener("click", toggleEdit);
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
        body: JSON.stringify({ note: data }),
      });

      button.innerHTML = error ? "Error!" : "Saved";
      await timeout(750);
      window.location.reload();
    };

    button.addEventListener("click", saveTranscript);
  };

  const registerDeleteTranscriptButton = (button) => {
    noteId = button.getAttribute("data-scl-notes-id");
    endPoint = button.getAttribute("data-scl-endpoint");
    const deleteNote = async () => {
      button.innerHTML = "Deleting...";
      const { error, response } = await minTimeFetch(750, endPoint, {
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": "{{ csrf_token }}",
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
