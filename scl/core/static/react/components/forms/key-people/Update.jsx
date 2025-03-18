import React, { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

const Update = ({ people, onSubmit, SetIsUpdating }) => {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      people: people.keyPeople,
    },
  });

  useEffect(() => {
    reset({ people: people.keyPeople });
  }, [people, reset]);

  const { fields } = useFieldArray({
    control,
    name: "people",
  });

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit(data, "update"))}
      className="scl-inine-form"
    >
      {fields.map((field, index) => {
        return (
          <fieldset
            className="govuk-fieldset scl-inine-form__fieldset"
            key={`${field.name}-${index}`}
          >
            <legend className="govuk-fieldset__legend govuk-fieldset__legend--s">
              <h2 className="govuk-fieldset__heading">Update: {field.name}</h2>
            </legend>
            <label className="govuk-label" htmlFor="name">
              Name
            </label>
            {errors.people && (
              <p className="govuk-error-message">
                <span className="govuk-visually-hidden">Error:</span>
                {errors.people?.[index]?.name?.message}
              </p>
            )}
            <input
              className="govuk-input govuk-!-margin-bottom-4"
              id={`people.${index}.name`}
              type="text"
              {...register(`people.${index}.name`, {
                required: "Name is required",
              })}
            />
            <label className="govuk-label" htmlFor="role">
              Role
            </label>
            {errors.people && (
              <p className="govuk-error-message">
                <span className="govuk-visually-hidden">Error:</span>
                {errors.people?.[index]?.role?.message}
              </p>
            )}
            <input
              className="govuk-input govuk-!-margin-bottom-4"
              id="role"
              type="text"
              {...register(`people.${index}.role`, {
                required: "Role is required",
              })}
            />
            <input
              className="govuk-input govuk-!-margin-bottom-4"
              id={`people.${index}.id`}
              type="hidden"
              {...register(`people.${index}.id`)}
            />
          </fieldset>
        );
      })}

      <div className="govuk-!-margin-top-2">
        <button type="submit" className="govuk-button govuk-!-margin-right-2">
          Save
        </button>
        <button
          className="govuk-button govuk-button--secondary"
          onClick={() => SetIsUpdating(false)}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default Update;
