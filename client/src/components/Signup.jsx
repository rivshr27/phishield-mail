import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [loading, setLoading] = useState(false); // Loading state for Google login
  const navigate = useNavigate();

  useEffect(() => {
    const rec = new URLSearchParams(window.location.search);
    if (rec.get("access_token")) {
      localStorage.setItem("access_token", rec.get("access_token"));
      localStorage.setItem("refresh_token", rec.get("refresh_token"));
    }
    if (localStorage.getItem("access_token")) navigate("/list");
  }, [isSignedUp, navigate]);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true); // Start loading when the button is clicked
    try {
      const res = await fetch("http://localhost:3000/");
      const data = await res.json();
      window.open(data.url, "_self");
      setIsSignedUp(true);
    } catch (error) {
      console.error("Error during Google sign-in:", error);
    } finally {
      setLoading(false); // Stop loading once the process completes
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-r from-blue-500 to-indigo-600">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-700">
          Sign Up with Google
        </h1>
        <button
          className={`px-6 py-3 w-full flex items-center justify-center gap-3 border border-slate-200 rounded-lg text-gray-700 bg-gray-200 hover:bg-white hover:text-gray-900 transition duration-200 ${
            loading ? "cursor-not-allowed opacity-75" : ""
          }`}
          onClick={handleSignUp}
          disabled={loading} // Disable button when loading
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="loader border-t-4 border-blue-500 rounded-full w-5 h-5 animate-spin"></div>
              <span>Signing in...</span>
            </div>
          ) : (
            <>
              <img
                className="w-6 h-6"
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                loading="lazy"
                alt="google logo"
              />
              <span className="font-medium">Login with Google</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default SignUp;
