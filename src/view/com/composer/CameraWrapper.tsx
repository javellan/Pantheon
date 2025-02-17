import React, { useRef, useState, useEffect } from "react";
import { View, Platform, TouchableOpacity, TextInput, Text, Image } from "react-native";
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
  onPhotoCaptured?: (photoPath: string) => void;
  onVideoRecorded?: (videoPath: string) => void;
}

const CameraWrapper: React.FC<CameraWrapperProps> = ({
  onPhotoCaptured = () => {},
  onVideoRecorded = () => {},
}) => {
  const camera = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [mode, setMode] = useState<string>("PHOTO");
  const [videoDuration, setVideoDuration] = useState<number>(60);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [text, setText] = useState<string>("");
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(false);
  const [hasMicrophonePermission, setHasMicrophonePermission] = useState<boolean>(false);

  const device = isWeb ? null : useCameraDevice("back");
  const { hasPermission: camPermission, requestPermission: requestCamPermission } = isWeb
    ? { hasPermission: hasCameraPermission, requestPermission: () => {} }
    : useCameraPermission();
  const { hasPermission: micPermission, requestPermission: requestMicPermission } = isWeb
    ? { hasPermission: hasMicrophonePermission, requestPermission: () => {} }
    : useMicrophonePermission();

  useEffect(() => {
    if (isWeb) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          videoRef.current!.srcObject = stream;
          setHasCameraPermission(true);
          setHasMicrophonePermission(true);
        })
        .catch((error) => {
          console.warn("Error accessing media devices: ", error);
        });
    }
  }, []);

  if (!isWeb) {
    if (!camPermission) {
      requestCamPermission().then((granted: boolean) => {
        if (!granted) {
          console.warn("Camera permission denied.");
        }
      });
    }
    if (!micPermission) {
      requestMicPermission().then((granted: boolean) => {
        if (!granted) {
          console.warn("Microphone permission denied.");
        }
      });
    }
  }

  console.log("Camera Ready:", Camera, device, camPermission, micPermission);

  if (!device) {
    console.warn("No camera device found.");
  }

  const handleCameraAction = async () => {
    if (mode === "TEXT") return;

    if (isWeb) {
      if (mode === "PHOTO") {
        const canvas = document.createElement("canvas");
        const videoElement = videoRef.current;
        if (videoElement) {
          canvas.width = videoElement.videoWidth;
          canvas.height = videoElement.videoHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            const photoUrl = canvas.toDataURL("image/png");
            setCapturedPhoto(photoUrl);
            onPhotoCaptured(photoUrl);
          }
        }
        return;
      }
    } else {
      if (!camera.current) return;

      if (mode === "PHOTO") {
        try {
          const photo = await camera.current.takePhoto();
          const photoUri = `file://${photo.path}`;
          console.log("Captured photo URI:", photoUri);
          setCapturedPhoto(photoUri);
          onPhotoCaptured(photoUri);
        } catch (error) {
          console.error("Error capturing photo:", error);
        }
        return;
      }

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
      ) : capturedPhoto ? (
        <Image source={{ uri: capturedPhoto }} style={{ width: "100%", height: "100%" }} />
      ) : isWeb ? (
        <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : Camera && device && camPermission && micPermission ? (
        <Camera
          ref={camera}
          style={{ flex: 1 }}
          device={device}
          isActive={true}
          video={true}
          audio={true}
          photo={true}
        />
      ) : (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Ionicons name="alert-circle" size={50} color="red" />
          <Text style={{ color: "white", marginTop: 10 }}>Camera not available</Text>
        </View>
      )}

      <View style={{ flexDirection: "row", justifyContent: "center", position: "absolute", bottom: 100, alignSelf: "center", marginBottom: 50 }}>
        {["3m", "60s", "15s", "PHOTO", "TEXT"].map((label) => (
          <TouchableOpacity
            key={label}
            onPress={() => {
              setMode(label);
              setCapturedPhoto(null);
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
        <View style={{ position: "absolute", bottom: 20, alignSelf: "center" }}>
          <TouchableOpacity onPress={handleCameraAction} style={{ padding: 20 }}>
            <Ionicons name={isRecording ? "stop-circle" : "radio-button-on"} size={100} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default CameraWrapper;
