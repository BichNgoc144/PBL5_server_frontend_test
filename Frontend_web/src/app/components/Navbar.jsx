import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-white border-b p-4 flex justify-between">
      <div className="font-bold">AI System 🤖</div>

      <div className="space-x-4">
        <NavLink to="/app">History</NavLink>
        <NavLink to="/vocabulary">Vocabulary</NavLink>

        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
          className="text-red-500"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}