import React from "react";
import { useForm } from "react-hook-form";

const Create = ({ onSubmit, SetIsCreating }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  return (
    <>
      <h2 className="govuk-heading-m">Add new key person</h2>
      <form
        onSubmit={handleSubmit((data) => onSubmit(data, "create"))}
        class="scl-inine-form"
      >
        <label className="govuk-label" htmlFor="name">
          Name
        </label>
        {errors && (
          <p class="govuk-error-message">
            <span class="govuk-visually-hidden">Error:</span>
            {errors?.name?.message}
          </p>
        )}
        <input
          className="govuk-input govuk-!-margin-bottom-4"
          id="name"
          type="text"
          {...register("name", {
            required: "Name is required",
          })}
        />
        <label className="govuk-label" htmlFor="role">
          Role
        </label>
        {errors && (
          <p class="govuk-error-message">
            <span class="govuk-visually-hidden">Error:</span>
            {errors?.role?.message}
          </p>
        )}
        <input
          className="govuk-input govuk-!-margin-bottom-4"
          id="role"
          type="text"
          {...register("role", {
            required: "Role is required",
          })}
        />

        <div className="govuk-!-margin-top-2">
          <button type="submit" className="govuk-button govuk-!-margin-right-2">
            Save
          </button>
          <button
            className="govuk-button govuk-button--secondary"
            onClick={() => SetIsCreating(false)}
          >
            Cancel
          </button>
        </div>
      </form>
    </>
  );
};

export default Create;
