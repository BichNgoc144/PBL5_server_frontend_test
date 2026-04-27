import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserProfile {
  username: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  total_score: number;
  bio?: string;
}

interface EditForm {
  full_name: string;
  bio: string;
}

const API = "http://localhost:5000";

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` };
}

// ─── API calls ────────────────────────────────────────────────────────────────
async function fetchProfile(): Promise<UserProfile> {
  const res = await fetch(`${API}/profile`, { headers: authHeaders() });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error("Không thể tải hồ sơ.");
  return res.json();
}

async function patchProfile(form: EditForm): Promise<UserProfile> {
  const res = await fetch(`${API}/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(form),
  });
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) {
    const d = await res.json();
    throw new Error(d.error || "Cập nhật thất bại.");
  }
  return res.json();
}

async function uploadAvatar(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("avatar", file);
  const res = await fetch(`${API}/profile/avatar`, { method: "POST", headers: authHeaders(), body: fd });
  if (!res.ok) throw new Error("Upload ảnh thất bại.");
  const d = await res.json();
  return d.avatar_url;
}

// ─── Level system ─────────────────────────────────────────────────────────────
function getLevel(score: number) {
  if (score >= 500) return { label: "Huyền thoại", color: "text-yellow-400", bg: "from-yellow-500/20 to-amber-500/20", border: "border-yellow-500/40", icon: "👑", next: null };
  if (score >= 200) return { label: "Cao thủ",     color: "text-purple-400", bg: "from-purple-500/20 to-indigo-500/20", border: "border-purple-500/40", icon: "⚡", next: 500 };
  if (score >= 100) return { label: "Học giỏi",    color: "text-blue-400",   bg: "from-blue-500/20 to-cyan-500/20",   border: "border-blue-500/40",   icon: "🌟", next: 200 };
  if (score >= 50)  return { label: "Tiến bộ",     color: "text-emerald-400",bg: "from-emerald-500/20 to-teal-500/20",border: "border-emerald-500/40", icon: "🌱", next: 100 };
  return              { label: "Mới bắt đầu",  color: "text-slate-400",  bg: "from-slate-500/20 to-slate-600/20",  border: "border-slate-500/40",  icon: "🐣", next: 50  };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="flex flex-col items-center gap-3">
        <div className="w-28 h-28 rounded-full bg-white/10" />
        <div className="h-6 w-36 bg-white/10 rounded-lg" />
        <div className="h-4 w-48 bg-white/10 rounded-lg" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3].map(i => <div key={i} className="h-20 bg-white/10 rounded-2xl" />)}
      </div>
      <div className="h-16 bg-white/10 rounded-xl" />
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({
  profile,
  onClose,
  onSaved,
}: {
  profile: UserProfile;
  onClose: () => void;
  onSaved: (p: UserProfile) => void;
}) {
  const [form, setForm] = useState<EditForm>({ full_name: profile.full_name, bio: profile.bio || "" });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>(profile.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) { setError("Họ tên không được để trống."); return; }
    setSaving(true); setError("");
    try {
      // 1. Upload avatar trước nếu có
      if (avatarFile) await uploadAvatar(avatarFile);
      // 2. PATCH thông tin
      const updated = await patchProfile(form);
      // Nếu vừa upload avatar, server đã lưu URL rồi → fetch lại để lấy avatar_url mới
      if (avatarFile) {
        const fresh = await fetchProfile();
        onSaved(fresh);
      } else {
        onSaved(updated);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-5">✏️ Chỉnh sửa hồ sơ</h3>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Avatar picker */}
        <div className="flex flex-col items-center mb-5">
          <div
            className="relative w-24 h-24 rounded-full cursor-pointer group"
            onClick={() => fileRef.current?.click()}
          >
            <img
              src={preview || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
              className="w-24 h-24 rounded-full object-cover border-4 border-white/10"
            />
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-2xl">📷</span>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <p className="text-xs text-slate-500 mt-2">Bấm để đổi ảnh đại diện</p>
        </div>

        {/* Fields */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Họ và tên *</label>
            <input
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Giới thiệu</label>
            <textarea
              value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              rows={3}
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm font-medium rounded-xl transition-all"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {saving ? (
              <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Đang lưu...</>
            ) : "💾 Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("token")) { navigate("/login"); return; }
    fetchProfile()
      .then(setProfile)
      .catch((err: Error) => {
        if (err.message === "UNAUTHORIZED") { localStorage.removeItem("token"); navigate("/login"); }
        else setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const level = profile ? getLevel(profile.total_score) : null;
  const nextScore = level?.next ?? null;
  const prevThreshold = profile
    ? profile.total_score >= 500 ? 200
    : profile.total_score >= 200 ? 100
    : profile.total_score >= 100 ? 50
    : profile.total_score >= 50  ? 0 : 0
    : 0;
  const progressPct = nextScore
    ? Math.min(100, ((profile!.total_score - prevThreshold) / (nextScore - prevThreshold)) * 100)
    : 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 flex flex-col items-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg mb-5">
        <Link to="/app" className="text-slate-500 hover:text-white transition-colors text-sm">← Dashboard</Link>
      </div>

      <div className="relative w-full max-w-lg bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
        {loading && <Skeleton />}

        {error && !loading && (
          <div className="text-center py-10">
            <p className="text-red-400">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm">Thử lại</button>
          </div>
        )}

        {profile && !loading && (
          <>
            {/* Avatar + name */}
            <div className="flex flex-col items-center text-center mb-7">
              <div className="relative mb-4">
                <img
                  src={profile.avatar_url || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
                  alt="avatar"
                  className="w-28 h-28 rounded-full object-cover border-4 border-indigo-500/40 shadow-xl"
                />
                <span className="absolute -bottom-1 -right-1 text-2xl">{level?.icon}</span>
              </div>
              <h2 className="text-2xl font-bold text-white">{profile.full_name || profile.username}</h2>
              <p className="text-slate-400 text-sm">@{profile.username} · {profile.email}</p>
              <span className={`mt-2 text-xs font-semibold px-3 py-1 rounded-full bg-white/10 ${level?.color}`}>
                {level?.label}
              </span>
            </div>

            {/* Level progress */}
            {nextScore && (
              <div className="mb-6">
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>{profile.total_score} điểm</span>
                  <span>→ {nextScore} điểm ({level?.label} tiếp theo)</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className={`bg-gradient-to-br ${level?.bg} border ${level?.border} rounded-2xl p-3 text-center`}>
                <p className="text-2xl font-black text-white">{profile.total_score}</p>
                <p className="text-slate-500 text-xs mt-0.5">Tổng điểm</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                <p className="text-2xl font-black text-emerald-300">●</p>
                <p className="text-slate-500 text-xs mt-0.5">Online</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                <p className="text-2xl font-black text-white">🔥</p>
                <p className="text-slate-500 text-xs mt-0.5">Streak</p>
              </div>
            </div>

            {/* Bio */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Giới thiệu</p>
              <p className="text-slate-300 text-sm leading-relaxed">
                {profile.bio?.trim() || "Chưa có thông tin giới thiệu."}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowEdit(true)}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-indigo-500/20 text-sm"
              >
                ✏️ Chỉnh sửa
              </button>
              <Link to="/app/quiz" className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold rounded-xl text-center text-sm transition-all">
                🎮 Làm Quiz
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Edit modal */}
      {showEdit && profile && (
        <EditModal
          profile={profile}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => setProfile(updated)}
        />
      )}
    </div>
  );
}

// import { useState, useEffect } from "react";
// import { useNavigate, Link } from "react-router-dom";

// // ─── Types ────────────────────────────────────────────────────────────────────
// interface UserProfile {
//   username: string;
//   email: string;
//   full_name: string;
//   avatar_url?: string;
//   total_score: number;
//   bio?: string;
// }

// // ─── API Helper ───────────────────────────────────────────────────────────────
// const API_BASE = "http://localhost:5000";

// async function fetchProfile(token: string): Promise<UserProfile> {
//   const res = await fetch(`${API_BASE}/profile`, {
//     headers: { Authorization: `Bearer ${token}` },
//   });

//   if (res.status === 401) {
//     throw new Error("UNAUTHORIZED");
//   }

//   if (!res.ok) {
//     throw new Error("Không thể tải thông tin hồ sơ.");
//   }

//   return res.json();
// }

// // ─── Skeleton Loader ──────────────────────────────────────────────────────────
// function ProfileSkeleton() {
//   return (
//     <div className="animate-pulse">
//       <div className="flex flex-col items-center mb-6">
//         <div className="w-28 h-28 rounded-full bg-white/10 mb-4" />
//         <div className="h-6 w-40 bg-white/10 rounded-lg mb-2" />
//         <div className="h-4 w-56 bg-white/10 rounded-lg" />
//       </div>
//       <div className="grid grid-cols-2 gap-4 mb-6">
//         <div className="h-24 bg-white/10 rounded-2xl" />
//         <div className="h-24 bg-white/10 rounded-2xl" />
//       </div>
//       <div className="h-20 bg-white/10 rounded-xl" />
//     </div>
//   );
// }

// // ─── Score Badge ──────────────────────────────────────────────────────────────
// function getScoreLevel(score: number): { label: string; color: string; icon: string } {
//   if (score >= 500) return { label: "Huyền thoại", color: "text-yellow-400", icon: "👑" };
//   if (score >= 200) return { label: "Cao thủ", color: "text-purple-400", icon: "⚡" };
//   if (score >= 100) return { label: "Học sinh giỏi", color: "text-blue-400", icon: "🌟" };
//   if (score >= 50)  return { label: "Đang tiến bộ", color: "text-emerald-400", icon: "🌱" };
//   return { label: "Mới bắt đầu", color: "text-slate-400", icon: "🐣" };
// }

// // ─── Component ────────────────────────────────────────────────────────────────
// export default function Profile() {
//   const navigate = useNavigate();

//   const [profile, setProfile] = useState<UserProfile | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState("");

//   // ── Fetch on mount ────────────────────────────────────────────────────────
//   useEffect(() => {
//     const token = localStorage.getItem("token");

//     if (!token) {
//       navigate("/login");
//       return;
//     }

//     fetchProfile(token)
//       .then(setProfile)
//       .catch((err: Error) => {
//         if (err.message === "UNAUTHORIZED") {
//           // Token hết hạn: dọn dẹp và redirect
//           localStorage.removeItem("token");
//           navigate("/login");
//         } else {
//           setError(err.message);
//         }
//       })
//       .finally(() => setIsLoading(false));
//   }, [navigate]);

//   // ── Render ────────────────────────────────────────────────────────────────
//   const level = profile ? getScoreLevel(profile.total_score) : null;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 flex flex-col items-center">
//       {/* Decorative */}
//       <div className="absolute inset-0 overflow-hidden pointer-events-none">
//         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-indigo-600/10 rounded-full blur-3xl" />
//       </div>

//       {/* Back link */}
//       <div className="relative w-full max-w-lg mb-6">
//         <Link to="/app" className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1">
//           ← Về Dashboard
//         </Link>
//       </div>

//       {/* Card */}
//       <div className="relative w-full max-w-lg bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">

//         {isLoading && <ProfileSkeleton />}

//         {error && !isLoading && (
//           <div className="text-center py-10">
//             <div className="text-5xl mb-4">😕</div>
//             <p className="text-red-400 font-medium">{error}</p>
//             <button
//               onClick={() => window.location.reload()}
//               className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-500 transition-colors"
//             >
//               Thử lại
//             </button>
//           </div>
//         )}

//         {profile && !isLoading && (
//           <>
//             {/* Avatar & Name */}
//             <div className="flex flex-col items-center text-center mb-8">
//               <div className="relative mb-4">
//                 <img
//                   src={profile.avatar_url || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
//                   alt="Avatar"
//                   className="w-28 h-28 rounded-full border-4 border-indigo-500/50 shadow-xl object-cover"
//                 />
//                 {/* Level badge */}
//                 <span className="absolute -bottom-1 -right-1 text-2xl">{level?.icon}</span>
//               </div>

//               <h2 className="text-2xl font-bold text-white">{profile.full_name || profile.username}</h2>
//               <p className="text-slate-400 text-sm mt-1">@{profile.username}</p>
//               <p className="text-slate-500 text-sm">{profile.email}</p>

//               <span className={`mt-2 text-xs font-semibold px-3 py-1 rounded-full bg-white/10 ${level?.color}`}>
//                 {level?.label}
//               </span>
//             </div>

//             {/* Stats Grid */}
//             <div className="grid grid-cols-2 gap-4 mb-6">
//               <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 rounded-2xl p-4 text-center">
//                 <p className="text-slate-400 text-xs font-medium mb-1">Tổng điểm</p>
//                 <p className="text-3xl font-black text-indigo-300">{profile.total_score}</p>
//                 <p className="text-slate-500 text-xs mt-1">điểm</p>
//               </div>
//               <div className="bg-gradient-to-br from-emerald-600/20 to-cyan-600/20 border border-emerald-500/20 rounded-2xl p-4 text-center">
//                 <p className="text-slate-400 text-xs font-medium mb-1">Trạng thái</p>
//                 <p className="text-lg font-bold text-emerald-300 mt-1">Đang học</p>
//                 <div className="flex items-center justify-center gap-1 mt-1">
//                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
//                   <span className="text-emerald-500 text-xs">Online</span>
//                 </div>
//               </div>
//             </div>

//             {/* Bio */}
//             <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
//               <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Giới thiệu</p>
//               <p className="text-slate-300 text-sm leading-relaxed">
//                 {profile.bio?.trim() || "Chưa có thông tin giới thiệu."}
//               </p>
//             </div>

//             {/* Actions */}
//             <div className="flex gap-3">
//               <button className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/20 text-sm">
//                 ✏️ Chỉnh sửa hồ sơ
//               </button>
//               <Link
//                 to="/app/quiz"
//                 className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold rounded-xl transition-all text-center text-sm"
//               >
//                 🎮 Làm Quiz
//               </Link>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

// // import { useState, useEffect } from "react";
// // import { Link } from "react-router-dom";

// // export default function Profile() {
// //   ///Mock data - Sau này bạn thay bằng dữ liệu lấy từ API
// //   const [profile, setProfile] = useState(null);
// //   // Gợi ý Logic gọi API sau này:
// //   useEffect(() => {
// //     const token = localStorage.getItem("token");
// //     fetch("http://localhost:5000/profile", {
// //       headers: { "Authorization": `Bearer ${token}` }
// //     })
// //     .then(res => res.json())
// //     .then(data => setProfile(data))
// //     .catch(err => console.error(err));
// //   }, []);


// //   return (
// //     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 flex flex-col items-center">
      
// //       {/* Nút quay lại */}
// //       <div className="w-full max-w-2xl mb-6">
// //         <Link to="/" className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-2">
// //           <span>&larr;</span> Về trang chủ
// //         </Link>
// //       </div>

// //       {/* Card Hồ sơ */}
// //       <div className="bg-white/80 p-8 rounded-3xl shadow-xl backdrop-blur-sm max-w-2xl w-full text-center">
// //         <div className="flex justify-center mb-6">
// //           <img 
// //             src={profile?.avatar_url || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
// //             alt="Avatar" 
// //             className="w-32 h-32 rounded-full border-4 border-indigo-200 shadow-md object-cover"
// //           />
// //         </div>
        
// //         <h2 className="text-3xl font-bold text-gray-800 mb-2">{profile?.full_name || profile?.username}</h2>
// //         <p className="text-gray-500 mb-6">{profile?.email}</p>

// //         <div className="grid grid-cols-2 gap-4 mb-8">
// //           <div className="bg-gradient-to-br from-purple-100 to-indigo-100 p-4 rounded-2xl shadow-sm border border-indigo-50">
// //             <p className="text-gray-600 text-sm font-medium">Tổng điểm</p>
// //             <p className="text-3xl font-bold text-indigo-600">{profile?.total_score} 🌟</p>
// //           </div>
// //           <div className="bg-gradient-to-br from-blue-100 to-cyan-100 p-4 rounded-2xl shadow-sm border border-blue-50">
// //             <p className="text-gray-600 text-sm font-medium">Trạng thái</p>
// //             <p className="text-lg font-bold text-blue-600 mt-1">Đang học</p>
// //           </div>
// //         </div>

// //         <div className="text-left bg-gray-50 p-4 rounded-xl mb-8">
// //           <p className="text-sm text-gray-500 font-semibold mb-1">Giới thiệu bản thân:</p>
// //           <p className="text-gray-700">{profile?.bio || "Chưa có thông tin giới thiệu."}</p>
// //         </div>

// //         <button className="px-8 py-3 bg-white border-2 border-indigo-200 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-all">
// //           Chỉnh sửa hồ sơ
// //         </button>
// //       </div>
// //     </div>
// //   );
// // }