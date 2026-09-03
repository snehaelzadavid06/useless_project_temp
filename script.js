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