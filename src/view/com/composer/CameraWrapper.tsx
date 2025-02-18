import React, { useRef, useState, useEffect, useCallback } from "react";
import { View, Platform, TouchableOpacity, TextInput, Text, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useComposerControls } from "#/state/shell";
import { compressVideo } from '../../../lib/media/video/compress';  // Adjust the import path as necessary
import { ImagePickerAsset } from "expo-image-picker";
import { atoms as a, useTheme } from '#/alf';


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
  onVideoRecorded?: (video: { videoAsset: ImagePickerAsset, compressedVideo: any }) => void; // Updated to include videoAsset
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
  const { closeComposer } = useComposerControls();

  const device = isWeb ? null : useCameraDevice("back");

  const aspectRatio = 9 / 16;
  const t = useTheme()

  const { hasPermission: camPermission, requestPermission: requestCamPermission } = isWeb
    ? { hasPermission: hasCameraPermission, requestPermission: () => {} }
    : useCameraPermission();
  const { hasPermission: micPermission, requestPermission: requestMicPermission } = isWeb
    ? { hasPermission: hasMicrophonePermission, requestPermission: () => {} }
    : useMicrophonePermission();

  const onClose = useCallback(() => {
    closeComposer();
  }, [closeComposer]);

  useEffect(() => {
    if (isWeb) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          const mediaStream = stream as MediaStream;
          videoRef.current!.srcObject = mediaStream;
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

  const handleCameraAction = async () => {
    if (mode === "TEXT") return;
  
    // Take Photo
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
        onRecordingFinished: async (video: { path: string }) => {
          // Reconstruct ImagePickerAsset
          const videoUri = video.path;
          const videoAsset: ImagePickerAsset = {
            uri: videoUri,
            width: 1920, // Default or dynamically get it
            height: 1080, // Default or dynamically get it
            type: "video", // This indicates it is a video
            fileName: videoUri.split('/').pop() ?? null,
            fileSize: 0, // You can populate this if you know the file size
            exif: null, // Optional, add if you want to provide EXIF data
          };
  
          console.log(videoAsset);
  
          // Compress the recorded video
          const compressedVideo = await compressVideo(videoAsset);
  
          // Pass both `videoAsset` and `compressedVideo` to onVideoRecorded
          onVideoRecorded({ videoAsset, compressedVideo });
  
          console.log(compressedVideo); // Log to check the output
        },
        onRecordingError: (error: Error) => console.error(error),
      });
    }
  };
  

  const closeCameraView = () => {
    if (isWeb) {
      const tracks = (videoRef.current?.srcObject as MediaStream)?.getTracks();
      tracks?.forEach((track: MediaStreamTrack) => track.stop());
    } else {
      if (camera.current) {
        if (isRecording) {
          setIsRecording(false);
          camera.current.stopRecording();
        }

        if (camera.current.isActive) {
          camera.current.pausePreview();
        }

        camera.current = null; // Reset camera reference
      }
    }
    onClose();
  };

  return (
    <View style={[
      a.w_full,
      a.rounded_sm,
      {aspectRatio},
      {marginTop: 20, marginBottom: 20},
      a.overflow_hidden,
      a.border,
      t.atoms.border_contrast_low,
      {backgroundColor: 'black', alignSelf: 'center'},
    ]}>
      {mode === "TEXT" ? (
        <TextInput
          style={{ flex: 1, padding: 20, fontSize: 18 }}
          multiline
          placeholder="Write something..."
          value={text}
          onChangeText={setText}
        />
      ) : capturedPhoto ? (
        <Image
          source={{ uri: capturedPhoto }}
          style={{
            width: "100%",
            height: "100%",
            resizeMode: "cover",
          }}
        />
      ) : isWeb ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{
            width: "auto",
            height: "100vh",
            objectFit: "cover",
            aspectRatio: aspectRatio,
          }}
        />
      ) : Camera && device && camPermission && micPermission ? (
        <Camera
          ref={camera}
          style={{
            flex: 1,
            aspectRatio: aspectRatio,
            resizeMode: "cover",
          }}
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
  
      <TouchableOpacity onPress={closeCameraView} style={{ position: "absolute", top: 30, left: 20 }}>
        <Ionicons name="close-circle" size={40} color="grey" />
      </TouchableOpacity>
  
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
            style={{ margin: 5, padding: 10, backgroundColor: mode === label ? "black" : "gray", borderRadius: 10 }}>
            <Text style={{ color: "white", fontSize: 14 }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
  
      <TouchableOpacity
        onPress={handleCameraAction}
        style={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          marginLeft: -30,
          borderRadius: 50,
          width: 60,
          height: 60,
          backgroundColor: isRecording ? "red" : "green",
          justifyContent: "center",
          alignItems: "center",
        }}>
        <Ionicons name={isRecording ? "stop-circle" : "camera"} size={40} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default CameraWrapper;
