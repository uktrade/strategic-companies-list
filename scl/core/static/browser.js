import { TranscribeStreamingClient, StartStreamTranscriptionCommand } from "@aws-sdk/client-transcribe-streaming";
import { Readable } from 'readable-stream'

(() => {
  // One client shared with all buttons
  const client = new TranscribeStreamingClient({
    region: "eu-west-2",
    credentials: (async function() {
      const response = await (await fetch('/api/v1/aws-credentials')).json()
      const credentials = {
        accessKeyId: response.AccessKeyId,
        secretAccessKey: response.SecretAccessKey,
      }
      if (!!response.SessionToken && !!response.Expiration) {
        credentials.sessionToken = response.SessionToken;
        credentials.expiration = new Date(Date.parse(response.Expiration));
      }
      return credentials;
    })
  });

  const htmlToNodes = (html) => {
    const template = document.createElement('template');
    template.innerHTML = html;
    return template.content.childNodes;
  }

  const registerTranscriptionButton = (recordButton) => {
    const target = document.querySelector(recordButton.getAttribute("data-scl-transcription-target"));

    target.replaceChildren(
      ...htmlToNodes(
        '<p class="govuk-body scl-key-list__item_body scl-transcription__content" data-scl-transcript-target="notes"><span class="scl-transcription-target__final-output" data-module="transcript-output"></span><span class="scl-transcription-target__partial-output">&nbsp;</span></p><div class="scl-key-list__item_body"></div>'
      )
    );

    const finalOutput = target.querySelector('.scl-transcription-target__final-output');
    const partialOutput = target.querySelector('.scl-transcription-target__partial-output');

    let isRecording = false;
    var stream = null;

    function setClasses() {
      recordButton.classList.toggle('scl-button--recording-paused', !isRecording);
      recordButton.classList.toggle('scl-button--recording-active', isRecording);
      partialOutput.classList.toggle('scl-transcription-target__partial-output--recording', isRecording);
    }

    async function stopRecording() {
      isRecording = false;
      setClasses();
      // After a few seconds, removes the recording icon(s) from the browser UI
      stream.getTracks()[0].stop();
    }

    async function startRecording() {
      isRecording = true;
      setClasses();
      target.classList.add('scl-transcription-target--with-content');

      const audioContext = new AudioContext({sampleRate: 16000});
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      const input = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(1024, 1, 1);
      input.connect(processor);
      processor.connect(audioContext.destination);

      const readableStream = Readable();

      processor.onaudioprocess = (e) => {
          const float32Array = e.inputBuffer.getChannelData(0);
          const int16Array = new Int16Array(float32Array.length);
          for (let i = 0; i < float32Array.length; i++) {
            int16Array[i] = float32Array[i] < 0 ? (float32Array[i] * 0x8000) : (float32Array[i] * 0x7fff);
          }
          readableStream.emit('audioData', new Int8Array(int16Array.buffer));
      };

      const audioStream = async function* () {
        while (isRecording) {
          const chunk = await new Promise(resolve => readableStream.once('audioData', resolve));
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
      const response = await client.send(command);

      for await (const event of response.TranscriptResultStream) {
        if (event.TranscriptEvent) {
          const results = event.TranscriptEvent.Transcript.Results;
          results.forEach((result) => {
            const transcript = (result.Alternatives || []).map((alternative) => {
              return alternative.Transcript;
            })[0];
            if (result.IsPartial) {
              partialOutput.innerText = ' ' + transcript;
            } else {
              finalOutput.innerText = (finalOutput.innerText || '') + ' ' + transcript;
              partialOutput.innerText = '';
            }
            if (transcript != '') {
              partialOutput.classList.add("scl-transcription-target__partial-output--with-text");
            }
          });
        }
      }
    }

    recordButton.addEventListener("click", () => {
      if (isRecording) stopRecording();
      else startRecording();
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('[data-module="scl-transcription-button"]').forEach(registerTranscriptionButton);
  });
})();
