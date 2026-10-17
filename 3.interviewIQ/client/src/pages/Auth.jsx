
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

  const handleGoogleAuth = async () => {
    if (loading) return;

    setLoading(true);
    setErrorMessage("");

    try {
      // Sign in with Google using Firebase.
      const response = await signInWithPopup(auth, provider);
      const user = response.user;

      if (!user?.email) {
        throw new Error("Google account email could not be found.");
      }

      // Send the authenticated user's details to your backend.
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
        }
      );

      // Save the backend response in Redux.
      dispatch(setUserData(result.data));

      setErrorMessage("");
    } catch (error) {
      console.error("Google authentication error:", error);

      if (error.response) {
        setErrorMessage(
          error.response.data?.message ||
            `Server authentication failed (${error.response.status}).`
        );
      } else if (error.code === "auth/popup-closed-by-user") {
        setErrorMessage("Sign-in was cancelled. Please try again.");
      } else if (error.code === "auth/popup-blocked") {
        setErrorMessage("Your browser blocked the sign-in popup. Please allow popups and try again.");
      } else if (
        error.code === "auth/invalid-api-key" ||
        error.code === "auth/api-key-not-valid"
      ) {
        setErrorMessage(
          "Your Firebase API key is invalid. Check your Firebase configuration."
        );
      } else if (error.code === "auth/unauthorized-domain") {
        setErrorMessage(
          "This website domain is not authorized in Firebase. Add your domain in Firebase Authentication settings."
        );
      } else if (error.code === "auth/network-request-failed") {
        setErrorMessage(
          "Network error. Check your internet connection and try again."
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
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className={`w-full ${
          isModel
            ? "max-w-md p-8 rounded-3xl"
            : "max-w-lg p-12 rounded-[32px]"
        } bg-white shadow-2xl border border-gray-200`}
      >
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="bg-black text-white p-2 rounded-lg">
            <BsRobot size={18} />
          </div>

          <h2 className="font-semibold text-lg">InterviewIQ.AI</h2>
        </div>

        <h1 className="text-2xl md:text-3xl font-semibold text-center leading-snug mb-4">
          Continue with{" "}
          <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full inline-flex items-center gap-2">
            <IoSparkles size={16} />
            AI Smart Interview
          </span>
        </h1>

        <p className="text-gray-500 text-center text-sm md:text-base leading-relaxed mb-8">
          Sign in to start AI-powered mock interviews, track your progress,
          and unlock detailed performance insights.
        </p>

        {errorMessage && (
          <p
            role="alert"
            aria-live="polite"
            className="mb-4 text-center text-sm text-red-600"
          >
            {errorMessage}
          </p>
        )}

        <motion.button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          whileHover={!loading ? { opacity: 0.9, scale: 1.02 } : {}}
          whileTap={!loading ? { scale: 0.98 } : {}}
          className="w-full flex items-center justify-center gap-3 py-3 bg-black text-white rounded-full shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <FcGoogle size={20} />

          {loading ? "Signing in..." : "Continue with Google"}
        </motion.button>
      </motion.div>
    </div>
  );
}

export default Auth;
