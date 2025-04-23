import React, { useContext } from "react";

import { useForm } from "react-hook-form";
import TranscriptButton from "../../components/TranscriptButton";
import { FlagContext } from "../../providers";
import { AWS_TRANSCRIBE } from "../../constants";

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
    watch,
    formState: { errors },
  } = useForm();

  const flags = useContext(FlagContext);

  
  const hasAwsTranscribe = flags.filter((flag) => flag["AWS_TRANSCRIBE"])[0].AWS_TRANSCRIBE;

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
          <button
            type="submit"
            disabled={isTranscribing && !hasFinalisedTranscription}
            className="govuk-button govuk-!-margin-right-3"
          >
            Save
          </button>
          {hasAwsTranscribe && (
            <TranscriptButton
              className="govuk-!-margin-right-4"
              onClick={handleOnTranscribe}
              isTranscribing={isTranscribing}
              disabled={isTranscribing && !hasFinalisedTranscription}
            />
          )}
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
