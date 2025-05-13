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
      people: data,
    },
  });

  useEffect(() => {
    reset({ people: data });
  }, [data, reset]);

  const { fields } = useFieldArray({
    control,
    name: "people",
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
                  onClick={() => onDelete(field.userId)}
                >
                  Delete
                </a>

                <fieldset
                  className="govuk-fieldset"
                  key={`${field.name}-${index}`}
                >
                  <legend className="govuk-fieldset__legend govuk-fieldset__legend--s">
                    <h2 className="govuk-fieldset__heading">
                      Update: {field.name}
                    </h2>
                  </legend>
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
                    id={`people.${index}.role`}
                    type="text"
                    {...register(`people.${index}.role`, {
                      required: "Role is required",
                    })}
                  />
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
                  <label className="govuk-label" htmlFor="email">
                    Email
                  </label>
                  {errors && (
                    <p className="govuk-error-message">
                      <span className="govuk-visually-hidden">Error:</span>
                      {errors.people?.[index]?.email?.message}
                    </p>
                  )}
                  <input
                    className="govuk-input govuk-!-margin-bottom-4"
                    id={`people.${index}.email`}
                    type="text"
                    {...register(`people.${index}.email`, {
                      required: "Email is required",
                    })}
                  />
                  <label className="govuk-label" htmlFor="email">
                    Email
                  </label>
                  {errors && (
                    <p className="govuk-error-message">
                      <span className="govuk-visually-hidden">Error:</span>
                      {errors.people?.[index]?.email?.message}
                    </p>
                  )}
                  <input
                    className="govuk-input govuk-!-margin-bottom-4"
                    id={`people.${index}.email`}
                    type="text"
                    {...register(`people.${index}.email`, {
                      required: "Email is required",
                    })}
                  />
                  <input
                    id={`people.${index}.id`}
                    type="hidden"
                    {...register(`people.${index}.id`)}
                  />
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
              id="cancel-edit-key-person"
              onClick={() => setIsUpdating(false)}
              type="button"
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
