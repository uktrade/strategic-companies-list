import { TranscribeStreamingClient, StartStreamTranscriptionCommand } from "@aws-sdk/client-transcribe-streaming";
import { Readable } from 'readable-stream'

document.addEventListener("DOMContentLoaded", () => {
  const client = new TranscribeStreamingClient({region: "eu-west-2", credentials: {
    accessKeyId: "",
    secretAccessKey: ""
  }});

  const recordButton = document.getElementById("record");
  const finalOutput = document.getElementById("final-output");
  const partialOutput = document.getElementById("partial-output");


  let isRecording = false;

  // var processor = null;
  var stream = null;


  async function stopRecording() {
    isRecording = false;
    recordButton.classList.toggle('scl-ready-to-record', !isRecording);
    recordButton.classList.toggle('scl-recording', isRecording);
    // audioContext.suspend();

    // if (processor && input) input.disconnect(procesor);
    // After a few seconds, removes the recording icon(s) from the browser UI
    stream.getTracks()[0].stop();
  }

  async function startRecording() {
    isRecording = true;
    recordButton.classList.toggle('scl-ready-to-record', !isRecording);
    recordButton.classList.toggle('scl-recording', isRecording);

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
        });
      }
    }
  }

  recordButton.addEventListener("click", () => {
    if (isRecording) stopRecording();
    else startRecording();
  });
});