from password_manager import save_password
from password_manager import load_password
from password_manager import verify_password


password = [
    "BOTH_HANDS_UP",
    "ARMS_OUT",
    "HANDS_TOGETHER"
]


print("Saving password...")

save_password(password)

print()

print("Loading password...")

saved = load_password()

print("Saved password:")
print(saved)

print()

print("Testing correct password...")

correct = verify_password([
    "BOTH_HANDS_UP",
    "ARMS_OUT",
    "HANDS_TOGETHER"
])

print("Result:", correct)

print()

print("Testing incorrect password...")

incorrect = verify_password([
    "BOTH_HANDS_UP",
    "SQUAT",
    "HANDS_TOGETHER"
])

print("Result:", incorrect)
