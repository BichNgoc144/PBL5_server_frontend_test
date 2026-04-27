import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DayStats {
  date: string;
  score: number;
  correct: number;
  total: number;
}

interface StatsData {
  total_score: number;
  total_quizzes: number;
  total_correct: number;
  total_questions: number;
  accuracy: number;
  streak_days: number;
  weekly: DayStats[];
}

const API = "http://localhost:5000";

async function fetchStats(): Promise<StatsData> {
  const res = await fetch(`${API}/stats/me`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error("Không thể tải thống kê.");
  return res.json();
}

// ─── Mini bar chart (pure CSS/SVG, không cần thư viện) ───────────────────────
function WeeklyChart({ data }: { data: DayStats[] }) {
  const max = Math.max(...data.map(d => d.score), 1);
  const days = ["CN","T2","T3","T4","T5","T6","T7"];

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2 h-32">
        {data.map((d, i) => {
          const pct = (d.score / max) * 100;
          const dayLabel = days[new Date(d.date + "T00:00:00").getDay()];
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 border border-white/10 text-white text-xs rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                <div className="font-semibold">{d.score} điểm</div>
                <div className="text-slate-400">{d.correct}/{d.total} đúng</div>
              </div>
              {/* Bar */}
              <div
                className={`w-full rounded-t-lg transition-all duration-500 ${
                  d.score > 0
                    ? "bg-gradient-to-t from-indigo-600 to-indigo-400"
                    : "bg-white/5"
                }`}
                style={{ height: `${Math.max(pct, d.score > 0 ? 8 : 4)}%` }}
              />
            </div>
          );
        })}
      </div>
      {/* Day labels */}
      <div className="flex gap-2">
        {data.map((d, i) => {
          const dayLabel = days[new Date(d.date + "T00:00:00").getDay()];
          const isToday  = d.date === new Date().toISOString().split("T")[0];
          return (
            <div key={i} className={`flex-1 text-center text-xs font-medium ${isToday ? "text-indigo-400" : "text-slate-600"}`}>
              {dayLabel}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Accuracy ring (SVG) ──────────────────────────────────────────────────────
function AccuracyRing({ pct }: { pct: number }) {
  const r   = 36;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  const color = pct >= 80 ? "#10b981" : pct >= 60 ? "#f59e0b" : pct >= 40 ? "#6366f1" : "#ef4444";

  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className="rotate-[-90deg]">
      <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
      <circle
        cx="48" cy="48" r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
    </svg>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = "text-white" }: {
  icon: string; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <div className="text-xl mb-2">{icon}</div>
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-slate-600 mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function StatsSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white/10 rounded-2xl"/>)}
      </div>
      <div className="h-48 bg-white/10 rounded-2xl"/>
      <div className="h-32 bg-white/10 rounded-2xl"/>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MyStats() {
  const navigate = useNavigate();
  const [stats,   setStats]   = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/login"); return; }
    fetchStats()
      .then(setStats)
      .catch((err: Error) => {
        if (err.message === "UNAUTHORIZED") { localStorage.removeItem("token"); navigate("/login"); }
        else setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 flex flex-col items-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg mb-5">
        <Link to="/app" className="text-slate-500 hover:text-white transition-colors text-sm">← Dashboard</Link>
      </div>

      <div className="relative w-full max-w-lg">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">📊 Thống kê của tôi</h1>
          <p className="text-slate-500 text-sm mt-1">Theo dõi quá trình học tập của bạn</p>
        </div>

        {loading && <StatsSkeleton />}

        {error && !loading && (
          <div className="text-center py-10 bg-white/5 border border-white/10 rounded-3xl">
            <p className="text-red-400">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm">Thử lại</button>
          </div>
        )}

        {stats && !loading && (
          <div className="space-y-4">

            {/* Accuracy ring + streak */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex items-center gap-6">
              <div className="relative flex-shrink-0">
                <AccuracyRing pct={stats.accuracy} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-white">{stats.accuracy}%</span>
                  <span className="text-xs text-slate-500">đúng</span>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-slate-500 text-xs">Tổng câu đúng</p>
                  <p className="text-white font-bold text-lg">{stats.total_correct} / {stats.total_questions}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <p className="text-white font-bold">{stats.streak_days} ngày</p>
                    <p className="text-slate-500 text-xs">Chuỗi học liên tục</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stat cards grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon="🏆" label="Tổng điểm" value={stats.total_score} color="text-yellow-300" />
              <StatCard icon="🎮" label="Số lần chơi" value={stats.total_quizzes} color="text-indigo-300" />
              <StatCard
                icon="✅"
                label="Tỉ lệ chính xác"
                value={`${stats.accuracy}%`}
                color={stats.accuracy >= 80 ? "text-emerald-300" : stats.accuracy >= 60 ? "text-yellow-300" : "text-red-300"}
              />
              <StatCard
                icon="🔥"
                label="Streak"
                value={`${stats.streak_days} ngày`}
                sub={stats.streak_days >= 7 ? "🏅 Kỷ lục!" : ""}
                color="text-orange-300"
              />
            </div>

            {/* Weekly chart */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-white">Điểm 7 ngày gần nhất</h3>
                <span className="text-xs text-slate-500">
                  Tổng: {stats.weekly.reduce((s, d) => s + d.score, 0)} điểm
                </span>
              </div>
              <WeeklyChart data={stats.weekly} />
            </div>

            {/* Motivational message */}
            <div className={`rounded-2xl p-4 text-sm font-medium border ${
              stats.accuracy >= 80
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : stats.accuracy >= 60
                ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-300"
                : "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
            }`}>
              {stats.accuracy >= 80
                ? "🌟 Xuất sắc! Bạn đang học rất tốt. Hãy tiếp tục phát huy!"
                : stats.accuracy >= 60
                ? "💪 Khá tốt! Luyện thêm một chút nữa là đạt top rồi."
                : stats.total_quizzes === 0
                ? "🎮 Hãy làm Quiz đầu tiên để bắt đầu hành trình học tập!"
                : "📚 Đừng nản lòng! Ôn lại từ vựng và thử lại nhé."}
            </div>

            {/* CTA */}
            <Link
              to="/app/quiz"
              className="block w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-center shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]"
            >
              🎮 Bắt đầu Quiz ngay
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}