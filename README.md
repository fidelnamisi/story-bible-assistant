# Story Bible Assistant

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18.x-green?logo=node.js)
![Express](https://img.shields.io/badge/Express-4.x-lightgrey?logo=express)
![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)

**A writer's research tool that queries source files across multiple story projects using AI. Each project is isolated; their files never mix.**

</div>

## 🎬 What is this?

Story Bible Assistant is a local web app for TV series writers, novelists, and story developers. It lets you ask natural‑language questions about your story materials (scripts, treatments, character bios, world‑building documents) and get concise, accurate answers drawn **only** from the selected project’s files.

Think of it as a private research assistant that never mixes up your projects and never invents details—everything it says comes directly from the source texts you provide.

## ✨ Features

- **Project‑based isolation** – Each story lives in its own folder; queries see only that project’s files.
- **Multi‑format support** – Reads `.txt`, `.md`, `.docx`, and `.pdf` files automatically.
- **No database** – Files are read fresh on every query; no persistent storage required.
- **Clean, focused UI** – Dark professional design tailored for long writing sessions.
- **DeepSeek API integration** – Uses the `deepseek‑chat` model for fast, cost‑effective answers.
- **Live file stats** – See at a glance how many files are loaded and their total character count.
- **Example questions** – One‑click fill with typical writerly queries (character relationships, dialogue patterns, backstory tension).

## 🚀 Quick Start

### 1. Clone & install
```bash
git clone https://github.com/fidelnamisi/story-bible-assistant.git
cd story-bible-assistant
npm install
```

### 2. Set your API key
Edit `.env` and replace `your_api_key_here` with your [DeepSeek API key](https://platform.deepseek.com/api_keys).

### 3. Run the server
```bash
npm start
```
The app will be available at **http://localhost:3333**.

### 4. Add your story files
Create a folder inside `projects/` (e.g., `projects/My‑Novel/`) and drop your `.txt`, `.md`, `.docx`, or `.pdf` files into it.  
Refresh the browser – your project appears automatically.

## 📁 Project Structure

```
story‑bible‑assistant/
├── server.js                 # Express backend with three endpoints
├── package.json             # Dependencies and scripts
├── .env                     # API key (git‑ignored)
├── public/
│   └── index.html           # Single‑page frontend (CSS + JS embedded)
└── projects/                # Isolated story projects
    ├── Cinderella/
    ├── Little‑Red‑Writing‑Hood/
    └── Emperors‑New‑Clothes/
    └── … (add your own)
```

## 🧠 How It Works

### Backend (`server.js`)
- **`GET /projects`** – Lists all project folders.
- **`GET /status/:project`** – Returns file count, total characters, and file names for a project.
- **`POST /query`** – Accepts a project name and a question, reads the project’s files, calls the DeepSeek API, and returns the answer.

The helper function `readProjectFiles()` extracts plain text from each supported file type, concatenates them with clear file headers, and truncates to 120 000 characters if needed to fit the model’s context window.

### Frontend (`public/index.html`)
- Fetches and displays projects as clickable tabs.
- Shows live file stats in the header pill.
- Provides example‑question chips for quick input.
- Sends queries and displays answers in a monospace box with a copy‑to‑clipboard button.
- Fully responsive design with a dark, distraction‑free theme.

## 🔐 Privacy & Data Flow

- All file reading happens locally on your machine.
- The only data sent externally is your **question** and the **extracted text** of the selected project’s files to the DeepSeek API.
- No data is stored between sessions; files are re‑read on every query.
- The `.env` file (containing your API key) is excluded from Git.

## 💡 Tips for Best Results

- **Prefix critical files** with `1_` or `A_` to ensure they are read first (files are processed alphabetically).
- **Keep questions specific** – “How does Character X address Character Y in Act 2?” works better than “Tell me about their relationship.”
- **Add context headers** – Inside your source files, use clear headings like `## CHARACTER: ALICE` to help the AI locate answers.
- **Monitor token usage** – The system truncates at 120 000 characters; if your project is large, split files by topic or episode.

## 🛠 API Reference

### `GET /projects`
**Response**
```json
{
  "projects": ["Cinderella", "Little‑Red‑Writing‑Hood", "Emperors‑New‑Clothes"]
}
```

### `GET /status/:project`
**Response**
```json
{
  "project": "Cinderella",
  "filesLoaded": 12,
  "totalCharacters": 45678,
  "fileNames": ["1_intro.txt", "character_bios.docx", "episode_1.pdf"]
}
```

### `POST /query`
**Request**
```json
{
  "project": "Cinderella",
  "question": "How does the prince address his stepmother in dialogue?"
}
```
**Response**
```json
{
  "answer": "The prince always uses 'Your Majesty' in formal scenes…",
  "project": "Cinderella"
}
```

## 🧪 Running in Development

To auto‑restart the server on file changes, install `nodemon` globally and use:
```bash
npm run dev
```
(Adds a `dev` script that uses `nodemon server.js`.)

## 📄 License

MIT – see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Need Help?

Open an [issue](https://github.com/fidelnamisi/story-bible-assistant/issues) on GitHub or fork the repository and adapt it to your own workflow.

---

*Built for writers who want to keep their story worlds straight.*