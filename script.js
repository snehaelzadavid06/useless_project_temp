const video = document.getElementById("camera");

async function startCamera() {

    try {

        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });

        video.srcObject = stream;

        await video.play();

    } catch (error) {

        console.error("Camera error:", error);

        document.getElementById("status").textContent =
            "Could not access webcam.";
    }
}



let poseLandmarker = null;
let lastVideoTime = -1;

async function setupPoseLandmarker() {

    const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    poseLandmarker = await PoseLandmarker.createFromOptions(
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

    console.log("Pose Landmarker initialized!");

    detectPose();
}
// ===============================
// GESTURE DETECTION
// ===============================

function detectSquat(landmarks) {

    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];

    const leftDifference = leftKnee.y - leftHip.y;
    const rightDifference = rightKnee.y - rightHip.y;

    const threshold = 0.25;

    const leftSquat = leftDifference < threshold;
    const rightSquat = rightDifference < threshold;

    return leftSquat && rightSquat;
}


function detectHandsTogether(landmarks) {

    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];

    const dx = leftWrist.x - rightWrist.x;
    const dy = leftWrist.y - rightWrist.y;

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
        Math.abs(leftWrist.y - leftShoulder.y) < tolerance;

    const rightArmOut =
        Math.abs(rightWrist.y - rightShoulder.y) < tolerance;

    return leftArmOut && rightArmOut;
}


function detectGesture(landmarks) {

    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];

    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];

    const margin = 0.08;

    const leftHandUp =
        leftWrist.y < leftShoulder.y - margin;

    const rightHandUp =
        rightWrist.y < rightShoulder.y - margin;


    if (detectSquat(landmarks)) {

        return "SQUAT";

    } else if (detectHandsTogether(landmarks)) {

        return "HANDS_TOGETHER";

    } else if (detectArmsOut(landmarks)) {

        return "ARMS_OUT";

    } else if (leftHandUp && rightHandUp) {

        return "BOTH_HANDS_UP";

    } else if (rightHandUp && !leftHandUp) {

        return "RIGHT_HAND_UP";

    } else if (leftHandUp && !rightHandUp) {

        return "LEFT_HAND_UP";

    } else {

        return "NEUTRAL";
    }
}
function detectPose() {

    if (!poseLandmarker) {
        return;
    }

    if (video.currentTime !== lastVideoTime) {

        lastVideoTime = video.currentTime;

        const result = poseLandmarker.detectForVideo(
            video,
            performance.now()
        );

        if (result.landmarks && result.landmarks.length > 0) {

            const landmarks = result.landmarks[0];

            const gesture = detectGesture(landmarks);
            document.getElementById("currentGesture").textContent =
    `Gesture: ${gesture}`;

console.log("Gesture:", gesture);
        }
    }

    requestAnimationFrame(detectPose);
}

startCamera().then(() => {
    setupPoseLandmarker();
});

const API_URL = "http://127.0.0.1:8000";

// CREATE PASSWORD
async function createPassword() {

    const sequence = [
        "BOTH_HANDS_UP",
        "SQUAT",
        "RIGHT_HAND_UP"
    ];

    try {

        const response = await fetch(
            `${API_URL}/password/create`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    sequence: sequence
                })
            }
        );

        const data = await response.json();

        document.getElementById("status").textContent =
            data.message;

    } catch (error) {

        console.error(error);

        document.getElementById("status").textContent =
            "Could not connect to PassPose server.";
    }
}


// VERIFY PASSWORD
async function verifyPassword() {

    const sequence = [
        "BOTH_HANDS_UP",
        "SQUAT",
        "RIGHT_HAND_UP"
    ];

    try {

        const response = await fetch(
            `${API_URL}/password/verify`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    sequence: sequence
                })
            }
        );

        const data = await response.json();

        document.getElementById("status").textContent =
            data.message;

    } catch (error) {

        console.error(error);

        document.getElementById("status").textContent =
            "Could not connect to PassPose server.";
    }
}


// BUTTONS
document
    .getElementById("createBtn")
    .addEventListener("click", createPassword);

document
    .getElementById("verifyBtn")
    .addEventListener("click", verifyPassword);