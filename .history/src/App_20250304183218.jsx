import React, { useRef, useState } from "react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import styled, { keyframes } from "styled-components";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f4f4f4;
  padding: 10px;
  box-sizing: border-box;
  width: 100vw;

  @media (max-width: 768px) {
    padding: 5px;
  }

  @media (max-width: 480px) {
    padding: 0;
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 20px;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 2rem;
  }

  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

const oscillation = keyframes`
  0% {
    transform: scaleX(1) scaleY(1);
  }
  25% {
    transform: scaleX(1.2) scaleY(1.1);
  }
  50% {
    transform: scaleX(1) scaleY(1);
  }
  75% {
    transform: scaleX(0.9) scaleY(1.1);
  }
  100% {
    transform: scaleX(1) scaleY(1);
  }
`;

const MicrophoneButton = styled.div.attrs((props) => ({
  "data-is-recording": props.isRecording ? "true" : "false",
}))`
  width: 120px;
  height: 120px;
  background-color: #ff5733;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  transition: background-color 0.3s ease;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    width: 100px;
    height: 100px;
  }

  @media (max-width: 480px) {
    width: 80px;
    height: 80px;
  }

  &:hover {
    background-color: #ff3b00;
  }

  &::after {
    content: "";
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 10px;
    background-color: #ff5733;
    border-radius: 5px;
    animation: ${(props) => (props.isRecording ? oscillation : "none")} 0.5s
      infinite;
  }
`;

const AudioPlayer = styled.div`
  margin-top: 20px;
  width: 100%;
  max-width: 90%;
  text-align: center;

  audio {
    width: 100%;
    border-radius: 8px;
  }
`;

const TranscriptionSection = styled.section`
  margin-top: 40px;
  width: 100%;
  max-width: 90%;
  background-color: #ffffff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  font-size: 1.2rem;
  color: #333;

  @media (max-width: 768px) {
    padding: 15px;
    font-size: 1rem;
  }

  @media (max-width: 480px) {
    padding: 10px;
    font-size: 0.9rem;
  }
`;

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [transla, setTranscription] = useState("");
  const [permissionGranted, setPermissionGranted] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);

  const startRecording = () => {
    setIsRecording(true);
    audioChunks.current = [];

    if (permissionGranted === null) {
      requestMicrophonePermission();
    } else {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          startAudioRecording(stream);
        })
        .catch((error) => {
          setPermissionGranted(false);
          console.error("Permission denied:", error);
          alert("Vous devez autoriser l'accès au microphone pour enregistrer.");
        });
    }
  };

  const requestMicrophonePermission = () => {
    console.log("Requesting microphone permission...");
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        setPermissionGranted(true);
        console.log("Microphone permission granted.");
        startAudioRecording(stream);
      })
      .catch((error) => {
        setPermissionGranted(false);
        console.error("Permission denied:", error);
        alert("Vous devez autoriser l'accès au microphone pour enregistrer.");
      });
  };

  const startAudioRecording = (stream) => {
    console.log("Starting audio recording...");
    mediaRecorderRef.current = new MediaRecorder(stream);
    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunks.current.push(event.data);
      console.log("Audio chunk recorded.");
    };
    mediaRecorderRef.current.onstop = () => {
      console.log("Recording stopped.");
      const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" });
      setAudioBlob(audioBlob);
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(audioUrl);
      sendAudioToAPI(audioBlob);
    };
    mediaRecorderRef.current.start(1000);
    console.log("Audio recording started.");
  };

  const stopRecording = () => {
    console.log("Stopping audio recording...");
    setIsRecording(false);
    mediaRecorderRef.current.stop();
  };

  const toggleRecording = () => {
    isRecording ? stopRecording() : startRecording();
  };
  function encodeWav(audioBuffer) {
    const numOfChan = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const dataSize = audioBuffer.length * numOfChan * 2;
    const length = dataSize + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);

    // Écriture du header WAV
    writeString(view, 0, "RIFF");
    view.setUint32(4, length - 8, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numOfChan, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numOfChan * 2, true);
    view.setUint16(32, numOfChan * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, "data");
    view.setUint32(40, dataSize, true);

    // Convertir l'audio en PCM intercalé
    const interleaved = interleave(audioBuffer);

    let offset = 44; // ✅ Initialisation correcte
    for (let i = 0; i < interleaved.length; i++) {
      view.setInt16(offset, interleaved[i] * 0x7fff, true);
      offset += 2;
    }

    return new Blob([buffer], { type: "audio/wav" });
  }

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  function interleave(audioBuffer) {
    const numOfChan = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numOfChan;
    const result = new Float32Array(length);

    for (let i = 0, j = 0; i < audioBuffer.length; i++) {
      for (let ch = 0; ch < numOfChan; ch++, j++) {
        result[j] = audioBuffer.getChannelData(ch)[i];
      }
    }

    return result;
  }

  async function blobToWav(blob) {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Convertir en WAV
    const wavBlob = encodeWav(audioBuffer);
    return wavBlob;
  }
  const sendAudioToAPI = async (audioBlob) => {
    console.log("Sending audio to API...");
    const formData = new FormData();
    const audioWav = await blobToWav(audioBlob);
    formData.append("file", audioWav, "audio.wav");

    try {
      const response = await fetch(
        "https://multilingualvoice.vercel.app/transcribe/",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to transcribe the audio: ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("API response received:", result);
      setTranscription(result.transcription);
      console.log("Transcription:", result.transcription);
    } catch (error) {
      console.error("Error during API call:", error);
    }
  };

  return (
    <Container>
      <Title>Transcribe your recorded voice</Title>

      <MicrophoneButton onClick={toggleRecording} isRecording={isRecording}>
        {isRecording ? (
          <FaMicrophoneSlash size={40} color="white" />
        ) : (
          <FaMicrophone size={40} color="white" />
        )}
      </MicrophoneButton>

      {audioUrl && (
        <AudioPlayer>
          <audio controls src={audioUrl}></audio>
        </AudioPlayer>
      )}

      <TranscriptionSection>
        {transcription ? (
          <>
            <p>
              <strong>Transcription:</strong> {transcription}
            </p>
            <p>
              <strong>Traduction:</strong> {transcription}
            </p>
          </>
        ) : (
          <p>Enregistrement en cours... Patientez s'il vous plaît.</p>
        )}
      </TranscriptionSection>
    </Container>
  );
}

export default App;
