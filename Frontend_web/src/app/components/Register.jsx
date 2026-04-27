import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

// ─── API Helper ───────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:5000";

async function registerUser(form) {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Đăng ký thất bại. Vui lòng thử lại.");
  }
}

// ─── Step definitions ─────────────────────────────────────────────────────────
const STEPS = ["Tài khoản", "Hồ sơ"];

// ─── Component ────────────────────────────────────────────────────────────────
export default function Register() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0); // Multi-step wizard
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
    bio: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  // Validate step 1 trước khi chuyển sang step 2
  const validateStep0 = () => {
    if (!form.username.trim()) { setError("Vui lòng nhập tên đăng nhập."); return false; }
    if (form.username.trim().length < 3) { setError("Tên đăng nhập phải có ít nhất 3 ký tự."); return false; }
    if (!form.email.trim()) { setError("Vui lòng nhập email."); return false; }
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) { setError("Định dạng email không hợp lệ."); return false; }
    if (!form.password) { setError("Vui lòng nhập mật khẩu."); return false; }
    if (form.password.length < 6) { setError("Mật khẩu phải có ít nhất 6 ký tự."); return false; }
    return true;
  };

  const handleNext = () => {
    if (validateStep0()) {
      setError("");
      setStep(1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.full_name.trim()) {
      setError("Vui lòng nhập họ và tên.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await registerUser(form);
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/40 mb-4">
            <span className="text-3xl">🤖</span>
          </div>
          <h1 className="text-2xl font-bold text-white">AI Learning</h1>
          <p className="text-slate-400 text-sm mt-1">Tạo tài khoản để bắt đầu</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-6">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < step ? "bg-emerald-500 text-white" :
                  i === step ? "bg-indigo-500 text-white ring-2 ring-indigo-400/50" :
                  "bg-white/10 text-slate-500"
                }`}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span className={`text-sm font-medium ${i === step ? "text-white" : "text-slate-500"}`}>
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px ${i < step ? "bg-emerald-500" : "bg-white/10"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 mb-5 text-sm">
              <span className="text-lg flex-shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* ── STEP 0: Account Info ─────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-4">Thông tin tài khoản</h2>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Tên đăng nhập *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">👤</span>
                  <input
                    type="text" name="username" value={form.username} onChange={handleChange}
                    placeholder="vd: hocvien123"
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">✉️</span>
                  <input
                    type="email" name="email" value={form.email} onChange={handleChange}
                    placeholder="example@email.com"
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Mật khẩu *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">🔒</span>
                  <input
                    type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange}
                    placeholder="Ít nhất 6 ký tự"
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl pl-10 pr-12 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                {/* Password strength hint */}
                {form.password.length > 0 && (
                  <div className="mt-2 flex gap-1">
                    {[1,2,3].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                        form.password.length >= i * 4
                          ? i === 1 ? "bg-red-500" : i === 2 ? "bg-yellow-500" : "bg-emerald-500"
                          : "bg-white/10"
                      }`} />
                    ))}
                    <span className="text-xs text-slate-500 ml-1">
                      {form.password.length < 4 ? "Yếu" : form.password.length < 8 ? "Trung bình" : "Mạnh"}
                    </span>
                  </div>
                )}
              </div>

              <button type="button" onClick={handleNext}
                className="w-full mt-2 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
                Tiếp theo →
              </button>
            </div>
          )}

          {/* ── STEP 1: Profile Info ─────────────────────────────── */}
          {step === 1 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-4">Hồ sơ cá nhân</h2>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Họ và tên *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">🪪</span>
                  <input
                    type="text" name="full_name" value={form.full_name} onChange={handleChange}
                    placeholder="Tên hiển thị của bạn"
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Giới thiệu bản thân <span className="text-slate-600">(không bắt buộc)</span>
                </label>
                <textarea
                  name="bio" value={form.bio} onChange={handleChange}
                  placeholder="Kể một chút về bạn..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setStep(0); setError(""); }}
                  className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold rounded-xl transition-all">
                  ← Quay lại
                </button>
                <button type="submit" disabled={isLoading}
                  className="flex-[2] py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Đang tạo tài khoản...
                    </>
                  ) : "🎉 Tạo tài khoản"}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-slate-500 text-sm mt-6">
            Đã có tài khoản?{" "}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Đăng nhập
            </Link>
          </p>
        </div>

        <div className="text-center mt-4">
          <Link to="/" className="text-slate-600 hover:text-slate-400 text-sm transition-colors">
            ← Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";

// export default function Register() {
//   const navigate = useNavigate();
//   const [formData, setFormData] = useState({
//     username: "",
//     email: "",
//     password: "",
//     full_name: "",
//     bio: ""
//   });
  
//   const [error, setError] = useState("");
//   const [isLoading, setIsLoading] = useState(false);

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     setIsLoading(true);

//     try {
//       const response = await fetch("http://localhost:5000/register", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(formData),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         setError(data.error || "Có lỗi xảy ra, vui lòng thử lại.");
//         setIsLoading(false);
//         return;
//       }

//       // Thành công thì chuyển hướng về trang Login
//       alert("Đăng ký thành công!");
//       navigate("/login");
      
//     } catch (err) {
//       setError("Không thể kết nối đến máy chủ.");
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 flex items-center justify-center">
      
//       <div className="bg-white/90 p-8 md:p-10 rounded-3xl shadow-xl backdrop-blur-sm max-w-lg w-full">
        
//         <div className="mb-6">
//           <Link to="/" className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">
//             &larr; Về trang chủ
//           </Link>
//         </div>

//         <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
//           Tạo tài khoản mới
//         </h2>
//         <p className="text-gray-500 mb-8">Điền thông tin để bắt đầu hành trình học tập.</p>

//         {error && (
//           <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm font-medium">
//             {error}
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="space-y-4">
          
//           {/* Nhóm thông tin Đăng nhập */}
//           <div className="space-y-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
//             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Thông tin tài khoản</h3>
            
//             <input 
//               type="text" name="username" placeholder="Tên đăng nhập *" required
//               value={formData.username} onChange={handleChange}
//               className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
//             />
            
//             <input 
//               type="email" name="email" placeholder="Email *" required
//               value={formData.email} onChange={handleChange}
//               className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
//             />
            
//             <input 
//               type="password" name="password" placeholder="Mật khẩu (ít nhất 6 ký tự) *" required minLength={6}
//               value={formData.password} onChange={handleChange}
//               className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
//             />
//           </div>

//           {/* Nhóm thông tin Hồ sơ cá nhân */}
//           <div className="space-y-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
//             <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Hồ sơ cá nhân</h3>
            
//             <input 
//               type="text" name="full_name" placeholder="Họ và tên hiển thị *" required
//               value={formData.full_name} onChange={handleChange}
//               className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
//             />

//             <textarea 
//               name="bio" placeholder="Giới thiệu ngắn về bạn (không bắt buộc)" rows={2}
//               value={formData.bio} onChange={handleChange}
//               className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none"
//             />
//           </div>

//           <button 
//             type="submit" 
//             disabled={isLoading}
//             className={`w-full py-4 text-white text-lg font-bold rounded-xl shadow-lg transition-all ${
//               isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-indigo-500/50 hover:scale-[1.02]"
//             }`}
//           >
//             {isLoading ? "Đang xử lý..." : "Đăng ký ngay"}
//           </button>
//         </form>

//         <p className="mt-6 text-center text-gray-500">
//           Đã có tài khoản? <Link to="/login" className="text-indigo-600 font-bold hover:underline">Đăng nhập</Link>
//         </p>

//       </div>
//     </div>
//   );
// }