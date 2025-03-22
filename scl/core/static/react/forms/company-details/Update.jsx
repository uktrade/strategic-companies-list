import React from "react";
import { useForm } from "react-hook-form";

const Update = ({ data, onSubmit, setIsUpdating }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: data?.title,
    },
  });

  return (
    <>
      <h2 className="govuk-heading-m">Update: {data.title}</h2>
      <form
        onSubmit={handleSubmit((data) => onSubmit(data, "update"))}
        className="scl-inine-form govuk-!-margin-top-0"
      >
        <label className="govuk-label" htmlFor="title">
          Title
        </label>
        {errors.title && (
          <p className="govuk-error-message">
            <span className="govuk-visually-hidden">Error:</span>
            {errors.title?.message}
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
        <div className="govuk-!-margin-top-2">
          <button type="submit" className="govuk-button govuk-!-margin-right-2">
            Save
          </button>
          <a
            className="govuk-button govuk-button--secondary"
            onClick={() => setIsUpdating(false)}
          >
            Cancel
          </a>
        </div>
      </form>
    </>
  );
};

export default Update;
