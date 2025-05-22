import React, { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";

const Update = ({ data, onSubmit, onDelete, setIsUpdating }) => {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      notes: data,
    },
  });

  useEffect(() => {
    reset({ notes: data });
  }, [data, reset]);

  const { fields } = useFieldArray({
    control,
    name: "notes",
  });

  return (
    <>
      <h2 className="govuk-heading-m">Update Business intelligence</h2>
      <form
        onSubmit={handleSubmit((data) => onSubmit(data, "update"))}
        className="scl-inine-form"
      >
        {fields.map((field, index) => (
          <div key={field.id} className="scl-inine-form__fieldset">
            <a
              className="govuk-button govuk-button--warning govuk-!-margin-bottom-0 scl-inine-form__delete"
              onClick={() => onDelete(field.noteId)}
            >
              Delete
            </a>
            <fieldset className="govuk-fieldset" key={`${field.name}-${index}`}>
              <label
                className="govuk-label govuk-!-font-weight-bold"
                htmlFor="contents"
              >
                Update business intelligence
              </label>
              {errors && (
                <p className="govuk-error-message">
                  <span className="govuk-visually-hidden">Error:</span>
                  {errors?.contents?.message}
                </p>
              )}
              <textarea
                className="govuk-textarea govuk-!-margin-bottom-4"
                id="contents"
                type="text"
                rows="5"
                {...register(`notes.${index}.contents`, {
                  required: "Contents are required",
                })}
              ></textarea>
            </fieldset>
            <input
              id={`notes.${index}.id`}
              type="hidden"
              {...register(`notes.${index}.id`)}
            />
          </div>
        ))}
        <div className="govuk-!-margin-top-2">
          <button type="submit" className="govuk-button govuk-!-margin-right-2">
            Save
          </button>
          <button
            className="govuk-button govuk-button--secondary"
            onClick={() => setIsUpdating(false)}
          >
            Cancel
          </button>
        </div>
      </form>
    </>
  );
};

export default Update;
