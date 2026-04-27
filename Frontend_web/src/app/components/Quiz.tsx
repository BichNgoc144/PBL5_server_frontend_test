import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────
interface QuizOption {
  id: number;
  text_vn: string;
}

interface QuizQuestion {
  dict_id: number;
  question_en: string;
  options: QuizOption[];
  correct_id: number;
}

interface AnswerRecord {
  dict_id: number;
  is_correct: boolean;
}

interface SubmitResult {
  total_score: number;
  gained_score?: number;
  message?: string;
}

// ─── API Helpers ──────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:5000";
const QUIZ_LIMIT = 5;

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function fetchQuestions(): Promise<QuizQuestion[]> {
  const res = await fetch(`${API_BASE}/quiz/generate?limit=${QUIZ_LIMIT}`, {
    headers: getAuthHeaders(),
  });

  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error("Không thể tải câu hỏi. Vui lòng thử lại.");

  return res.json();
}

async function submitAnswers(answers: AnswerRecord[]): Promise<SubmitResult> {
  const res = await fetch(`${API_BASE}/quiz/submit`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ answers }),
  });

  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error("Không thể gửi kết quả.");

  return res.json();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Progress bar hiển thị câu hỏi hiện tại */
function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? ((current) / total) * 100 : 0;
  return (
    <div className="w-full bg-white/10 rounded-full h-2">
      <div
        className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Hiển thị đáp án với animation feedback */
function AnswerButton({
  option,
  state,
  onClick,
}: {
  option: QuizOption;
  state: "idle" | "correct" | "wrong";
  onClick: () => void;
}) {
  const base =
    "w-full p-4 rounded-2xl border-2 font-semibold text-left transition-all duration-200 flex items-center gap-3";
  const styles = {
    idle: "bg-white/5 border-white/10 text-slate-300 hover:border-indigo-400 hover:bg-indigo-500/10 hover:text-white hover:scale-[1.01] active:scale-[0.99]",
    correct: "bg-emerald-500/20 border-emerald-500 text-emerald-300 scale-[1.01]",
    wrong: "bg-red-500/20 border-red-500 text-red-300 opacity-60",
  };

  return (
    <button
      onClick={onClick}
      disabled={state !== "idle"}
      className={`${base} ${styles[state]}`}
    >
      <span className="text-lg">
        {state === "correct" ? "✅" : state === "wrong" ? "❌" : "○"}
      </span>
      {option.text_vn}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
type GamePhase = "loading" | "playing" | "answered" | "submitting" | "result" | "error";

export default function Quiz() {
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<GamePhase>("loading");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localScore, setLocalScore] = useState(0);           // Điểm tạm tính
  const [answers, setAnswers] = useState<AnswerRecord[]>([]); // Mảng gửi server
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [finalScore, setFinalScore] = useState<SubmitResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // ── Load questions ─────────────────────────────────────────────────────────
  const loadQuestions = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    setPhase("loading");
    setCurrentIndex(0);
    setLocalScore(0);
    setAnswers([]);
    setSelectedId(null);
    setFinalScore(null);
    setErrorMsg("");

    try {
      const qs = await fetchQuestions();
      setQuestions(qs);
      setPhase("playing");
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "UNAUTHORIZED") {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setErrorMsg(err instanceof Error ? err.message : "Lỗi không xác định.");
        setPhase("error");
      }
    }
  }, [navigate]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  // ── Answer handler ─────────────────────────────────────────────────────────
  const handleAnswer = (option: QuizOption) => {
    if (phase !== "playing") return;

    const current = questions[currentIndex];
    const isCorrect = option.id === current.correct_id;

    setSelectedId(option.id);
    setPhase("answered");

    if (isCorrect) setLocalScore((s) => s + 10);

    const newAnswers = [...answers, { dict_id: current.dict_id, is_correct: isCorrect }];
    setAnswers(newAnswers);

    // Sau 1.2s: chuyển câu hỏi hoặc submit
    setTimeout(async () => {
      const nextIndex = currentIndex + 1;

      if (nextIndex < questions.length) {
        setCurrentIndex(nextIndex);
        setSelectedId(null);
        setPhase("playing");
      } else {
        // Làm xong tất cả -> submit
        setPhase("submitting");
        try {
          const result = await submitAnswers(newAnswers);
          setFinalScore(result);
          setPhase("result");
        } catch (err: unknown) {
          if (err instanceof Error && err.message === "UNAUTHORIZED") {
            localStorage.removeItem("token");
            navigate("/login");
          } else {
            setErrorMsg(err instanceof Error ? err.message : "Lỗi gửi kết quả.");
            setPhase("error");
          }
        }
      }
    }, 1200);
  };

  // ── Computed ───────────────────────────────────────────────────────────────
  const current = questions[currentIndex] ?? null;
  const correctCount = answers.filter((a) => a.is_correct).length;
  const accuracy = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;

  // ── Render helpers ─────────────────────────────────────────────────────────
  const getOptionState = (opt: QuizOption): "idle" | "correct" | "wrong" => {
    if (phase !== "answered" || selectedId === null) return "idle";
    if (opt.id === current?.correct_id) return "correct";
    if (opt.id === selectedId) return "wrong";
    return "idle";
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4 flex flex-col items-center">
      {/* Decorative */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="relative w-full max-w-xl flex justify-between items-center mb-6 mt-2">
        <Link to="/app" className="text-slate-500 hover:text-white transition-colors text-sm">
          ← Thoát
        </Link>
        {(phase === "playing" || phase === "answered") && (
          <div className="flex items-center gap-2 bg-white/10 border border-white/10 px-4 py-1.5 rounded-full">
            <span className="text-yellow-400">⭐</span>
            <span className="text-white font-bold text-sm">{localScore} điểm</span>
          </div>
        )}
      </div>

      {/* ── LOADING ── */}
      {phase === "loading" && (
        <div className="relative flex flex-col items-center justify-center flex-1 gap-4">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Đang tải câu hỏi...</p>
        </div>
      )}

      {/* ── ERROR ── */}
      {phase === "error" && (
        <div className="relative w-full max-w-xl bg-white/5 border border-white/10 rounded-3xl p-10 text-center">
          <div className="text-5xl mb-4">😵</div>
          <p className="text-red-400 font-medium mb-6">{errorMsg}</p>
          <button onClick={loadQuestions}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors">
            Thử lại
          </button>
        </div>
      )}

      {/* ── PLAYING / ANSWERED ── */}
      {(phase === "playing" || phase === "answered") && current && (
        <div className="relative w-full max-w-xl">
          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span>Câu {currentIndex + 1} / {questions.length}</span>
              <span>{localScore} điểm</span>
            </div>
            <ProgressBar current={currentIndex + 1} total={questions.length} />
          </div>

          {/* Question card */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-4">
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-4 text-center font-medium">
              Từ vựng này có nghĩa là gì?
            </p>
            <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 rounded-2xl py-10 text-center mb-8">
              <h1 className="text-6xl font-black text-white capitalize tracking-wide drop-shadow-lg">
                {current.question_en}
              </h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {current.options.map((opt) => (
                <AnswerButton
                  key={opt.id}
                  option={opt}
                  state={getOptionState(opt)}
                  onClick={() => handleAnswer(opt)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SUBMITTING ── */}
      {phase === "submitting" && (
        <div className="relative flex flex-col items-center justify-center flex-1 gap-4">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Đang gửi kết quả...</p>
        </div>
      )}

      {/* ── RESULT ── */}
      {phase === "result" && finalScore && (
        <div className="relative w-full max-w-xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-center">
          <div className="text-7xl mb-4">
            {accuracy >= 80 ? "🏆" : accuracy >= 60 ? "🎉" : accuracy >= 40 ? "💪" : "📚"}
          </div>
          <h2 className="text-3xl font-black text-white mb-2">
            {accuracy >= 80 ? "Xuất sắc!" : accuracy >= 60 ? "Tốt lắm!" : accuracy >= 40 ? "Cố lên!" : "Cần luyện thêm!"}
          </h2>
          <p className="text-slate-400 mb-8">Bạn đã hoàn thành {questions.length} câu hỏi</p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-2xl font-black text-indigo-300">{localScore}</p>
              <p className="text-slate-500 text-xs mt-1">Điểm kỳ này</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-2xl font-black text-emerald-300">{correctCount}/{questions.length}</p>
              <p className="text-slate-500 text-xs mt-1">Đúng</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-2xl font-black text-yellow-300">{finalScore.total_score}</p>
              <p className="text-slate-500 text-xs mt-1">Tổng điểm</p>
            </div>
          </div>

          {/* Accuracy bar */}
          <div className="mb-8">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Độ chính xác</span>
              <span>{accuracy}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-1000 ${
                  accuracy >= 80 ? "bg-emerald-500" : accuracy >= 60 ? "bg-yellow-500" : "bg-red-500"
                }`}
                style={{ width: `${accuracy}%` }}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={loadQuestions}
              className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
              🔄 Chơi lại
            </button>
            <Link to="/app/profile"
              className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold rounded-2xl transition-all text-center flex items-center justify-center">
              👤 Xem điểm
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// import { useState, useEffect } from "react";
// import { Link } from "react-router-dom";

// export default function Quiz() {
//   const [currentQuestion, setCurrentQuestion] = useState(0);
//   const [score, setScore] = useState(0);
//   const [showResult, setShowResult] = useState(false);

//   // Mock Data - Dữ liệu này sẽ được lấy từ API /quiz/generate
//   const [questions, setQuestions] = useState([
//     {
//       dict_id: 1,
//       question_en: "Apple",
//       options: [
//         { id: 2, text_vn: "Quả chuối" },
//         { id: 1, text_vn: "Quả táo" },
//         { id: 3, text_vn: "Con mèo" },
//         { id: 4, text_vn: "Cái bàn" }
//       ],
//       correct_id: 1
//     },
//     {
//       dict_id: 5,
//       question_en: "Cat",
//       options: [
//         { id: 6, text_vn: "Con chó" },
//         { id: 7, text_vn: "Con chim" },
//         { id: 5, text_vn: "Con mèo" },
//         { id: 8, text_vn: "Cái ghế" }
//       ],
//       correct_id: 5
//     }
//   ]);

//   const handleAnswerOptionClick = (isCorrect: boolean) => {
//     if (isCorrect) {
//       setScore(score + 10);
//     }

//     const nextQuestion = currentQuestion + 1;
//     if (nextQuestion < questions.length) {
//       setCurrentQuestion(nextQuestion);
//     } else {
//       setShowResult(true);
//       // Gợi ý: Tại đây bạn sẽ gọi API /quiz/submit để gửi mảng kết quả lên server lưu điểm
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 flex flex-col items-center">
      
//       <div className="w-full max-w-2xl mb-6 flex justify-between items-center">
//         <Link to="/" className="text-indigo-600 hover:text-indigo-800 font-medium">
//           &larr; Thoát
//         </Link>
//         <div className="bg-white px-4 py-1 rounded-full shadow text-sm font-bold text-emerald-600">
//           Điểm: {score}
//         </div>
//       </div>

//       <div className="bg-white/90 p-8 rounded-3xl shadow-xl backdrop-blur-sm max-w-2xl w-full">
//         {showResult ? (
//           <div className="text-center py-10">
//             <div className="text-6xl mb-4">🏆</div>
//             <h2 className="text-3xl font-bold text-gray-800 mb-4">Hoàn thành bài tập!</h2>
//             <p className="text-xl text-gray-600 mb-8">Bạn đã đạt được <span className="text-emerald-500 font-bold">{score}</span> điểm.</p>
//             <button 
//               onClick={() => window.location.reload()}
//               className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:scale-105 transition-transform"
//             >
//               Chơi lại
//             </button>
//           </div>
//         ) : (
//           <>
//             <div className="mb-8 text-center">
//               <h2 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-2">
//                 Câu hỏi {currentQuestion + 1} / {questions.length}
//               </h2>
//               <p className="text-xl text-gray-700 font-medium mb-6">Từ vựng này có nghĩa là gì?</p>
              
//               <div className="bg-gradient-to-r from-indigo-100 to-purple-100 py-10 rounded-2xl border border-indigo-50 shadow-inner">
//                 <h1 className="text-5xl font-black text-indigo-700 capitalize">
//                   {questions[currentQuestion].question_en}
//                 </h1>
//               </div>
//             </div>

//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//               {questions[currentQuestion].options.map((option) => (
//                 <button
//                   key={option.id}
//                   onClick={() => handleAnswerOptionClick(option.id === questions[currentQuestion].correct_id)}
//                   className="w-full p-4 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 transition-colors shadow-sm"
//                 >
//                   {option.text_vn}
//                 </button>
//               ))}
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }