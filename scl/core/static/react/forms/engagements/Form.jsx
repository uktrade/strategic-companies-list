import React from "react";
import { transformValueToArray } from "../../utils";

const Form = ({
  data,
  method,
  onSubmit,
  handleSubmit,
  handleCancel,
  register,
  errors,
}) => (
  <form
    onSubmit={handleSubmit((data) => onSubmit(data, method))}
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

    <label className="govuk-label" htmlFor="engagement-type">
      Engagement type
    </label>
    {errors && (
      <p className="govuk-error-message">
        <span className="govuk-visually-hidden">Error:</span>
        {errors?.engagementType?.message}
      </p>
    )}
    <select
      className="govuk-select govuk-!-margin-bottom-4"
      defaultValue=""
      id="engagement-type"
      {...register("engagementType", {
        required: "Engagement type is required",
      })}
    >
      <option value="" disabled>
        Select engagement type
      </option>
      {data.engagement_type_options.map(option => {
        return (<option key={option} value={option}>{option}</option>)
      }
      )}
    </select>

    <label className="govuk-label" htmlFor="company-representatives">
      Who are you meeting from the company?
    </label>
    <div id="event-name-hint" className="govuk-hint">
      Separate your inputs with commas
    </div>
    {errors && (
      <p className="govuk-error-message">
        <span className="govuk-visually-hidden">Error:</span>
        {errors?.companyRepresentatives?.message}
      </p>
    )}
    <textarea
      className="govuk-textarea govuk-!-margin-bottom-4"
      id="company-representatives"
      type="text"
      rows="5"
      {...register("companyRepresentatives", {
        setValueAs: (value) => transformValueToArray(value),
        required: "Company representatives are required",
      })}
    ></textarea>

    <label className="govuk-label" htmlFor="civil-servants">
      Who will be there from the Civil Service?
    </label>
    <div id="event-name-hint" className="govuk-hint">
      Separate your inputs with commas
    </div>
    {errors && (
      <p className="govuk-error-message">
        <span className="govuk-visually-hidden">Error:</span>
        {errors?.civilServants?.message}
      </p>
    )}
    <textarea
      className="govuk-textarea govuk-!-margin-bottom-4"
      id="civil-servants"
      type="text"
      rows="5"
      {...register("civilServants", {
        setValueAs: (value) => transformValueToArray(value),
        required: "Civil servants are required",
      })}
    ></textarea>

    <label className="govuk-label" htmlFor="ministers">
      Which minister(s) will be present? (Optional)
    </label>
    <div id="event-name-hint" className="govuk-hint">
      Separate your inputs with commas
    </div>
    <textarea
      className="govuk-textarea govuk-!-margin-bottom-4"
      id="ministers"
      type="text"
      rows="5"
      {...register("ministers", {
        setValueAs: (value) => transformValueToArray(value),
      })}
    ></textarea>

    <label className="govuk-label" htmlFor="agenda">
      Agenda
    </label>
    {errors && (
      <p className="govuk-error-message">
        <span className="govuk-visually-hidden">Error:</span>
        {errors?.agenda?.message}
      </p>
    )}
    <textarea
      className="govuk-textarea govuk-!-margin-bottom-4"
      id="agenda"
      type="text"
      rows="5"
      {...register("agenda", {
        required: "Agenda is required",
      })}
    ></textarea>

    <label className="govuk-label" htmlFor="outcomes">
      Outcomes (Optional)
    </label>
    <textarea
      className="govuk-textarea govuk-!-margin-bottom-4"
      id="outcomes"
      type="text"
      rows="5"
      {...register("outcomes")}
    ></textarea>

    <label className="govuk-label" htmlFor="actions">
      Actions (Optional)
    </label>
    <textarea
      className="govuk-textarea govuk-!-margin-bottom-4"
      id="actions"
      type="text"
      rows="5"
      {...register("actions")}
    ></textarea>

    <div className="govuk-!-margin-top-2">
      <button type="submit" className="govuk-button govuk-!-margin-right-2">
        Save
      </button>
      <button
        type="button"
        className="govuk-button govuk-button--secondary"
        onClick={() => handleCancel(false)}
      >
        Cancel
      </button>
    </div>
  </form>
);

export default Form;
