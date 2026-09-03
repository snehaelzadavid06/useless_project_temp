def detect_gesture(landmarks):

    left_shoulder = landmarks[11]
    right_shoulder = landmarks[12]

    left_wrist = landmarks[15]
    right_wrist = landmarks[16]

    # Add a small margin so the wrist has to move
    # clearly above the shoulder.

    margin = 0.08

    left_hand_up = (
        left_wrist.y < left_shoulder.y - margin
    )

    right_hand_up = (
        right_wrist.y < right_shoulder.y - margin
    )

    if left_hand_up and right_hand_up:
        return "BOTH_HANDS_UP"

    elif right_hand_up and not left_hand_up:
        return "RIGHT_HAND_UP"

    elif left_hand_up and not right_hand_up:
        return "LEFT_HAND_UP"

    else:
        return "NEUTRAL"