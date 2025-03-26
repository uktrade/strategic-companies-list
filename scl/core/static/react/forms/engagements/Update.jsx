import React from "react";
import { useForm } from "react-hook-form";

const Update = ({ onSubmit, data, setIsUpdatingDetails }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: data.title,
      details: data.details,
    },
  });

  return (
    <>
      <h2 className="govuk-heading-m">Update: {data.title}</h2>
      <form
        onSubmit={handleSubmit((data) => onSubmit(data, "create"))}
        className="scl-inine-form"
      >
        <label className="govuk-label" htmlFor="title">
          Title
        </label>
        {errors.title && (
          <p className="govuk-error-message">
            <span className="govuk-visually-hidden">Error:</span>
            {errors.title.message}
          </p>
        )}
        <input
          className="govuk-input govuk-!-margin-bottom-4"
          id="title"
          type="text"
          {...register("title", {
            required: "Title is required",
          })}
        />
        <label className="govuk-label" htmlFor="title">
          Details
        </label>
        {errors && (
          <p className="govuk-error-message">
            <span className="govuk-visually-hidden">Error:</span>
            {errors?.details?.message}
          </p>
        )}
        <textarea
          className="govuk-textarea govuk-!-margin-bottom-4"
          id="details"
          type="text"
          rows="5"
          {...register("details", {
            required: "Details are required",
          })}
        ></textarea>

        <div className="govuk-!-margin-top-2">
          <button type="submit" className="govuk-button govuk-!-margin-right-2">
            Save
          </button>
          <a
            className="govuk-button govuk-button--secondary"
            onClick={() => setIsUpdatingDetails(false)}
          >
            Cancel
          </a>
        </div>
      </form>
    </>
  );
};

export default Update;
