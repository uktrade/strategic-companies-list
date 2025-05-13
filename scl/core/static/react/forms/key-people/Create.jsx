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
      <h2 className="govuk-heading-m">Add new key person</h2>
      <form
        onSubmit={handleSubmit((data) => onSubmit(data, "create"))}
        className="scl-inine-form"
      >
        <label className="govuk-label" htmlFor="name">
          Name
        </label>
        {errors && (
          <p className="govuk-error-message">
            <span className="govuk-visually-hidden">Error:</span>
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
          <p className="govuk-error-message">
            <span className="govuk-visually-hidden">Error:</span>
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
        <label className="govuk-label" htmlFor="email">
          Email
        </label>
        {errors && (
          <p className="govuk-error-message">
            <span className="govuk-visually-hidden">Error:</span>
            {errors?.email?.message}
          </p>
        )}
        <input
          className="govuk-input govuk-!-margin-bottom-4"
          id="email"
          type="text"
          {...register("email", {
            required: "Email is required",
          })}
        />
        <div className="govuk-!-margin-top-2">
          <button type="submit" className="govuk-button govuk-!-margin-right-2">
            Save
          </button>
          <button
            className="govuk-button govuk-button--secondary"
            id="cancel-add-key-person"
            onClick={() => setIsCreating(false)}
            type="button"
          >
            Cancel
          </button>
        </div>
      </form>
    </>
  );
};

export default Create;
