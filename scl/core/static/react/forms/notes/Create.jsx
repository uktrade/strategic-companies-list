import React from "react";
import { useForm } from "react-hook-form";

const Create = ({ onSubmit, setIsCreating }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  return (
    <>
      <h2 className="govuk-heading-m">Add note</h2>
      <form
        onSubmit={handleSubmit((data) => onSubmit(data, "create"))}
        className="scl-inine-form"
      >
        <label className="govuk-label" htmlFor="contents">
          Contents
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
          {...register("contents", {
            required: "Contents are required",
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
