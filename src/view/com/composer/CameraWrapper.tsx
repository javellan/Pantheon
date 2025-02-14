import React, { useRef, useState } from "react";
import { View, Platform, TouchableOpacity, TextInput, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const isWeb = Platform.OS === "web";

let Camera: any, useCameraDevice: any, useCameraPermission: any, useMicrophonePermission: any;
if (!isWeb) {
  const visionCamera = require("react-native-vision-camera");
  Camera = visionCamera.Camera;
  useCameraDevice = visionCamera.useCameraDevice;
  useCameraPermission = visionCamera.useCameraPermission;
  useMicrophonePermission = visionCamera.useMicrophonePermission;
}

interface CameraWrapperProps {
  onVideoRecorded: (videoPath: string) => void;
}

const CameraWrapper: React.FC<CameraWrapperProps> = ({ onVideoRecorded }) => {
  const camera = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [mode, setMode] = useState<string>("PHOTO"); // Default mode is PHOTO
  const [videoDuration, setVideoDuration] = useState<number>(60); // Default to 60s
  const [text, setText] = useState<string>("");

  const device = isWeb ? null : useCameraDevice("back");
  const { hasPermission: camPermission, requestPermission: requestCamPermission } = isWeb
    ? { hasPermission: true, requestPermission: async () => {} }
    : useCameraPermission();
  const { hasPermission: micPermission, requestPermission: requestMicPermission } = isWeb
    ? { hasPermission: true, requestPermission: async () => {} }
    : useMicrophonePermission();

  if (!isWeb) {
    if (!camPermission) requestCamPermission();
    if (!micPermission) requestMicPermission();
  }

  const startRecording = async () => {
    if (mode === "TEXT") return;
    if (isWeb) {
      recordedChunks.current = [];
      if (!mediaStream.current) return;
      mediaRecorder.current = new MediaRecorder(mediaStream.current, { mimeType: "video/webm" });
      mediaRecorder.current.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) recordedChunks.current.push(event.data);
      };
      mediaRecorder.current.onstop = saveRecording;
      mediaRecorder.current.start();
      setIsRecording(true);
      setTimeout(stopRecording, videoDuration * 1000);
    } else {
      if (!camera.current) return;
      if (isRecording) {
        setIsRecording(false);
        await camera.current.stopRecording();
        return;
      }
      setIsRecording(true);
      camera.current.startRecording({
        maxDuration: videoDuration,
        onRecordingFinished: (video: { path: string }) => {
          onVideoRecorded(video.path);
        },
        onRecordingError: (error: Error) => console.error(error),
      });
    }
  };

  const stopRecording = () => {
    if (isWeb && mediaRecorder.current) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const saveRecording = () => {
    const blob = new Blob(recordedChunks.current, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    onVideoRecorded(url);
  };

  return (
    <View style={{ flex: 1 }}>
      {mode === "TEXT" ? (
        <TextInput
          style={{ flex: 1, padding: 20, fontSize: 18 }}
          multiline
          placeholder="Write something..."
          value={text}
          onChangeText={setText}
        />
      ) : isWeb ? (
        <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : Camera && device && camPermission && micPermission ? (
        <Camera ref={camera} style={{ position: "absolute", width: "100%", height: "100%" }} device={device} isActive={true} video={true} audio={true} />
      ) : (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Ionicons name="alert-circle" size={50} color="red" />
        </View>
      )}

      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          position: "absolute",
          bottom: 100,
          alignSelf: "center",
          marginBottom: 50
        }}
      >
        {["3m", "60s", "15s", "PHOTO", "TEXT"].map((label) => (
          <TouchableOpacity
            key={label}
            onPress={() => {
              setMode(label);
              if (label === "3m") setVideoDuration(600);
              else if (label === "60s") setVideoDuration(60);
              else if (label === "15s") setVideoDuration(15);
            }}
            style={{ margin: 5, padding: 10, backgroundColor: mode === label ? "black" : "transparent", borderRadius: 15 }}
          >
            <Text style={{ color: "white" }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode !== "TEXT" && (
        <View
          style={{
            position: "absolute",
            bottom: 20,
            alignSelf: "center",
          }}
        >
          <TouchableOpacity onPress={startRecording} style={{ padding: 20 }}>
            <Ionicons name={isRecording ? "stop-circle" : "radio-button-on"} size={100} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default CameraWrapper;
