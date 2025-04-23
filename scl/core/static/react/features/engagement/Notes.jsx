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
import Create from "../../forms/notes/Create";
import Update from "../../forms/notes/Update";

const Notes = ({
  csrf_token,
  data,
  showUpdateNotification,
  isUpdatingNotes,
  setIsUpdatingNotes,
  setIsCreatingNotes,
  isCreatingNotes,
}) => {
  const [notes, setNotes] = useState(data.notes);
  const [isLoading, setIsLoading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [hasFinalisedTranscription, setHasFinalisedTranscription] =
    useState(false);
  const [partialTranscription, setPartialTranscription] = useState("");
  const [finalTranscription, setFinalTranscription] = useState("");
  const stream = useRef(null);
  const client = useRef(null);
  const isRecording = useRef(null);

  const ENDPOINT = `/api/v1/engagement/${data.id}/note`;

  useEffect(() => {
    client.current = new TranscribeStreamingClient({
      region: "eu-west-2",
      credentials: async function () {
        const response = await (await fetch("/api/v1/aws-temporary-credentials")).json();
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
  }, [isCreatingNotes]);

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

  const onSubmit = async (payload, method) => {
    if (method === "create") {
      setIsLoading(true);
      const { data, status } = await ApiProxy.post(
        ENDPOINT,
        payload,
        csrf_token
      );
      setNotes(data.data);
      setIsLoading(false);
      setIsCreatingNotes(false);
      showUpdateNotification("Note added");
    }
    if (method === "update") {
      setIsLoading(true);
      const { data, status } = await ApiProxy.update(
        ENDPOINT,
        payload,
        csrf_token
      );
      setNotes(data.data);
      setIsLoading(false);
      setIsUpdatingNotes(false);
      showUpdateNotification("Note updated");
    }
  };

  const onDelete = async (noteId) => {
    setIsLoading(true);
    const { data, status } = await ApiProxy.delete(
      ENDPOINT,
      { id: noteId },
      csrf_token
    );
    setNotes(data.data);
    if (data.data.length <= 0) {
      setIsUpdatingNotes(false);
      setIsCreatingNotes(false);
    }
    setIsLoading(false);
    showUpdateNotification("Note deleted");
  };

  return (
    <>
      {!isCreatingNotes && !isUpdatingNotes && (
        <>
          <h2 className="govuk-heading-m govuk-!-margin-top-8">Notes</h2>
          <hr className="govuk-section-break govuk-section-break--m govuk-section-break--visible govuk-!-margin-top-4" />
        </>
      )}
      <LoadingSpinner isLoading={isLoading}>
        {!isCreatingNotes &&
          !isUpdatingNotes &&
          (notes.length ? (
            notes.map((note) => (
              <Card key={note.noteId} className="govuk-!-margin-bottom-4">
                <p className="govuk-body">{note.contents}</p>
              </Card>
            ))
          ) : (
            <p className="govuk-body">You currently have no notes.</p>
          ))}
      </LoadingSpinner>
      {isCreatingNotes && (
        <Create
          onSubmit={onSubmit}
          setIsCreating={setIsCreatingNotes}
          transcript={finalTranscription}
          partialTranscript={partialTranscription}
          handleOnTranscribe={handleOnTranscribe}
          isTranscribing={isTranscribing}
          hasFinalisedTranscription={hasFinalisedTranscription}
        />
      )}
      {isUpdatingNotes && (
        <Update
          data={notes}
          onSubmit={onSubmit}
          onDelete={onDelete}
          setIsUpdating={setIsUpdatingNotes}
        />
      )}
      {!isCreatingNotes && !isUpdatingNotes && (
        <SectionActions
          addLabel="Add note"
          showEdit={Boolean(notes.length)}
          editLabel={`Edit ${notes.length > 1 ? "notes" : "note"}`}
          setIsCreating={() => setIsCreatingNotes(!isCreatingNotes)}
          setIsUpdating={() => setIsUpdatingNotes(!isUpdatingNotes)}
        />
      )}
    </>
  );
};

export default Notes;
