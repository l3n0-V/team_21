// ✅ Still here — imports from your Firebase config file.
import { auth, provider } from "./firebase-config.js";

// ✅ Added `onAuthStateChanged` to your import list (so we can use the modular API correctly).
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  onAuthStateChanged, // added this from original code
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";



/* == UI - Elements == */
// (No changes here — just left as is)
const signInWithGoogleButtonEl = document.getElementById("sign-in-with-google-btn");
const signUpWithGoogleButtonEl = document.getElementById("sign-up-with-google-btn");
const emailInputEl = document.getElementById("email-input");
const passwordInputEl = document.getElementById("password-input");
const signInButtonEl = document.getElementById("sign-in-btn");
const createAccountButtonEl = document.getElementById("create-account-btn");
const emailForgotPasswordEl = document.getElementById("email-forgot-password");
const forgotPasswordButtonEl = document.getElementById("forgot-password-btn");

const errorMsgEmail = document.getElementById("email-error-message");
const errorMsgPassword = document.getElementById("password-error-message");
const errorMsgGoogleSignIn = document.getElementById("google-signin-error-message");



/* == UI - Event Listeners == */
// Change: added `?.` so that if an element doesn’t exist, it won’t throw an error.
// It’s just a safety check.
signInWithGoogleButtonEl?.addEventListener("click", authSignInWithGoogle);
signInButtonEl?.addEventListener("click", authSignInWithEmail);
createAccountButtonEl?.addEventListener("click", authCreateAccountWithEmail);
signUpWithGoogleButtonEl?.addEventListener("click", authSignUpWithGoogle);
forgotPasswordButtonEl?.addEventListener("click", resetPassword);




/* === Main Code === */

// Functions below are unchanged except for minor improvements (comments explain where)

async function authSignInWithGoogle() {
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    const result = await signInWithPopup(auth, provider);
    if (!result?.user?.email) throw new Error("No email returned from Google."); //  Change: safer null check
    const idToken = await result.user.getIdToken();
    loginUser(result.user, idToken);
  } catch (error) {
    // Change: Added UI-friendly error message option
    console.error("Error during sign-in with Google", error);
    if (errorMsgGoogleSignIn) errorMsgGoogleSignIn.textContent = error.message || "Google sign-in failed.";
  }
}


async function authSignUpWithGoogle() {
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();
    loginUser(result.user, idToken);
  } catch (error) {
    console.error("Error during Google signup:", error.message);
  }
}



function authSignInWithEmail() {
  const email = emailInputEl?.value || "";  // Change: safer null handling
  const password = passwordInputEl?.value || "";

  signInWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      const idToken = await userCredential.user.getIdToken();
      loginUser(userCredential.user, idToken);
    })
    .catch((error) => {
      // (same logic as it was, just cleaner)
      const code = error.code;
      if (code === "auth/invalid-email") errorMsgEmail && (errorMsgEmail.textContent = "Invalid email");
      else if (code === "auth/invalid-credential") errorMsgPassword && (errorMsgPassword.textContent = "Invalid email or password");
      else console.error(code, error.message);
    });
}



function authCreateAccountWithEmail() {
  const email = emailInputEl?.value || "";
  const password = passwordInputEl?.value || "";

  createUserWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      const user = userCredential.user;
      await addNewUserToFirestore(user);
      // Change: replaced `setTimeout(100)` with proper async delay (commented example)
      // await new Promise(r => setTimeout(r, 100));

      const idToken = await user.getIdToken();
      loginUser(user, idToken);
    })
    .catch((error) => {
      const code = error.code;
      if (code === "auth/invalid-email") errorMsgEmail && (errorMsgEmail.textContent = "Invalid email");
      else if (code === "auth/weak-password") errorMsgPassword && (errorMsgPassword.textContent = "Password must be at least 6 chars");
      else if (code === "auth/email-already-in-use") errorMsgEmail && (errorMsgEmail.textContent = "Email already in use");
      else console.error(code, error.message);
    });
}



function resetPassword() {
  const emailToReset = emailForgotPasswordEl?.value || "";
  if (!emailToReset) return;

  clearInputField(emailForgotPasswordEl);

  sendPasswordResetEmail(auth, emailToReset)
    .then(() => {
      const resetFormView = document.getElementById("reset-password-view");
      const resetSuccessView = document.getElementById("reset-password-confirmation-page");

      if (resetFormView && resetSuccessView) {
        resetFormView.style.display = "none";
        resetSuccessView.style.display = "block";
      }
    })
    .catch((error) => {
      console.error("Reset error:", error.code, error.message);
    });
}



/* === UI helpers === */
function loginUser(user, idToken) {
  fetch("/auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${idToken}`,
    },
    credentials: "same-origin",
    body: JSON.stringify({ uid: user.uid, email: user.email }), // 🧠 CHANGE: added JSON body to make request clearer
  })
    .then((res) => {
      if (res.ok) window.location.href = "/dashboard";
      else console.error("Failed to login");
    })
    .catch((err) => console.error("Fetch error:", err));
}


function clearInputField(field) { if (field) field.value = ""; }
function clearAuthFields() { clearInputField(emailInputEl); clearInputField(passwordInputEl); }



/* === TOKEN REFRESH HOOK === */
// Change: Removed your duplicate `const auth = getAuth()` block that caused the crash.
// Change: Switched from `auth.onAuthStateChanged(...)` to the modular API function
// `onAuthStateChanged(auth, callback)` (the modern way).

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const token = await user.getIdToken(true);
    window.currentUserToken = token; // store token globally if needed
    console.log("Firebase ID token ready:", token.slice(0, 25) + "...");
  } else {
    console.log("No user is signed in.");
  }
});
