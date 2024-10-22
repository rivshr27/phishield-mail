import React, { useState } from "react";
import Navbar from "./components/Navbar";
import SignUp from "./components/Signup";

function App() {
  return (
    <div className="min-h-screen bg-warm-50 text-gray-800 font-sans">
      <Navbar />
      <SignUp />
    </div>
  );
}

export default App;
