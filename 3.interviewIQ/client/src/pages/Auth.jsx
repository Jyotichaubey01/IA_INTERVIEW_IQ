
import React, { useState } from "react";
import { BsRobot } from "react-icons/bs";
import { IoSparkles } from "react-icons/io5";
import { motion } from "motion/react";
import { FcGoogle } from "react-icons/fc";
import { signInWithPopup } from "firebase/auth";
import axios from "axios";
import { auth, provider } from "../utils/firebase";
import { ServerUrl } from "../App";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";

function Auth({ isModel = false }) {
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleGoogleAuth = async () => {
    if (loading) return;

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Step 1: Sign in with Google through Firebase.
      const response = await signInWithPopup(auth, provider);
      const user = response.user;

      if (!user || !user.email) {
        throw new Error("Unable to get your Google account details.");
      }

      // Step 2: Send user details to the backend.
      const result = await axios.post(
        `${ServerUrl}/api/auth/google`,
        {
          name: user.displayName || "",
          email: user.email,
          photoURL: user.photoURL || "",
          uid: user.uid,
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 20000,
        }
      );

      // Step 3: Update Redux with the backend response.
      // Adjust this if your API returns the user inside result.data.user.
      const userData = result.data?.user ?? result.data;

      dispatch(setUserData(userData));
      setSuccessMessage("Google sign-in successful!");

    } catch (error) {
      console.error("Google authentication error:", error);

      if (error.response) {
        setErrorMessage(
          error.response.data?.message ||
            `Server error (${error.response.status}). Please try again.`
        );
      } else if (error.code === "auth/popup-closed-by-user") {
        setErrorMessage("Sign-in cancelled. Please try again.");
      } else if (error.code === "auth/popup-blocked") {
        setErrorMessage(
          "Popup blocked. Please allow popups and try again."
        );
      } else if (
        error.code === "auth/invalid-api-key" ||
        error.code === "auth/api-key-not-valid"
      ) {
        setErrorMessage(
          "Invalid Firebase API key. Check your Firebase environment variables."
        );
      } else if (error.code === "auth/unauthorized-domain") {
        setErrorMessage(
          "This domain is not authorized in Firebase. Add your deployed domain to Firebase Authentication's authorized domains."
        );
      } else if (error.code === "auth/network-request-failed") {
        setErrorMessage(
          "Network error. Check your internet connection."
        );
      } else if (
        error.code === "auth/account-exists-with-different-credential"
      ) {
        setErrorMessage(
          "An account already exists with a different sign-in method."
        );
      } else if (
        error.code === "ECONNABORTED" ||
        error.code === "ERR_NETWORK"
      ) {
        setErrorMessage(
          "Cannot reach the backend. Check your deployed API URL and server status."
        );
      } else {
        setErrorMessage(
          error.message || "Sign-in failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`w-full ${
        isModel
          ? "py-4"
          : "min-h-screen bg-[#f3f3f3] flex items-center justify-center px-6 py-20"
      }`}
    >
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`w-full ${
          isModel
            ? "max-w-md p-8 rounded-3xl"
            : "max-w-lg p-8 md:p-12 rounded-[32px]"
        } bg-white shadow-2xl border border-gray-200`}
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="bg-black text-white p-2 rounded-lg">
            <BsRobot size={20} />
          </div>

          <h2 className="font-semibold text-lg">
            InterviewIQ.AI
          </h2>
        </div>

        {/* Heading */}
        <h1 className="text-2xl md:text-3xl font-semibold text-center leading-snug mb-4">
          Continue with{" "}
          <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full inline-flex items-center gap-2 mt-2">
            <IoSparkles size={16} />
            AI Smart Interview
          </span>
        </h1>

        <p className="text-gray-500 text-center text-sm md:text-base leading-relaxed mb-8">
          Sign in to start AI-powered mock interviews, track
          your progress, and unlock detailed performance insights.
        </p>

        {/* Error message */}
        {errorMessage && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-5 rounded-xl bg-red-50 border border-red-200 p-3 text-center text-sm text-red-700"
          >
            {errorMessage}
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div
            role="status"
            aria-live="polite"
            className="mb-5 rounded-xl bg-green-50 border border-green-200 p-3 text-center text-sm text-green-700"
          >
            {successMessage}
          </div>
        )}

        {/* Google sign-in */}
        <motion.button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          whileHover={
            !loading ? { opacity: 0.9, scale: 1.02 } : {}
          }
          whileTap={!loading ? { scale: 0.98 } : {}}
          className="w-full flex items-center justify-center gap-3 py-3 px-5 bg-black text-white rounded-full shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span
              className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin"
              aria-hidden="true"
            />
          ) : (
            <FcGoogle size={22} />
          )}

          <span>
            {loading
              ? "Signing in..."
              : "Continue with Google"}
          </span>
        </motion.button>

        <p className="text-center text-xs text-gray-400 mt-6">
          Secure sign-in powered by Google and Firebase.
        </p>
      </motion.div>
    </div>
  );
}

export default Auth;
