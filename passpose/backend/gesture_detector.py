def detect_gesture(landmarks):
    """
    Detect a simple gesture using body landmarks.
    """

    left_shoulder = landmarks[11]
    right_shoulder = landmarks[12]

    left_wrist = landmarks[15]
    right_wrist = landmarks[16]

    # Check if left hand is above left shoulder
    left_hand_up = left_wrist.y < left_shoulder.y

    # Check if right hand is above right shoulder
    right_hand_up = right_wrist.y < right_shoulder.y

    # Both hands are up
    if left_hand_up and right_hand_up:
        return "BOTH_HANDS_UP"

    # Only right hand is up
    elif right_hand_up and not left_hand_up:
        return "RIGHT_HAND_UP"

    # Only left hand is up
    elif left_hand_up and not right_hand_up:
        return "LEFT_HAND_UP"

    # No hands are up
    else:
        return "NEUTRAL"