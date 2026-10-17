
import React, { useState } from "react";
import { motion } from "motion/react";
import {
  FaUserTie,
  FaBriefcase,
  FaFileUpload,
  FaMicrophoneAlt,
  FaChartLine,
} from "react-icons/fa";

import axios from "axios";
import { ServerUrl } from "../App";
import { useSelector } from "react-redux";

function Step1SetUp({ onStart }) {
  const { userData } = useSelector((state) => state.user);

  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [mode, setMode] = useState("Technical");

  const [resumeFile, setResumeFile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [resumeText, setResumeText] = useState("");

  const [analysisDone, setAnalysisDone] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Five predefined questions: no AI generation required.
  const fixedQuestions = {
    Technical: [
      "What is JavaScript?",
      "What is the difference between var, let, and const?",
      "What is a closure in JavaScript?",
      "What is the difference between == and ===?",
      "What is the difference between promises and async/await?",
    ],
    HR: [
      "Tell me about yourself.",
      "Why do you want to join our company?",
      "What are your strengths and weaknesses?",
      "Describe a challenge you faced and how you solved it.",
      "Where do you see yourself in five years?",
    ],
  };

  // Optional resume analysis still uses your existing backend.
  const handleUploadResume = async () => {
    if (!resumeFile || analyzing) return;

    setAnalyzing(true);
    setError("");

    const formData = new FormData();
    formData.append("resume", resumeFile);

    try {
      const result = await axios.post(
        `${ServerUrl}/api/interview/resume`,
        formData,
        { withCredentials: true }
      );

      setRole(result.data.role || role);
      setExperience(result.data.experience || experience);
      setProjects(result.data.projects || []);
      setSkills(result.data.skills || []);
      setResumeText(result.data.resumeText || "");
      setAnalysisDone(true);
    } catch (err) {
      console.error("Resume analysis error:", err.response?.data || err.message);
      setError(
        err.response?.data?.message ||
        "Resume analysis failed. You can still start the interview without it."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // Start with fixed questions instead of calling the AI API.
  const handleStart = () => {
    if (!role.trim() || !experience.trim() || loading) return;

    setLoading(true);
    setError("");

    try {
      const questions = fixedQuestions[mode];

      onStart({
        role: role.trim(),
        experience: experience.trim(),
        mode,
        questions,
        projects,
        skills,
        resumeText,
        userData,
      });
    } catch (err) {
      console.error("Start interview error:", err);
      setError("Could not start the interview. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 px-4 py-8"
    >
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl grid md:grid-cols-2 overflow-hidden">

        {/* Left panel */}
        <motion.div
          initial={{ x: -80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="relative bg-gradient-to-br from-green-50 to-green-100 p-8 md:p-12 flex flex-col justify-center"
        >
          <h2 className="text-4xl font-bold text-gray-800 mb-6">
            Start Your Interview
          </h2>

          <p className="text-gray-600 mb-10">
            Practice with five ready-made interview questions.
            No AI question generation is required.
          </p>

          <div className="space-y-5">
            {[
              {
                icon: <FaUserTie className="text-green-600 text-xl" />,
                text: "Choose Role & Experience",
              },
              {
                icon: <FaMicrophoneAlt className="text-green-600 text-xl" />,
                text: "Practice Interview Questions",
              },
              {
                icon: <FaChartLine className="text-green-600 text-xl" />,
                text: "Review Your Performance",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.03 }}
                className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-sm"
              >
                {item.icon}
                <span className="text-gray-700 font-medium">
                  {item.text}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right panel */}
        <motion.div
          initial={{ x: 80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="p-8 md:p-12 bg-white"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-8">
            Interview Setup
          </h2>

          <div className="space-y-6">

            {/* Role */}
            <div className="relative">
              <FaUserTie className="absolute top-4 left-4 text-gray-400" />

              <input
                type="text"
                placeholder="Enter role (e.g. Frontend Developer)"
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>

            {/* Experience */}
            <div className="relative">
              <FaBriefcase className="absolute top-4 left-4 text-gray-400" />

              <input
                type="text"
                placeholder="Experience (e.g. Fresher)"
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              />
            </div>

            {/* Interview mode */}
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full py-3 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="Technical">Technical Interview</option>
              <option value="HR">HR Interview</option>
            </select>

            {/* Optional resume upload */}
            {!analysisDone && (
              <div
                onClick={() =>
                  document.getElementById("resumeUpload").click()
                }
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition"
              >
                <FaFileUpload className="text-4xl mx-auto text-green-600 mb-3" />

                <input
                  type="file"
                  accept="application/pdf"
                  id="resumeUpload"
                  className="hidden"
                  onChange={(e) =>
                    setResumeFile(e.target.files?.[0] || null)
                  }
                />

                <p className="text-gray-600 font-medium">
                  {resumeFile
                    ? resumeFile.name
                    : "Click to upload resume (Optional)"}
                </p>

                {resumeFile && (
                  <button
                    type="button"
                    disabled={analyzing}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUploadResume();
                    }}
                    className="mt-4 bg-gray-900 text-white px-5 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50"
                  >
                    {analyzing ? "Analyzing..." : "Analyze Resume"}
                  </button>
                )}
              </div>
            )}

            {/* Resume analysis results */}
            {analysisDone && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Resume Analysis Result
                </h3>

                {projects.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-700 mb-1">
                      Projects:
                    </p>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      {projects.map((project, index) => (
                        <li key={index}>{project}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {skills.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-700 mb-1">
                      Skills:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error message */}
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            {/* Start interview */}
            <motion.button
              type="button"
              onClick={handleStart}
              disabled={!role.trim() || !experience.trim() || loading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              className="w-full disabled:bg-gray-400 bg-green-600 hover:bg-green-700 text-white py-3 rounded-full text-lg font-semibold transition duration-300 shadow-md"
            >
              {loading ? "Starting..." : "Start Interview"}
            </motion.button>

          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Step1SetUp;
