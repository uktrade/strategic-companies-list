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
      priorities: data,
    },
  });

  useEffect(() => {
    reset({ priorities: data });
  }, [data, reset]);

  const { fields } = useFieldArray({
    control,
    name: "priorities",
  });

  return (
    <>
      {Boolean(fields.length) && (
        <form
          onSubmit={handleSubmit((data) => onSubmit(data, "update"))}
          className="scl-inine-form"
        >
          {fields.map((field, index) => {
            return (
              <div key={field.id} className="scl-inine-form__fieldset">
                <a
                  className="govuk-button govuk-button--warning govuk-!-margin-bottom-0 scl-inine-form__delete"
                  onClick={() => onDelete(field.insightId)}
                >
                  Delete
                </a>
                <fieldset
                  className="govuk-fieldset"
                  key={`${field.name}-${index}`}
                >
                  <legend className="govuk-fieldset__legend govuk-fieldset__legend--s">
                    <h2 className="govuk-fieldset__heading">
                      Update: {field.title}
                    </h2>
                  </legend>
                  <label className="govuk-label" htmlFor="title">
                    Title
                  </label>
                  {errors.priorities && (
                    <p className="govuk-error-message">
                      <span className="govuk-visually-hidden">Error:</span>
                      {errors.priorities?.[index]?.title?.message}
                    </p>
                  )}
                  <input
                    className="govuk-input govuk-!-margin-bottom-4"
                    id={`priorities.${index}.title`}
                    type="text"
                    {...register(`priorities.${index}.title`, {
                      required: "Title is required",
                    })}
                  />
                  <label className="govuk-label" htmlFor="details">
                    Details
                  </label>
                  {errors.priorities && (
                    <p className="govuk-error-message">
                      <span className="govuk-visually-hidden">Error:</span>
                      {errors.priorities?.[index]?.details?.message}
                    </p>
                  )}
                  <textarea
                    className="govuk-textarea govuk-!-margin-bottom-4"
                    id="details"
                    type="text"
                    rows="5"
                    {...register(`priorities.${index}.details`, {
                      required: "Details are required",
                    })}
                  ></textarea>
                </fieldset>
              </div>
            );
          })}

          <div className="govuk-!-margin-top-2">
            <button
              type="submit"
              className="govuk-button govuk-!-margin-right-2"
            >
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
      )}
    </>
  );
};

export default Update;
