import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";

function TodoList() {
  const [emails, setEmails] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [scanning, setScanning] = useState(null);
  const [scanResult, setScanResult] = useState(null); // State for scan result popup
  const [showModal, setShowModal] = useState(false); // State to show/hide the modal

  const navigate = useNavigate();

  useEffect(() => {
    async function getMessages() {
      if (!localStorage.getItem("access_token")) {
        navigate("/");
        return;
      }

      try {
        const res = await fetch("http://localhost:3000/list", {
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
        setEmails(data.messages);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoadingMessages(false);
      }
    }

    getMessages();
  }, [navigate]);

  const handleScan = async (id) => {
    setScanning(id);

    try {
      const res = await fetch(`http://localhost:3000/message/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ACCESS_TOKEN: localStorage.getItem("access_token"),
          REFRESH_TOKEN: localStorage.getItem("refresh_token"),
        }),
      });
      const data = await res.json();
      const content = data.data;
      let sender = "";
      let receiver = "";
      for (let i = 0; i < 3; i++) {
        if (data.message[i]["From"]) {
          sender = data.message[i]["From"];
        }
        if (data.message[i]["To"]) {
          receiver = data.message[i]["To"];
        }
      }

      const finalRes = await fetch(`http://localhost:3000/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender,
          receiver,
          content,
        }),
      });
      const finalData = await finalRes.json();
      // console.log(finalData);
      console.log(finalData);
      const scanContent =
        finalData.data.response.candidates[0].content.parts[0].text;

      // Extract the JSON part from the response text
      const scanJson = scanContent.match(/```json\n({.*?})\n```/s);
      console.log(scanJson);
      if (scanJson) {
        const parsedResult = JSON.parse(scanJson[1]);
        console.log(parsedResult);
        setScanResult(parsedResult);
      }

      // Show the modal after scan
      setShowModal(true);
    } catch (error) {
      console.error("Error scanning message:", error);
    } finally {
      setScanning(null);
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-lg mx-auto mt-10 bg-white p-8 rounded-3xl shadow-lg neomorphism">
        <h2 className="text-2xl font-semibold mb-6 text-gray-700">
          Your Emails
        </h2>

        {loadingMessages ? (
          <div className="flex justify-center items-center h-32">
            <div className="loader border-t-4 border-blue-500 rounded-full w-12 h-12 animate-spin"></div>
          </div>
        ) : (
          <ul>
            {emails.map((todo) => (
              <li
                onClick={() => {
                  if (scanning !== todo.id) {
                    navigate(`/message?id=${todo.id}`);
                  }
                }}
                key={todo.id}
                className="flex justify-between items-center mb-6 p-4 rounded-xl bg-gray-100 shadow-md cursor-pointer transition duration-200 transform hover:scale-105 neomorphism-item"
              >
                <span className="font-medium text-gray-600">{`Email ID: ${todo.id}`}</span>
                <button
                  className={`p-2 rounded-xl text-white focus:outline-none transition-all duration-300 ${
                    todo.isScanned
                      ? "bg-green-500"
                      : "bg-yellow-500 hover:bg-yellow-600"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent navigation on button click
                    handleScan(todo.id);
                  }}
                  disabled={scanning === todo.id}
                >
                  {scanning === todo.id ? (
                    <div className="loader border-t-4 border-white rounded-full w-5 h-5 animate-spin"></div>
                  ) : todo.isScanned ? (
                    "Scanned"
                  ) : (
                    "Scan"
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Modal for scan result */}
        {showModal && scanResult && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm text-center">
              <h3 className="text-xl font-semibold mb-4">Scan Result</h3>
              <p className="text-gray-700 mb-2">
                <strong>Spam Status:</strong>{" "}
                {scanResult.isSpam ? "Spam" : "Not Spam"}
              </p>
              <p className="text-gray-700 mb-4">
                <strong>Spam Score:</strong> {scanResult.spamScore}%
              </p>
              <p className="text-gray-700 mb-4">
                <strong>Reason:</strong> {scanResult.reason}
              </p>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default TodoList;
