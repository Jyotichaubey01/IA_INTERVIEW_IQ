
import React, { useState, useRef, useEffect } from "react";
import maleVideo from "../assets/videos/male-ai.mp4";
import femaleVideo from "../assets/videos/female-ai.mp4";
import Timer from "./Timer";
import { motion } from "motion/react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { BsArrowRight } from "react-icons/bs";
import axios from "axios";
import { ServerUrl } from "../App";

function Step2Interview({ interviewData, onFinish }) {
  const {
    interviewId,
    questions = [],
    userName = "Candidate",
    role = "Developer",
    mode = "Technical",
  } = interviewData || {};

  const [isIntroPhase, setIsIntroPhase] = useState(true);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isAIPlaying, setIsAIPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [timeLeft, setTimeLeft] = useState(
    questions[0]?.timeLimit || 60
  );
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subtitle, setSubtitle] = useState("");
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState([]);

  const recognitionRef = useRef(null);
  const videoRef = useRef(null);
  const timerRef = useRef(null);

  const currentQuestion = questions[currentIndex];

  const videoSource = selectedVoice
    ? /david|mark|male/i.test(selectedVoice.name)
      ? maleVideo
      : femaleVideo
    : femaleVideo;

  // Load available browser speech voices.
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;

      const preferredVoice =
        voices.find((v) =>
          /zira|samantha|female/i.test(v.name)
        ) ||
        voices.find((v) =>
          /david|mark/i.test(v.name)
        ) ||
        voices[0];

      setSelectedVoice(preferredVoice);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
  }, []);

  // Set up speech recognition when supported by the browser.
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      let transcript = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript + " ";
        }
      }

      if (transcript.trim()) {
        setAnswer((prev) =>
          `${prev} ${transcript}`.trim()
        );
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== "no-speech") {
        console.warn("Speech recognition:", event.error);
      }
    };

    recognition.onend = () => {
      // Recognition may stop naturally. Restart only when
      // the microphone is enabled and the AI is not speaking.
      if (
        recognitionRef.current &&
        isMicOn &&
        !isAIPlaying
      ) {
        try {
          recognition.start();
        } catch {
          // The browser may already be starting recognition.
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognitionRef.current = null;
      recognition.abort();
    };
  }, [isMicOn, isAIPlaying]);

  const stopMic = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // Recognition may already be stopped.
    }
  };

  const startMic = () => {
    if (!recognitionRef.current || isAIPlaying) return;

    try {
      recognitionRef.current.start();
    } catch {
      // Recognition may already be active.
    }
  };

  const speakText = (text) =>
    new Promise((resolve) => {
      if (!("speechSynthesis" in window) || !text) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      stopMic();

      const utterance = new SpeechSynthesisUtterance(text);
      if (selectedVoice) utterance.voice = selectedVoice;

      utterance.rate = 0.92;
      utterance.pitch = 1.05;
      utterance.volume = 1;

      setSubtitle(text);

      utterance.onstart = () => {
        setIsAIPlaying(true);
        videoRef.current?.play().catch(() => {});
      };

      utterance.onend = () => {
        videoRef.current?.pause();

        if (videoRef.current) {
          videoRef.current.currentTime = 0;
        }

        setIsAIPlaying(false);
        setSubtitle("");
        resolve();
      };

      utterance.onerror = () => {
        setIsAIPlaying(false);
        setSubtitle("");
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });

  // Read the introduction and each question aloud.
  useEffect(() => {
    let cancelled = false;

    const runInterview = async () => {
      if (!selectedVoice) return;

      if (isIntroPhase) {
        await speakText(
          `Hi ${userName}, welcome to your ${mode} interview for the ${role} role.`
        );

        if (cancelled) return;

        await speakText(
          "I will ask you five questions. Answer naturally and take your time. Let's begin."
        );

        if (!cancelled) setIsIntroPhase(false);
        return;
      }

      if (!currentQuestion) return;

      await speakText(
        `Question ${currentIndex + 1}. ${currentQuestion.question}`
      );

      if (!cancelled && isMicOn) startMic();
    };

    runInterview();

    return () => {
      cancelled = true;
      window.speechSynthesis.cancel();
    };
    // Read each question when the index changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVoice, isIntroPhase, currentIndex]);

  // Timer for the current question.
  useEffect(() => {
    if (isIntroPhase || !currentQuestion || feedback) return;

    setTimeLeft(currentQuestion.timeLimit || 60);

    timerRef.current = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isIntroPhase, currentIndex, currentQuestion, feedback]);

  // Save the answer locally and submit to the backend only
  // when an interviewId exists.
  const submitAnswer = async () => {
    if (isSubmitting || !currentQuestion) return;

    stopMic();
    setIsMicOn(false);
    setIsSubmitting(true);
    setError("");

    const answerRecord = {
      question: currentQuestion.question,
      answer: answer.trim(),
      timeTaken:
        (currentQuestion.timeLimit || 60) - timeLeft,
    };

    try {
      let feedbackText = answer.trim()
        ? "Your answer has been saved. Review whether it directly answers the question and includes a clear example."
        : "No answer was provided. Try to give a clear answer with an example next time.";

      // Backend submission is optional for fixed questions.
      // It requires a valid interview record and matching route.
      if (interviewId) {
        try {
          const result = await axios.post(
            `${ServerUrl}/api/interview/submit-answer`,
            {
              interviewId,
              questionIndex: currentIndex,
              answer: answer.trim(),
              timeTaken: answerRecord.timeTaken,
            },
            { withCredentials: true }
          );

          feedbackText =
            result.data.feedback || feedbackText;
        } catch (err) {
          console.error(
            "Backend answer submission failed:",
            err.response?.data || err.message
          );

          // Continue the fixed-question interview locally.
          setError(
            "Could not get server feedback. You can still continue."
          );
        }
      }

      setAnswers((previous) => {
        const updated = [...previous];
        updated[currentIndex] = {
          ...answerRecord,
          feedback: feedbackText,
        };
        return updated;
      });

      setFeedback(feedbackText);
      await speakText(feedbackText);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    stopMic();
    setAnswer("");
    setFeedback("");
    setError("");

    if (currentIndex + 1 >= questions.length) {
      finishInterview();
      return;
    }

    await speakText("All right, let's move to the next question.");

    setCurrentIndex((previous) => previous + 1);
    setTimeLeft(questions[currentIndex + 1]?.timeLimit || 60);

    if (isMicOn) startMic();
  };

  // Finish locally if there is no backend interview record.
  const finishInterview = async () => {
    stopMic();
    setIsMicOn(false);
    window.speechSynthesis.cancel();

    const report = {
      role,
      mode,
      questions,
      answers,
      totalQuestions: questions.length,
      answeredQuestions: answers.filter(Boolean).length,
      completedAt: new Date().toISOString(),
    };

    if (interviewId) {
      try {
        const result = await axios.post(
          `${ServerUrl}/api/interview/finish`,
          { interviewId },
          { withCredentials: true }
        );

        onFinish(result.data);
        return;
      } catch (err) {
        console.error(
          "Backend finish failed:",
          err.response?.data || err.message
        );
      }
    }

    onFinish(report);
  };

  const toggleMic = () => {
    if (isMicOn) {
      stopMic();
      setIsMicOn(false);
    } else {
      setIsMicOn(true);
    }
  };

  if (!questions.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-red-600 font-semibold">
          No interview questions were provided.
        </p>
        <p className="mt-2 text-gray-600">
          Go back and start the interview again.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-7xl min-h-[80vh] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col lg:flex-row overflow-hidden">

        {/* Avatar and timer */}
        <div className="w-full lg:w-[35%] bg-white flex flex-col items-center p-6 space-y-6 border-r border-gray-200">
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-xl">
            <video
              src={videoSource}
              ref={videoRef}
              muted
              playsInline
              preload="auto"
              className="w-full h-auto object-cover"
            />
          </div>

          {subtitle && (
            <div className="w-full max-w-md bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="text-gray-700 text-sm sm:text-base font-medium text-center leading-relaxed">
                {subtitle}
              </p>
            </div>
          )}

          <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-md p-6 space-y-5">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                Interview Status
              </span>
              {isAIPlaying && (
                <span className="text-sm font-semibold text-emerald-600">
                  AI Speaking
                </span>
              )}
            </div>

            <div className="h-px bg-gray-200" />

            <div className="flex justify-center">
              <Timer
                timeLeft={timeLeft}
                totalTime={currentQuestion?.timeLimit || 60}
              />
            </div>

            <div className="h-px bg-gray-200" />

            <div className="grid grid-cols-2 gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  {currentIndex + 1}
                </p>
                <p className="text-xs text-gray-400">
                  Current Question
                </p>
              </div>

              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  {questions.length}
                </p>
                <p className="text-xs text-gray-400">
                  Total Questions
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Question and answer */}
        <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-emerald-600 mb-6">
            Interview Practice
          </h2>

          {!isIntroPhase && (
            <div className="relative mb-6 bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm">
              <p className="text-xs sm:text-sm text-gray-400 mb-2">
                Question {currentIndex + 1} of {questions.length}
              </p>

              <p className="text-base sm:text-lg font-semibold text-gray-800 leading-relaxed">
                {currentQuestion?.question}
              </p>
            </div>
          )}

          <textarea
            placeholder="Type your answer here, or turn on the microphone..."
            onChange={(e) => setAnswer(e.target.value)}
            value={answer}
            disabled={isIntroPhase || Boolean(feedback) || isSubmitting}
            className="min-h-40 flex-1 bg-gray-100 p-4 sm:p-6 rounded-2xl resize-none outline-none border border-gray-200 focus:ring-2 focus:ring-emerald-500 transition text-gray-800 disabled:opacity-70"
          />

          {error && (
            <p className="mt-3 text-sm text-amber-700" role="alert">
              {error}
            </p>
          )}

          {!feedback ? (
            <div className="flex items-center gap-4 mt-6">
              <motion.button
                type="button"
                onClick={toggleMic}
                disabled={isIntroPhase || isSubmitting}
                whileTap={{ scale: 0.9 }}
                aria-label={isMicOn ? "Turn microphone off" : "Turn microphone on"}
                className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full bg-black text-white shadow-lg disabled:opacity-50"
              >
                {isMicOn ? (
                  <FaMicrophone size={20} />
                ) : (
                  <FaMicrophoneSlash size={20} />
                )}
              </motion.button>

              <motion.button
                type="button"
                onClick={submitAnswer}
                disabled={isIntroPhase || isSubmitting}
                whileTap={{ scale: 0.95 }}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-3 sm:py-4 rounded-2xl shadow-lg hover:opacity-90 transition font-semibold disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Submit Answer"}
              </motion.button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 bg-emerald-50 border border-emerald-200 p-5 rounded-2xl shadow-sm"
            >
              <p className="text-emerald-700 font-medium mb-4">
                {feedback}
              </p>

              <button
                type="button"
                onClick={handleNext}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-3 rounded-xl shadow-md hover:opacity-90 transition flex items-center justify-center gap-1"
              >
                {currentIndex + 1 >= questions.length
                  ? "Finish Interview"
                  : "Next Question"}
                <BsArrowRight size={18} />
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Step2Interview;
