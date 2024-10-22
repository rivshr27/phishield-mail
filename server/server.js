import express from "express";
import dotenv from "dotenv";
import { google } from "googleapis";
import fetch from "node-fetch"; // If using node-fetch
import cors from "cors";
import morgan from "morgan";
import { GoogleGenerativeAI } from "@google/generative-ai";

morgan("dev");
dotenv.config();
const app = express();
const PORT = 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const prompt =
  "Classify the email based on its content and sender to determine if it's spam or not. Provide a boolean field 'isSpam' indicating whether the email is spam. Additionally, provide a 'spamScore' field with a percentage score (0-100) of the likelihood that this email is spam and also the reason why do you think that is the case.";

// Function to decode base64 Gmail message data
function cleanData(data) {
  const buff = Buffer.from(data, "base64");
  return buff.toString("ascii");
}

// Function to refresh access token using refresh token
async function refreshAccessToken(refreshToken) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    "http://localhost:3000/oauth2callback"
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials.access_token;
}

// Route to generate Google OAuth URL
app.get("/", (req, res) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      "http://localhost:3000/oauth2callback"
    );
    // console.log("Hello");
    const scopes = ["https://www.googleapis.com/auth/gmail.readonly"];
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      include_granted_scopes: true,
      prompt: "consent",
    });
    res.json({ url: authUrl });
  } catch (e) {
    res.status(500).json({ error: e });
  }
});

// OAuth callback route to handle access and refresh tokens
app.get("/oauth2callback", async (req, res) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      "http://localhost:3000/oauth2callback"
    );
    const { tokens } = await oauth2Client.getToken(req.query.code);
    // console.log("Printing tokens");
    // console.log(tokens);
    oauth2Client.setCredentials(tokens);
    // res.header("access_token", `${tokens.access_token}`);
    // res.header("refresh_token", `${tokens.refresh_token}`);
    res.redirect(
      `http://localhost:5173/?access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token}`
    );
  } catch (err) {
    // console.log(err);
    res.status(500).json({ error: err });
  }
});

// List Gmail messages using access token
app.post("/list", async (req, res) => {
  try {
    let { ACCESS_TOKEN, REFRESH_TOKEN } = req.body;

    let messages = await fetch(
      "https://www.googleapis.com/gmail/v1/users/me/messages",
      {
        method: "GET",
        headers: {
          authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      }
    );

    if (messages.status === 401) {
      ACCESS_TOKEN = await refreshAccessToken(REFRESH_TOKEN);
      messages = await fetch(
        "https://www.googleapis.com/gmail/v1/users/me/messages",
        {
          method: "GET",
          headers: {
            authorization: `Bearer ${ACCESS_TOKEN}`,
          },
        }
      );
    }

    const messagesData = await messages.json();
    // console.log(messagesData);
    // const messageArray = messagesData.messages.map((message) => ({
    //   ...message,
    //   link: `http://localhost:3000/message/${message.id}`,
    // }));
    let messageArray = messagesData.messages.map((mesg) => {
      // const res = await fetch(`http://localhost:3000/message/${mesg.id}`);
      // const data = await res.json();

      return { ...mesg, link: `http://localhost:3000/message/${mesg.id}` };
    });
    // messageArray = await Merge(messageArray, ACCESS_TOKEN, REFRESH_TOKEN);
    // console.log(messageArray);
    res.json({ messages: messageArray });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
});

// Fetch specific Gmail message using ID
app.post("/message/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let { ACCESS_TOKEN, REFRESH_TOKEN } = req.body;

    let message = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages/${id}`,
      {
        method: "GET",
        headers: {
          authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      }
    );

    if (message.status === 401) {
      ACCESS_TOKEN = await refreshAccessToken(REFRESH_TOKEN);
      message = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${id}`,
        {
          method: "GET",
          headers: {
            authorization: `Bearer ${ACCESS_TOKEN}`,
          },
        }
      );
    }

    const messageData = await message.json();
    // console.log(messageData.payload.headers);
    let messageText = "";

    if (messageData.payload.body.data) {
      messageText = cleanData(messageData.payload.body.data);
    } else if (messageData.payload.parts) {
      const lastPart = messageData.payload.parts.slice(-1)[0];
      messageText = cleanData(lastPart.body.data);
    }
    message = messageData.payload.headers.map((msg) => {
      if (msg.name === "Subject") {
        return { subject: msg.value };
      }
      if (msg.name == "From") {
        return { From: msg.value };
      }
      if (msg.name == "To") {
        return { To: msg.value };
      }
      // otherwise ignore
      return null;
    });
    message = message.filter((n) => n);
    // for (let i = 0; i < message.length; i++) {
    // for (let j = 0; j < message[i].length; j++) {
    // messageText.push(message[i][j]);
    // }
    // }
    // console.log(messageText);
    res.json({ data: messageText, message });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

app.post("/scan", async (req, res) => {
  const { sender, reciever, content } = req.body;

  const result = await model.generateContent(
    `${prompt}. sender:${sender} reciever:${reciever} content:${content}`
  );

  res.json({ data: result });
});

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
