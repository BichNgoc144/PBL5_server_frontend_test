import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

// ─── API Helper ───────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:5000";

async function loginUser(form) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });

  const data = await res.json();

  if (!res.ok) {
    // Dịch lỗi từ server sang tiếng Việt
    const msg = data?.error;
    if (msg === "User not found") throw new Error("Tên đăng nhập không tồn tại.");
    if (msg === "Wrong password") throw new Error("Mật khẩu không chính xác.");
    throw new Error(msg || "Đăng nhập thất bại. Vui lòng thử lại.");
  }

  return data;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError(""); // Xóa lỗi khi người dùng bắt đầu gõ lại
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate phía client
    if (!form.username.trim()) {
      setError("Vui lòng nhập tên đăng nhập.");
      return;
    }
    if (!form.password) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { token } = await loginUser(form);
      localStorage.setItem("token", token);
      navigate("/app"); // Chuyển về dashboard chính
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
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/40 mb-4">
            <span className="text-3xl">🤖</span>
          </div>
          <h1 className="text-2xl font-bold text-white">AI Learning</h1>
          <p className="text-slate-400 text-sm mt-1">Đăng nhập để tiếp tục hành trình</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Chào mừng trở lại 👋</h2>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 mb-5 text-sm">
              <span className="text-lg flex-shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Tên đăng nhập
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">👤</span>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Nhập tên đăng nhập..."
                  autoComplete="username"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu..."
                  autoComplete="current-password"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl pl-10 pr-12 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors text-sm"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Đang đăng nhập...
                </>
              ) : (
                "Đăng nhập →"
              )}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Đăng ký miễn phí
            </Link>
          </p>
        </div>

        {/* Back home */}
        <div className="text-center mt-4">
          <Link to="/" className="text-slate-600 hover:text-slate-400 text-sm transition-colors">
            ← Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}


// import { useState, useEffect } from "react";
// import { useNavigate, useLocation, Link } from "react-router-dom"; // Thêm useLocation, Link

// export default function Login() {
//   const navigate = useNavigate();
//   const location = useLocation(); // Lấy URL hiện tại
  
//   // Nếu URL là /register thì set isLogin = false, ngược lại là true
//   const [isLogin, setIsLogin] = useState(location.pathname !== "/register");
  
//   const [form, setForm] = useState({
//     username: "",
//     email: "",
//     password: ""
//   });

//   // Tự động cập nhật form nếu người dùng đổi URL trên thanh trình duyệt
//   useEffect(() => {
//     setIsLogin(location.pathname !== "/register");
//   }, [location.pathname]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const url = isLogin
//       ? "http://localhost:5000/login"
//       : "http://localhost:5000/register";

//     const body = isLogin
//       ? { username: form.username, password: form.password }
//       : form;

//     try {
//       const res = await fetch(url, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(body)
//       });

//       const data = await res.json();

//       if (res.ok) {
//         if (isLogin) {
//           localStorage.setItem("token", data.token);
//           navigate("/app");
//         } else {
//           alert("Register success! Vui lòng đăng nhập.");
//           navigate("/login"); // Đăng ký xong thì chuyển qua đăng nhập
//         }
//       } else {
//         alert(data.error || "Login/Register failed");
//       }
//     } catch (err) {
//       console.error(err);
//       alert("Server error");
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-blue-100 to-yellow-100">
//       <div className="flex flex-col md:flex-row items-center bg-white rounded-2xl shadow-xl overflow-hidden max-w-3xl w-full">
        
//         {/* 🖼️ Hình minh họa */}
//         <div className="bg-gradient-to-br from-purple-200 to-blue-200 p-6 flex justify-center items-center h-full">
//           <img
//             src="https://cdn-icons-png.flaticon.com/512/4712/4712100.png"
//             alt="AI learning"
//             className="w-52"
//           />
//         </div>

//         {/* 🔐 Form */}
//         <form onSubmit={handleSubmit} className="p-6 w-80 space-y-4">
//           <h2 className="text-2xl font-bold text-center text-purple-600">
//             {isLogin ? "Đăng nhập 🚀" : "Đăng ký 🎉"}
//           </h2>

//           <input
//             type="text"
//             placeholder="Username"
//             className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
//             onChange={(e) => setForm({ ...form, username: e.target.value })}
//           />

//           {!isLogin && (
//             <input
//               type="email"
//               placeholder="Email"
//               className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300"
//               onChange={(e) => setForm({ ...form, email: e.target.value })}
//             />
//           )}

//           <input
//             type="password"
//             placeholder="Password"
//             className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300"
//             onChange={(e) => setForm({ ...form, password: e.target.value })}
//           />

//           <button className="w-full bg-gradient-to-r from-blue-400 to-purple-500 text-white p-2 rounded-lg shadow hover:scale-105 transition">
//             {isLogin ? "Login" : "Register"}
//           </button>

//           {/* Dùng Link thay vì onClick để đổi URL cho chuẩn SEO & Router */}
//           <div className="text-sm text-center mt-4">
//             {isLogin ? (
//               <p>Chưa có tài khoản? <Link to="/register" className="text-blue-500 hover:underline font-semibold">Đăng ký</Link></p>
//             ) : (
//               <p>Đã có tài khoản? <Link to="/login" className="text-blue-500 hover:underline font-semibold">Đăng nhập</Link></p>
//             )}
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }