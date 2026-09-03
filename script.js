// ===============================
// MEDIAPIPE IMPORTS
// ===============================

import {
    PoseLandmarker,
    FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";


// ===============================
// CONFIGURATION
// ===============================

const API_URL = "http://127.0.0.1:8000";


// ===============================
// CAMERA
// ===============================

const video = document.getElementById("camera");


async function startCamera() {

    try {

        const stream =
            await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            });

        video.srcObject = stream;

        await video.play();

        console.log("Camera started!");

    } catch (error) {

        console.error("Camera error:", error);

        document.getElementById("status").textContent =
            "Could not access webcam.";
    }
}


// ===============================
// SEQUENCE DETECTION
// ===============================

class SequenceDetector {

    constructor(requiredFrames = 8, cooldown = 700) {

        this.candidateGesture = null;

        this.candidateCount = 0;

        this.currentGesture = null;

        this.sequence = [];

        this.requiredFrames = requiredFrames;

        this.cooldown = cooldown;

        this.lastChangeTime = 0;
    }


    update(gesture) {

        // Ignore neutral
        if (gesture === "NEUTRAL") {
            return this.sequence;
        }


        const currentTime = Date.now();


        // Prevent rapid duplicate gestures
        if (
            currentTime - this.lastChangeTime <
            this.cooldown
        ) {

            return this.sequence;
        }


        // Same gesture detected again
        if (
            gesture ===
            this.candidateGesture
        ) {

            this.candidateCount++;

        } else {

            this.candidateGesture = gesture;

            this.candidateCount = 1;
        }


        // Gesture held long enough
        if (
            this.candidateCount >=
            this.requiredFrames
        ) {

            if (
                gesture !==
                this.currentGesture
            ) {

                this.currentGesture = gesture;

                this.sequence.push(gesture);

                this.lastChangeTime =
                    currentTime;

                this.candidateCount = 0;
            }
        }


        return this.sequence;
    }


    reset() {

        this.candidateGesture = null;

        this.candidateCount = 0;

        this.currentGesture = null;

        this.sequence = [];

        this.lastChangeTime = 0;
    }
}


// Create sequence detector AFTER the class exists
const sequenceDetector =
    new SequenceDetector();


// ===============================
// GESTURE DETECTION
// ===============================

function detectSquat(landmarks) {

    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];


    const leftDifference =
        leftKnee.y - leftHip.y;

    const rightDifference =
        rightKnee.y - rightHip.y;


    const threshold = 0.25;


    const leftSquat =
        leftDifference < threshold;

    const rightSquat =
        rightDifference < threshold;


    return leftSquat && rightSquat;
}


function detectHandsTogether(landmarks) {

    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];


    const dx =
        leftWrist.x - rightWrist.x;

    const dy =
        leftWrist.y - rightWrist.y;


    const distance = Math.sqrt(
        dx * dx + dy * dy
    );


    const threshold = 0.25;


    return distance < threshold;
}


function detectArmsOut(landmarks) {

    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];

    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];


    const tolerance = 0.10;


    const leftArmOut =
        Math.abs(
            leftWrist.y -
            leftShoulder.y
        ) < tolerance;


    const rightArmOut =
        Math.abs(
            rightWrist.y -
            rightShoulder.y
        ) < tolerance;


    return leftArmOut && rightArmOut;
}


function detectGesture(landmarks) {

    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];

    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];


    const margin = 0.08;


    const leftHandUp =
        leftWrist.y <
        leftShoulder.y - margin;


    const rightHandUp =
        rightWrist.y <
        rightShoulder.y - margin;


    // Keep the same priority
    // as your Python detector

    if (detectSquat(landmarks)) {

        return "SQUAT";

    } else if (
        detectHandsTogether(landmarks)
    ) {

        return "HANDS_TOGETHER";

    } else if (
        detectArmsOut(landmarks)
    ) {

        return "ARMS_OUT";

    } else if (
        leftHandUp &&
        rightHandUp
    ) {

        return "BOTH_HANDS_UP";

    } else if (
        rightHandUp &&
        !leftHandUp
    ) {

        return "RIGHT_HAND_UP";

    } else if (
        leftHandUp &&
        !rightHandUp
    ) {

        return "LEFT_HAND_UP";

    } else {

        return "NEUTRAL";
    }
}


// ===============================
// MEDIAPIPE POSE LANDMARKER
// ===============================

let poseLandmarker = null;

let lastVideoTime = -1;


async function setupPoseLandmarker() {

    try {

        const vision =
            await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );


        poseLandmarker =
            await PoseLandmarker.createFromOptions(
                vision,
                {
                    baseOptions: {

                        modelAssetPath:
                            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task"
                    },

                    runningMode: "VIDEO",

                    numPoses: 1
                }
            );


        console.log(
            "Pose Landmarker initialized!"
        );


        detectPose();

    } catch (error) {

        console.error(
            "MediaPipe initialization error:",
            error
        );

        document.getElementById("status").textContent =
            "Could not initialize pose detection.";
    }
}


// ===============================
// POSE DETECTION LOOP
// ===============================

function detectPose() {

    if (!poseLandmarker) {
        return;
    }


    if (
        video.currentTime !==
        lastVideoTime
    ) {

        lastVideoTime =
            video.currentTime;


        const result =
            poseLandmarker.detectForVideo(
                video,
                performance.now()
            );


        if (
            result.landmarks &&
            result.landmarks.length > 0
        ) {

            const landmarks =
                result.landmarks[0];


            // Detect current gesture
            const gesture =
                detectGesture(landmarks);


            // Add gesture to sequence
            const sequence =
                sequenceDetector.update(
                    gesture
                );


            // Display current gesture
            document.getElementById(
                "currentGesture"
            ).textContent =
                `Gesture: ${gesture}`;


            // Display sequence
            document.getElementById(
                "poseSequence"
            ).textContent =
                `Sequence: ${
                    sequence.length > 0
                        ? sequence.join(" → ")
                        : "—"
                }`;


            console.log(
                "Gesture:",
                gesture
            );

        } else {

            document.getElementById(
                "currentGesture"
            ).textContent =
                "Gesture: No person detected";
        }
    }


    requestAnimationFrame(
        detectPose
    );
}


// ===============================
// CREATE PASSWORD
// ===============================

async function createPassword() {

    const sequence =
        sequenceDetector.sequence;


    if (sequence.length === 0) {

        document.getElementById("status").textContent =
            "Perform some poses first.";

        return;
    }


    console.log(
        "Creating password:",
        sequence
    );


    try {

        const response =
            await fetch(
                `${API_URL}/password/create`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        sequence: sequence
                    })
                }
            );


        const data =
            await response.json();


        document.getElementById(
            "status"
        ).textContent =
            data.message;


        if (data.success) {

            sequenceDetector.reset();

            document.getElementById(
                "poseSequence"
            ).textContent =
                "Sequence: —";
        }


    } catch (error) {

        console.error(error);

        document.getElementById(
            "status"
        ).textContent =
            "Could not connect to PassPose server.";
    }
}


// ===============================
// VERIFY PASSWORD
// ===============================

async function verifyPassword() {

    const sequence =
        sequenceDetector.sequence;


    if (sequence.length === 0) {

        document.getElementById("status").textContent =
            "Perform your pose sequence first.";

        return;
    }


    console.log(
        "Verifying sequence:",
        sequence
    );


    try {

        const response =
            await fetch(
                `${API_URL}/password/verify`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        sequence: sequence
                    })
                }
            );


        const data =
            await response.json();


        document.getElementById(
            "status"
        ).textContent =
            data.message;


        if (data.authenticated) {

            console.log(
                "ACCESS GRANTED!"
            );

        } else {

            console.log(
                "ACCESS DENIED!"
            );
        }


        sequenceDetector.reset();

        document.getElementById(
            "poseSequence"
        ).textContent =
            "Sequence: —";


    } catch (error) {

        console.error(error);

        document.getElementById(
            "status"
        ).textContent =
            "Could not connect to PassPose server.";
    }
}


// ===============================
// BUTTONS
// ===============================

document
    .getElementById("createBtn")
    .addEventListener(
        "click",
        createPassword
    );


document
    .getElementById("verifyBtn")
    .addEventListener(
        "click",
        verifyPassword
    );


// ===============================
// START APPLICATION
// ===============================

async function startPassPose() {

    await startCamera();

    await setupPoseLandmarker();
}


startPassPose();