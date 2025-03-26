import React, { useState } from "react";

import ApiProxy from "../../proxy";

import Card from "../../components/Card";
import LoadingSpinner from "../../components/Spinner";
import SectionActions from "../../components/SectionActions";
import Create from "../../forms/notes/Create";
import Update from "../../forms/notes/Update";

const Notes = ({
  id,
  csrf_token,
  data,
  isEditing,
  showUpdateNotification,
  isUpdatingNotes,
  setIsUpdatingNotes,
  setIsCreatingNotes,
  isCreatingNotes,
}) => {
  const [notes, setNotes] = useState(data);
  const [isLoading, setIsLoading] = useState(false);

  const ENDPOINT = `/api/v1/engagement/${id}/note`;

  const onSubmit = async (payload, method) => {
    if (method === "create") {
      setIsLoading(true);
      const { data, status } = await ApiProxy.post(
        ENDPOINT,
        payload,
        csrf_token
      );
      setNotes(data.data);
      setIsLoading(false);
      setIsCreatingNotes(false);
      showUpdateNotification("Note added");
    }
    if (method === "update") {
      setIsLoading(true);
      const { data, status } = await ApiProxy.update(
        ENDPOINT,
        payload,
        csrf_token
      );
      setNotes(data.data);
      setIsLoading(false);
      setIsUpdatingNotes(false);
      showUpdateNotification("Note updated");
    }
  };

  const onDelete = async (noteId) => {
    setIsLoading(true);
    const { data, status } = await ApiProxy.delete(
      ENDPOINT,
      { id: noteId },
      csrf_token
    );
    setNotes(data.data);
    if (data.data.length <= 0) {
      setIsUpdatingNotes(false);
      setIsCreatingNotes(false);
    }
    setIsLoading(false);
    showDeleteNotification("Note deleted");
  };
  return (
    <>
      {!isCreatingNotes && !isUpdatingNotes && (
        <>
          <h2 className="govuk-heading-m govuk-!-margin-top-8">Notes</h2>
          <hr className="govuk-section-break govuk-section-break--m govuk-section-break--visible govuk-!-margin-top-4" />
        </>
      )}
      <LoadingSpinner isLoading={isLoading}>
        {!isCreatingNotes &&
          !isUpdatingNotes &&
          (notes.length ? (
            notes.map((note) => (
              <Card key={note.noteId} className="govuk-!-margin-bottom-4">
                <p className="govuk-body">{note.contents}</p>
              </Card>
            ))
          ) : (
            <p className="govuk-body">You currently have no notes.</p>
          ))}
      </LoadingSpinner>
      {isEditing && isCreatingNotes && (
        <Create onSubmit={onSubmit} setIsCreating={setIsCreatingNotes} />
      )}
      {isEditing && isUpdatingNotes && (
        <Update
          data={notes}
          onSubmit={onSubmit}
          onDelete={onDelete}
          setIsUpdating={setIsUpdatingNotes}
        />
      )}
      {isEditing && !isCreatingNotes && !isUpdatingNotes && (
        <SectionActions
          addLabel="Add note"
          editLabel="Edit note"
          showEdit={Boolean(notes.length)}
          setIsCreating={() => setIsCreatingNotes(!isCreatingNotes)}
          setIsUpdating={() => setIsUpdatingNotes(!isUpdatingNotes)}
        />
      )}
    </>
  );
};

export default Notes;
