import React, { useContext } from "react";

import { useForm } from "react-hook-form";
import TranscriptButton from "../../components/TranscriptButton";
import { GlobalContext } from "../../providers";
import { AWS_TRANSCRIBE } from "../../constants";
import { isFeatureFlagActive } from "../../utils";

const Create = ({
  onSubmit,
  setIsCreating,
  transcript,
  handleOnTranscribe,
  isTranscribing,
  partialTranscript,
  hasFinalisedTranscription,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  const { featureFlags } = useContext(GlobalContext);

  const isAWSTranscribeActive = isFeatureFlagActive(featureFlags, AWS_TRANSCRIBE)

  setValue("contents", transcript + " " + partialTranscript);

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
        {isAWSTranscribeActive && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <TranscriptButton
              className="govuk-!-margin-bottom-2"
              onClick={handleOnTranscribe}
              isTranscribing={isTranscribing}
              disabled={isTranscribing && !hasFinalisedTranscription}
            />
          </div>
        )}
        <textarea
          className="govuk-textarea govuk-!-margin-bottom-4"
          id="contents"
          type="text"
          rows="5"
          {...register("contents", {
            required: "Contents are required",
            validate: (value) => value.trim() !== "" || "Contents are required",
          })}
        ></textarea>

        <div className="govuk-!-margin-top-2">
          <button
            type="submit"
            disabled={isTranscribing && !hasFinalisedTranscription}
            className="govuk-button govuk-!-margin-right-3"
          >
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
