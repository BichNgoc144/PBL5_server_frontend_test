
import { Link } from "react-router-dom";

export default function MainPage() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      
      {/* Cột trái: Hình ảnh minh họa */}
      <div className="flex-1 flex justify-center mb-8 md:mb-0">
        <img 
          src="https://cdn-icons-png.flaticon.com/512/2814/2814666.png" 
          alt="AI Robot Learning" 
          className="w-64 md:w-96 drop-shadow-2xl hover:-translate-y-4 transition-transform duration-500"
        />
      </div>

      {/* Cột phải: Nội dung và Nút điều hướng */}
      <div className="flex-1 text-center md:text-left bg-white/80 p-10 rounded-3xl shadow-xl backdrop-blur-sm max-w-md w-full">
        <div className="text-4xl mb-4 hidden md:block">👋</div>
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
          AI Learning
        </h1>
        <p className="text-gray-600 mb-6 text-lg">
          Hệ thống nhận diện và học từ vựng thông minh qua góc nhìn của Trí Tuệ Nhân Tạo.
        </p>

        {/* Các nút điều hướng */}
        <div className="flex flex-col space-y-4">
          
          {/* Nhóm tài khoản */}
          <div className="grid grid-cols-2 gap-4">
            <Link to="/login">
              <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-indigo-500/50 hover:scale-105 transition-all">
                Đăng nhập
              </button>
            </Link>
            <Link to="/register">
              <button className="w-full px-4 py-3 bg-white border-2 border-indigo-200 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 hover:border-indigo-300 hover:scale-105 transition-all">
                Đăng ký
              </button>
            </Link>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">Tính năng chính</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          {/* Nhóm học tập */}
          <Link to="/quiz">
            <button className="w-full px-8 py-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-emerald-500/50 hover:scale-105 transition-all flex justify-center items-center gap-2">
              <span>🎮</span> Làm bài Quiz
            </button>
          </Link>

          <Link to="/profile">
            <button className="w-full px-8 py-3 bg-white border-2 border-purple-200 text-purple-600 text-lg font-semibold rounded-xl hover:bg-purple-50 hover:border-purple-300 hover:scale-105 transition-all flex justify-center items-center gap-2">
              <span>👤</span> Hồ sơ cá nhân
            </button>
          </Link>
          
        </div>
      </div>
    </div>
  );
}