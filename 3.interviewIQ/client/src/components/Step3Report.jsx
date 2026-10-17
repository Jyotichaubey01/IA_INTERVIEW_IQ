
import React from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  buildStyles,
  CircularProgressbar,
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function Step3Report({ report }) {
  const navigate = useNavigate();

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">
          No interview report is available.
        </p>
      </div>
    );
  }

  const {
    finalScore,
    confidence,
    communication,
    correctness,
    questionWiseScore = [],
    questions = [],
    answers = [],
    role = "Developer",
    mode = "Technical",
  } = report;

  // Support both the existing backend report format and
  // the local report format from the fixed-question interview.
  const hasEvaluatedScores =
    finalScore !== undefined &&
    finalScore !== null &&
    questionWiseScore.length > 0;

  const reportQuestions =
    questionWiseScore.length > 0
      ? questionWiseScore
      : questions.map((question, index) => {
          const questionText =
            typeof question === "string"
              ? question
              : question?.question || "Question not available";

          const answerData = answers[index] || {};

          return {
            question: questionText,
            answer: answerData.answer || "",
            feedback: answerData.feedback || "",
            score: null,
          };
        });

  const scoreData = questionWiseScore.map((item, index) => ({
    name: `Q${index + 1}`,
    score: Number(item.score) || 0,
  }));

  const score = Number(finalScore) || 0;
  const percentage = Math.min(100, Math.max(0, score * 10));

  const skills = [
    { label: "Confidence", value: confidence },
    { label: "Communication", value: communication },
    { label: "Correctness", value: correctness },
  ].filter((skill) => skill.value !== undefined && skill.value !== null);

  let performanceText = "Practice report completed.";
  let shortTagline =
    "Review your answers and continue practicing.";

  if (hasEvaluatedScores) {
    if (score >= 8) {
      performanceText = "Strong interview performance.";
      shortTagline = "Keep practicing clear, structured answers.";
    } else if (score >= 5) {
      performanceText = "Good foundation; improvement is possible.";
      shortTagline = "Work on clarity and stronger examples.";
    } else {
      performanceText = "More practice is recommended.";
      shortTagline = "Focus on fundamentals and answer structure.";
    }
  }

  const downloadPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    let currentY = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(16, 150, 100);
    doc.text(
      "Interview Practice Report",
      pageWidth / 2,
      currentY,
      { align: "center" }
    );

    currentY += 8;

    doc.setDrawColor(16, 150, 100);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);

    doc.text(`Role: ${role}`, margin, currentY);
    currentY += 7;
    doc.text(`Interview type: ${mode}`, margin, currentY);
    currentY += 10;

    if (hasEvaluatedScores) {
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(
        margin,
        currentY,
        contentWidth,
        17,
        3,
        3,
        "F"
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(
        `Final Score: ${score}/10`,
        pageWidth / 2,
        currentY + 10,
        { align: "center" }
      );

      currentY += 25;

      if (skills.length > 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        skills.forEach((skill) => {
          doc.text(
            `${skill.label}: ${skill.value}/10`,
            margin + 3,
            currentY
          );
          currentY += 7;
        });

        currentY += 5;
      }
    } else {
      doc.setFont("helvetica", "bold");
      doc.text(
        "Practice summary: Fixed questions; no AI scoring performed.",
        margin,
        currentY
      );
      currentY += 12;
    }

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [["#", "Question", "Answer", "Score / Feedback"]],
      body: reportQuestions.map((item, index) => [
        String(index + 1),
        item.question || "Question not available",
        item.answer || "No answer provided",
        item.score !== null && item.score !== undefined
          ? `${item.score}/10\n${item.feedback || ""}`
          : item.feedback || "Not evaluated",
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: "linebreak",
        valign: "top",
      },
      headStyles: {
        fillColor: [16, 150, 100],
        textColor: 255,
      },
      columnStyles: {
        0: { cellWidth: 9 },
        1: { cellWidth: 49 },
        2: { cellWidth: 55 },
        3: { cellWidth: "auto" },
      },
    });

    doc.save("Interview_Practice_Report.pdf");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 px-4 sm:px-6 lg:px-10 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => navigate("/history")}
            aria-label="Go to interview history"
            className="mt-1 p-3 rounded-full bg-white shadow hover:shadow-md transition"
          >
            <FaArrowLeft className="text-gray-600" />
          </button>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Interview Practice Report
            </h1>
            <p className="text-gray-500 mt-2">
              {role} · {mode} Interview
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={downloadPDF}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl shadow-md transition font-semibold"
        >
          Download PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Score and skills */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-6 sm:p-8 text-center"
          >
            <h3 className="text-gray-500 mb-6">
              Overall Performance
            </h3>

            {hasEvaluatedScores ? (
              <>
                <div className="relative w-28 h-28 mx-auto">
                  <CircularProgressbar
                    value={percentage}
                    text={`${score}/10`}
                    styles={buildStyles({
                      textSize: "18px",
                      pathColor: "#10b981",
                      textColor: "#374151",
                      trailColor: "#e5e7eb",
                    })}
                  />
                </div>
                <p className="text-gray-400 mt-3 text-sm">
                  Out of 10
                </p>
              </>
            ) : (
              <div className="py-5">
                <p className="text-2xl font-bold text-emerald-600">
                  {reportQuestions.length}
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Questions reviewed
                </p>
                <p className="text-xs text-gray-400 mt-3">
                  Scores are unavailable because automatic evaluation
                  was not performed.
                </p>
              </div>
            )}

            <div className="mt-4">
              <p className="font-semibold text-gray-800">
                {performanceText}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                {shortTagline}
              </p>
            </div>
          </motion.div>

          {hasEvaluatedScores && skills.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-6 sm:p-8"
            >
              <h3 className="text-lg font-semibold text-gray-700 mb-6">
                Skill Evaluation
              </h3>

              <div className="space-y-5">
                {skills.map((skill) => {
                  const value = Math.min(
                    10,
                    Math.max(0, Number(skill.value) || 0)
                  );

                  return (
                    <div key={skill.label}>
                      <div className="flex justify-between mb-2 text-sm">
                        <span>{skill.label}</span>
                        <span className="font-semibold text-green-600">
                          {value}/10
                        </span>
                      </div>

                      <div className="bg-gray-200 h-3 rounded-full overflow-hidden">
                        <div
                          className="bg-green-500 h-full rounded-full"
                          style={{ width: `${value * 10}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>

        {/* Chart and question details */}
        <div className="lg:col-span-2 space-y-6">
          {hasEvaluatedScores && scoreData.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-8"
            >
              <h3 className="text-lg font-semibold text-gray-700 mb-6">
                Performance Trend
              </h3>

              <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={scoreData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#22c55e"
                      fill="#bbf7d0"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-8"
          >
            <h3 className="text-lg font-semibold text-gray-700 mb-6">
              Question Breakdown
            </h3>

            <div className="space-y-6">
              {reportQuestions.map((item, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200"
                >
                  <p className="text-xs text-gray-400 mb-2">
                    Question {index + 1}
                  </p>

                  <p className="font-semibold text-gray-800 leading-relaxed">
                    {item.question || "Question not available"}
                  </p>

                  <div className="mt-4 bg-white border border-gray-200 p-4 rounded-lg">
                    <p className="text-xs font-semibold text-gray-500 mb-1">
                      Your Answer
                    </p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {item.answer || "No answer provided."}
                    </p>
                  </div>

                  <div className="mt-3 bg-green-50 border border-green-200 p-4 rounded-lg">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="text-xs text-green-700 font-semibold">
                        {item.score !== null &&
                        item.score !== undefined
                          ? "Evaluation Feedback"
                          : "Practice Feedback"}
                      </p>

                      {item.score !== null &&
                        item.score !== undefined && (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                            {item.score}/10
                          </span>
                        )}
                    </div>

                    <p className="text-sm text-gray-700 leading-relaxed">
                      {item.feedback ||
                        "No feedback available for this question."}
                    </p>
                  </div>
                </div>
              ))}

              {reportQuestions.length === 0 && (
                <p className="text-gray-500">
                  No question details are available in this report.
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default Step3Report;
