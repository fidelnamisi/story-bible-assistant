# Story Bible Assistant

A writer's research tool that lets you query source files across multiple story projects using the DeepSeek API. Each project is isolated; their files never mix.

## First-time setup

1. **Set your DeepSeek API key**  
   Open `.env` and replace `your_api_key_here` with your actual DeepSeek API key.

2. **Install dependencies**  
   Open a terminal in this folder and run:
   ```bash
   npm install
   ```

3. **Start the server**  
   Run:
   ```bash
   npm start
   ```
   The server will start on port 3333.

4. **Open the app**  
   In your browser, go to [http://localhost:3333](http://localhost:3333).

## Adding a new project

1. Create a new folder inside the `projects/` directory, named after your story (e.g., `Snow‑White`).
2. Drop your source files into that folder.
3. Refresh the browser — the new project appears automatically in the project selector.

## Adding files to an existing project

Simply drop new `.txt`, `.md`, `.docx` or `.pdf` files into the project folder at any time. No restart needed — files are read fresh on every query.

## Supported file types

- `.txt` – plain text files
- `.md` – Markdown files
- `.docx` – Microsoft Word documents
- `.pdf` – PDF documents

All other file types are silently skipped.

## Tips

- **File order** – Files are read alphabetically. If you hit the context‑length limit, prefix critical files with `1_` or `A_` to ensure they are included first.
- **Question specificity** – Keep your questions focused and specific for the best results.
- **Project isolation** – The system never mixes files between projects. Each query only sees files from the selected project.
- **Running the app** – Keep the terminal window open while you work. The app runs entirely locally; the only thing sent externally is your question and source text to the DeepSeek API.

## How it works

- **Backend**: Node.js + Express server that reads files from disk, extracts text, and calls the DeepSeek API.
- **Frontend**: A single HTML page with vanilla JavaScript that fetches projects, displays file stats, and sends queries.
- **No database** – all file reading happens on‑the‑fly for each query.

## API endpoints

- `GET /projects` – returns a list of project folder names.
- `GET /status/:project` – returns file count, total characters, and file names for a project.
- `POST /query` – submits a question about a project and returns an AI‑generated answer.

## License

MIT