import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import "../Message.css";
const Message = () => {
  const [message, setMessage] = useState({});
  const [loading, setLoading] = useState(true); // State to track the loading status
  const res = new URLSearchParams(window.location.search);
  const id = res.get("id");

  useEffect(() => {
    const messageData = async () => {
      try {
        const res = await fetch(`http://localhost:3000/message/${id}`, {
          body: JSON.stringify({
            ACCESS_TOKEN: localStorage.getItem("access_token"),
            REFRESH_TOKEN: localStorage.getItem("refresh_token"),
          }),
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        setMessage(data);
      } catch (error) {
        console.error("Error fetching message:", error);
      } finally {
        setLoading(false); // Set loading to false once data is fetched
      }
    };

    messageData();
  }, [id]);

  return (
    <>
      <Navbar />
      <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded-3xl shadow-lg neomorphism">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 animate-spin"></div>
          </div>
        ) : (
          <div
            className="p-6 bg-gray-100 rounded-xl shadow-md transition duration-200 transform hover:scale-105 neomorphism-item"
            dangerouslySetInnerHTML={{ __html: message.data }}
          />
        )}
      </div>
    </>
  );
};

export default Message;
