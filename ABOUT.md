# Story Bible Assistant

**A local web app that helps writers query their story source files using AI—without mixing projects.**

## Elevator Pitch

Story Bible Assistant is a lightweight, private research tool for TV series writers, novelists, and story developers. It lets you ask natural‑language questions about your scripts, character bios, treatments, and world‑building documents, and returns answers drawn **only** from the files of the selected story project.

Think of it as a dedicated research assistant that never confuses your Cinderella notes with your Little Red Riding Hood materials, and never invents details—every answer is grounded in the source text you provide.

## Key Highlights

- **Project‑based isolation** – Each story lives in its own folder; queries see only that project’s files.
- **Zero configuration** – Drop `.txt`, `.md`, `.docx`, or `.pdf` files into a project folder and they’re instantly queryable.
- **No database** – Files are read fresh on every request; no persistent storage, no setup headaches.
- **Dark, focused UI** – Designed for long writing sessions with a professional screenwriter aesthetic.
- **Powered by DeepSeek** – Uses the `deepseek‑chat` model for fast, cost‑effective answers.
- **Fully local** – Only your question and extracted text leave your machine; everything else stays on your hard drive.

## Ideal For

- **TV writers** keeping track of character relationships across episodes.
- **Novelists** maintaining consistency across chapters and arcs.
- **Game writers** managing lore documents and dialogue trees.
- **Any storyteller** who wants to quickly look up details without scrolling through dozens of files.

## Quick Stats

- **Backend**: Node.js + Express
- **Frontend**: Vanilla HTML/CSS/JS (no build step)
- **File support**: .txt, .md, .docx, .pdf
- **Context window**: Up to 120 000 characters per query
- **Default port**: 3333

## Getting Started

1. Clone the repo, run `npm install`.
2. Add your DeepSeek API key to `.env`.
3. Run `npm start` and open `http://localhost:3333`.
4. Create a folder inside `projects/` and drop your story files in.

That’s it—your personal story bible is ready.

## Philosophy

Writing is hard enough without losing track of your own story details. This tool is built to stay out of your way, respect your privacy, and keep your projects strictly separate—because your stories deserve their own worlds.

---

*Story Bible Assistant is open‑source under the MIT License.*  
*Find the full source and documentation on [GitHub](https://github.com/fidelnamisi/story-bible-assistant).*