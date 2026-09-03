import cv2
import mediapipe as mp

from gesture_detector import detect_gesture
from sequence_detector import SequenceDetector
from password_manager import save_password

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

sequence_detector = SequenceDetector()
recording = False

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

        if recording:
           sequence = sequence_detector.update(gesture)
        else:
           sequence = sequence_detector.sequence
        
        cv2.putText(
        frame,
        f"Gesture: {gesture}",
        (20, 80),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (255, 255, 255),
        2
        )
        
        cv2.putText(
        frame,
        f"Sequence: {' -> '.join(sequence)}",
        (20, 120),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
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
    # Handle keyboard input
    key = cv2.waitKey(1) & 0xFF

    if key == ord("q"):
        break

    elif key == ord(" "):

        if not recording:

            # Start recording
            sequence_detector.reset()
            recording = True

            print("Recording started!")

        else:

            # Stop recording
            recording = False

            print("Recording stopped!")
            print("Password sequence:")
            print(sequence_detector.sequence)
            save_password(sequence_detector.sequence)

camera.release()
landmarker.close()
cv2.destroyAllWindows()