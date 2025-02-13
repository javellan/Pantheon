import React, { useRef, useState } from "react";
import { View, Platform, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const isWeb = Platform.OS === "web";

// Lazy import only on Native platforms
let Camera: any, useCameraDevice: any, useCameraPermission: any, useMicrophonePermission: any;
if (!isWeb) {
  const visionCamera = require("react-native-vision-camera");
  Camera = visionCamera.Camera;
  useCameraDevice = visionCamera.useCameraDevice;
  useCameraPermission = visionCamera.useCameraPermission;
  useMicrophonePermission = visionCamera.useMicrophonePermission;
}

const CameraWrapper: React.FC<{ onVideoRecorded: (uri: string) => void }> = ({ onVideoRecorded }) => {
  const camera = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);

  // Hooks must be inside the component!
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

  const startWebCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      mediaStream.current = stream;
    } catch (error) {
      console.error("WebRTC Error:", error);
    }
  };

  const stopWebCamera = () => {
    mediaStream.current?.getTracks().forEach((track) => track.stop());
  };

  const startRecording = async () => {
    if (isWeb) {
      recordedChunks.current = [];
      mediaRecorder.current = new MediaRecorder(mediaStream.current!, { mimeType: "video/webm" });

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = saveRecording;
      mediaRecorder.current.start();
      setIsRecording(true);
    } else {
      if (!camera.current) return;
      if (isRecording) {
        setIsRecording(false);
        await camera.current.stopRecording();
        return;
      }

      setIsRecording(true);
      camera.current.startRecording({
        onRecordingFinished: (video: { path: string }) => {
          setVideoUri(video.path);
          onVideoRecorded(video.path);
        },
        onRecordingError: (error: any) => console.error(error),
      });
    }
  };

  const saveRecording = () => {
    const blob = new Blob(recordedChunks.current, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    setVideoUri(url);
    onVideoRecorded(url);
  };

  return (
    <View style={{ flex: 1 }}>
      {isWeb ? (
        <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : Camera && device && camPermission && micPermission ? (
        <Camera
          ref={camera}
          style={{ position: "absolute", width: "100%", height: "100%" }}
          device={device}
          isActive={true}
          video={true}
          audio={true}
        />
      ) : (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Ionicons name="alert-circle" size={50} color="red" />
        </View>
      )}

      <View style={{ flex: 1, justifyContent: "flex-end", alignItems: "center", marginBottom: 20 }}>
        <TouchableOpacity onPress={startRecording} style={{ padding: 20 }}>
          <Ionicons name={isRecording ? "stop-circle" : "radio-button-on"} size={100} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CameraWrapper;
