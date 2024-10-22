import React from "react";
import { useNavigate } from "react-router-dom";
export default function Navbar() {
  const navigate = useNavigate();
  return (
    <nav className="px-4 py-2 border flex text-slate-700 justify-between items-center">
      <h1 className="text-2xl font-bold">Phishield Mails</h1>
      {localStorage.getItem("access_token") && (
        <button
          className="text-slate-700 hover:text-slate-900"
          onClick={() => {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            navigate("/");
          }}
        >
          Logout
        </button>
      )}
    </nav>
  );
}
