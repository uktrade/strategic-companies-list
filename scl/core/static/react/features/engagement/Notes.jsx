import React, { useEffect, useState, useRef } from "react";

import {
  TranscribeStreamingClient,
  StartStreamTranscriptionCommand,
} from "@aws-sdk/client-transcribe-streaming";
import { Readable } from "readable-stream";

import ApiProxy from "../../proxy";

import Card from "../../components/Card";
import LoadingSpinner from "../../components/Spinner";
import SectionActions from "../../components/SectionActions";
import NotificationBanner from "../../components/NotificationBanner";

import Create from "../../forms/notes/Create";
import Update from "../../forms/notes/Update";

const Notes = ({
  csrf_token,
  data,
  isUpdatingEngagement,
  setIsUpdatingNotes,
}) => {
  const [notes, setNotes] = useState(data.notes);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [hasFinalisedTranscription, setHasFinalisedTranscription] =
    useState(false);
  const [partialTranscription, setPartialTranscription] = useState("");
  const [finalTranscription, setFinalTranscription] = useState("");
  const stream = useRef(null);
  const client = useRef(null);
  const isRecording = useRef(null);

  setIsUpdatingNotes(isCreating || isUpdating)

  const ENDPOINT = `/api/v1/engagement/${data.id}/note`;

  useEffect(() => {
    client.current = new TranscribeStreamingClient({
      region: "eu-west-2",
      credentials: async function () {
        const response = await (
          await fetch("/api/v1/aws-temporary-credentials")
        ).json();
        const credentials = {
          accessKeyId: response.AccessKeyId,
          secretAccessKey: response.SecretAccessKey,
        };
        if (!!response.SessionToken && !!response.Expiration) {
          credentials.sessionToken = response.SessionToken;
          credentials.expiration = new Date(Date.parse(response.Expiration));
        }
        return credentials;
      },
    });
  }, []);

  useEffect(() => {
    if (isTranscribing) {
      startRecording();
    } else {
      stopRecording();
    }
  }, [isTranscribing]);

  useEffect(() => {
    setFinalTranscription("");
    setPartialTranscription("");
  }, [isCreating, isUpdating]);

  const handleOnTranscribe = async (e) => {
    e.preventDefault();
    setIsTranscribing(!isTranscribing);
  };

  async function stopRecording() {
    if (stream.current) {
      console.log("Stopped transcribing...");
      isRecording.current = false;
      stream.current.getTracks()[0].stop();
    }
  }

  async function startRecording() {
    console.log("Started transcribing...");
    isRecording.current = true;

    const audioContext = new AudioContext({ sampleRate: 16000 });
    const newStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    stream.current = newStream;

    const input = audioContext.createMediaStreamSource(stream.current);
    const processor = audioContext.createScriptProcessor(1024, 1, 1);
    input.connect(processor);
    processor.connect(audioContext.destination);

    const readableStream = Readable();

    processor.onaudioprocess = (e) => {
      const float32Array = e.inputBuffer.getChannelData(0);
      const int16Array = new Int16Array(float32Array.length);
      for (let i = 0; i < float32Array.length; i++) {
        int16Array[i] =
          float32Array[i] < 0
            ? float32Array[i] * 0x8000
            : float32Array[i] * 0x7fff;
      }
      readableStream.emit("audioData", new Int8Array(int16Array.buffer));
    };

    const audioStream = async function* () {
      while (isRecording.current) {
        const chunk = await new Promise((resolve) =>
          readableStream.once("audioData", resolve)
        );
        if (chunk === null) break;
        yield { AudioEvent: { AudioChunk: chunk } };
      }
    };

    const command = new StartStreamTranscriptionCommand({
      LanguageCode: "en-GB",
      MediaSampleRateHertz: 16000,
      MediaEncoding: "pcm",
      EnablePartialResultsStabilization: true,
      PartialResultsStability: "low",
      AudioStream: audioStream(),
    });

    const response = await client.current.send(command);
    for await (const event of response.TranscriptResultStream) {
      if (event.TranscriptEvent) {
        const results = event.TranscriptEvent.Transcript.Results;
        results.forEach((result) => {
          const transcriptChunk = (result.Alternatives || []).map(
            (alternative) => {
              return alternative.Transcript;
            }
          )[0];

          if (result.IsPartial) {
            setHasFinalisedTranscription(false);
            setPartialTranscription(transcriptChunk);
          } else {
            setHasFinalisedTranscription(true);
            setPartialTranscription("");
            setFinalTranscription((p) => `${p} ${transcriptChunk}`.trim());
          }
        });
      }
    }
  }

  const resetState = () => {
    setIsLoading(false);
    setIsUpdating(false);
    setIsCreating(false);
  };

  const onSubmit = async (payload, method) => {
    setIsLoading(true);
    if (method === "create") {
      const { data, status } = await ApiProxy.post(
        ENDPOINT,
        payload,
        csrf_token
      );

      resetState();

      if (status === 200) {
        setNotes(data.data);
        setNotification({ message: "Business intelligence added" });
      } else {
        setNotification({
          message: `Status ${status}: ${data.message || data.error}`,
          status: "warning",
        });
      }
    }
    if (method === "update") {
      const { data, status } = await ApiProxy.update(
        ENDPOINT,
        payload,
        csrf_token
      );

      resetState();

      if (status === 200) {
        setNotes(data.data);
        setNotification({ message: "Business intelligence updated" });
      } else {
        setNotification({
          message: `Status ${status}: ${data.message || data.error}`,
          status: "warning",
        });
      }
    }
  };

  const onDelete = async (noteId) => {
    setIsLoading(true);
    const { data, status } = await ApiProxy.delete(
      ENDPOINT,
      { id: noteId },
      csrf_token
    );

    resetState();

    if (status === 200) {
      setNotes(data.data);
      setNotification({ message: "Business intelligence deleted" });
    } else {
      setNotification({
        message: `Status ${status}: ${data.message || data.error}`,
        status: "warning",
      });
    }
  };

  return (
    <>
      {!isCreating && !isUpdating && !isUpdatingEngagement && (
        <>
          <h2 className="govuk-heading-m govuk-!-margin-top-8">
            Business intelligence
          </h2>
          <p className="govuk-body">
          Only you can add or view information in this section.
          </p>
          <hr className="govuk-section-break govuk-section-break--m govuk-section-break--visible govuk-!-margin-top-4" />
        </>
      )}
      <LoadingSpinner isLoading={isLoading}>
        <NotificationBanner
          message={notification?.message}
          status={notification?.status}
        />
        {!isCreating &&
          !isUpdating &&
          !isUpdatingEngagement &&
          (notes.length ? (
            notes.map((note) => (
              <Card key={note.noteId} className="govuk-!-margin-bottom-4">
                <p className="govuk-body">{note.contents}</p>
              </Card>
            ))
          ) : (
            <p className="govuk-body">
              This engagement has no business intelligence recorded.
            </p>
          ))}
      </LoadingSpinner>
      {isCreating && (
        <Create
          onSubmit={onSubmit}
          setIsCreating={setIsCreating}
          transcript={finalTranscription}
          partialTranscript={partialTranscription}
          handleOnTranscribe={handleOnTranscribe}
          isTranscribing={isTranscribing}
          hasFinalisedTranscription={hasFinalisedTranscription}
        />
      )}
      {isUpdating && (
        <Update
          data={notes}
          onSubmit={onSubmit}
          onDelete={onDelete}
          setIsUpdating={setIsUpdating}
        />
      )}
      {!isCreating && !isUpdating && !isUpdatingEngagement && (
        <SectionActions
          addLabel="Add business intelligence"
          showEdit={Boolean(notes.length)}
          editLabel="Edit business intelligence"
          setIsCreating={() => setIsCreating(!isCreating)}
          setIsUpdating={() => setIsUpdating(!isUpdating)}
        />
      )}
    </>
  );
};

export default Notes;
