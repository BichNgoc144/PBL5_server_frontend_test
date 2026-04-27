import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, Outlet } from 'react-router-dom';

import MainPage from "@/app/components/Main";
import Login from "@/app/components/Login";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import HistoryLog from '@/app/components/HistoryLog';
import VocabularyManagement from '@/app/components/VocabularyManagement';
import Profile from "@/app/components/Profile";
import Quiz from "@/app/components/Quiz";
import Register from "@/app/components/Register";

function AppLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <nav className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex justify-between h-16 items-center">
          <div className="font-bold flex items-center space-x-2">
            <span>🤖</span>
            <span>AI Dashboard</span>
          </div>
          <div className="flex space-x-4">
            <NavLink to="/app" className={({isActive}) => isActive ? "text-blue-600 font-bold" : "text-gray-600"}>History</NavLink>
            <NavLink to="/app/vocabulary" className={({isActive}) => isActive ? "text-blue-600 font-bold" : "text-gray-600"}>Vocabulary</NavLink>
            <NavLink to="/app/profile" className={({isActive}) => isActive ? "text-blue-600 font-bold" : "text-gray-600"}>Profile</NavLink>
            <NavLink to="/app/quiz" className={({isActive}) => isActive ? "text-blue-600 font-bold" : "text-gray-600"}>Quiz</NavLink>
            <button
              onClick={() => {
                localStorage.removeItem("token"); // Xóa token
                window.location.href = "/"; // Đẩy ra ngoài trang chủ
              }}
              className="text-red-500 hover:text-red-700 font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <div className="p-6 max-w-7xl mx-auto">
        <Outlet />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* === NHỮNG TRANG Ở NGOÀI (PUBLIC) === */}
        {/* Vào đường dẫn gốc sẽ thấy MainPage (có hình ảnh và 2 nút) */}
        <Route path="/" element={<MainPage />} /> 
        
        {/* Bấm vào 1 trong 2 nút sẽ nhảy sang trang Login (file Login tự xử lý giao diện đăng nhập/đăng ký) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* === NHỮNG TRANG Ở TRONG (PRIVATE) === */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Mặc định vào /app sẽ hiện History */}
          <Route index element={<HistoryLog />} /> 
          <Route path="vocabulary" element={<VocabularyManagement />} />
          <Route path="profile" element={<Profile />} />
          <Route path="quiz" element={<Quiz />} />
        </Route>

        {/* Bắt lỗi gõ sai đường dẫn -> Đẩy về trang chủ */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}