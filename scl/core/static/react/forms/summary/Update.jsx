import React from "react";
import { useForm } from "react-hook-form";

const Create = ({ data, onSubmit, setIsCreating }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      summary: data,
    },
  });

  return (
    <>
      <h2 className="govuk-heading-m">Add summary</h2>
      <form
        onSubmit={handleSubmit((data) => onSubmit(data, "update"))}
        className="scl-inine-form"
      >
        <label className="govuk-label" htmlFor="summary">
          Summary
        </label>
        {errors && (
          <p className="govuk-error-message">
            <span className="govuk-visually-hidden">Error:</span>
            {errors?.summary?.message}
          </p>
        )}
        <textarea
          className="govuk-textarea govuk-!-margin-bottom-4"
          id="details"
          type="text"
          rows="5"
          {...register("summary", {
            required: "Summary is required",
          })}
        ></textarea>

        <div className="govuk-!-margin-top-2">
          <button type="submit" className="govuk-button govuk-!-margin-right-2">
            Save
          </button>
          <button
            className="govuk-button govuk-button--secondary"
            onClick={() => setIsCreating(false)}
          >
            Cancel
          </button>
        </div>
      </form>
    </>
  );
};

export default Create;
