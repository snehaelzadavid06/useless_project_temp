import cv2
import mediapipe as mp
from gesture_detector import detect_gesture

# Path to the MediaPipe pose model
MODEL_PATH = "passpose/backend/models/pose_landmarker_full.task"


# Create MediaPipe Pose Landmarker
base_options = mp.tasks.BaseOptions(
    model_asset_path=MODEL_PATH
)

options = mp.tasks.vision.PoseLandmarkerOptions(
    base_options=base_options,
    running_mode=mp.tasks.vision.RunningMode.VIDEO,
    num_poses=1
)

landmarker = mp.tasks.vision.PoseLandmarker.create_from_options(options)


# Open webcam
camera = cv2.VideoCapture(0)

if not camera.isOpened():
    print("Error: Could not open webcam.")
    landmarker.close()
    exit()


frame_timestamp = 0


while True:

    success, frame = camera.read()

    if not success:
        print("Error: Could not read frame.")
        break

    # OpenCV uses BGR, MediaPipe expects RGB
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Convert OpenCV image into MediaPipe image
    mp_image = mp.Image(
        image_format=mp.ImageFormat.SRGB,
        data=rgb_frame
    )

    # Detect pose
    result = landmarker.detect_for_video(
        mp_image,
        frame_timestamp
    )

    frame_timestamp += 1

    # Check whether a person was detected
    if result.pose_landmarks:

        landmarks = result.pose_landmarks[0]
        gesture = detect_gesture(landmarks)

        cv2.putText(
        frame,
        f"Gesture: {gesture}",
        (20, 80),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (255, 255, 255),
        2
        )

        # Draw each landmark
        height, width, _ = frame.shape

        for landmark in landmarks:

            x = int(landmark.x * width)
            y = int(landmark.y * height)

            cv2.circle(
                frame,
                (x, y),
                5,
                (0, 255, 0),
                -1
            )

        cv2.putText(
            frame,
            "Pose detected!",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 255, 0),
            2
        )

    else:

        cv2.putText(
            frame,
            "No person detected",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 0, 255),
            2
        )

    cv2.imshow("PassPose - Pose Detection", frame)

    # Press Q to quit
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break


camera.release()
landmarker.close()
cv2.destroyAllWindows()