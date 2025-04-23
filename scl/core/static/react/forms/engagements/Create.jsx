import React from "react";
import { useForm } from "react-hook-form";

const Create = ({ onSubmit, setIsAddingEngagement }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  return (
    <>
      <h2 className="govuk-heading-m">Add engagement</h2>
      <form
        onSubmit={handleSubmit((data) => onSubmit(data, "create"))}
        className="scl-inine-form"
      >
        <label className="govuk-label" htmlFor="title">
          Title
        </label>
        {errors && (
          <p className="govuk-error-message">
            <span className="govuk-visually-hidden">Error:</span>
            {errors?.title?.message}
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

        <label className="govuk-label" htmlFor="date">
          Date
        </label>
        {errors && (
          <p className="govuk-error-message">
            <span className="govuk-visually-hidden">Error:</span>
            {errors?.date?.message}
          </p>
        )}
        <input
          className="govuk-input govuk-!-margin-bottom-4"
          id="date"
          type="date"
          {...register("date", {
            required: "Date is required",
          })}
        />

        <label className="govuk-label" htmlFor="details">
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
          <button
            type="button"
            className="govuk-button govuk-button--secondary"
            onClick={() => setIsAddingEngagement(false)}
          >
            Cancel
          </button>
        </div>
      </form>
    </>
  );
};

export default Create;
