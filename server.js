require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PROJECTS_DIR = path.join(__dirname, 'projects');
const MAX_CONTEXT_CHARS = 120000;

/**
 * Reads all supported files in a project folder and returns combined text.
 * @param {string} projectName - Name of the project folder.
 * @returns {Promise<{combinedText: string, fileNames: string[], totalCharacters: number}>}
 */
async function readProjectFiles(projectName) {
    const projectPath = path.join(PROJECTS_DIR, projectName);
    
    // Check if project folder exists
    try {
        await fs.access(projectPath);
    } catch (err) {
        throw new Error(`Project "${projectName}" not found.`);
    }

    let combinedText = '';
    const fileNames = [];
    let totalCharacters = 0;

    const files = await fs.readdir(projectPath);
    const supportedExts = ['.txt', '.md', '.docx', '.pdf'];

    for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (!supportedExts.includes(ext)) {
            continue; // skip unsupported file types silently
        }

        const filePath = path.join(projectPath, file);
        let fileText = '';

        try {
            if (ext === '.txt' || ext === '.md') {
                fileText = await fs.readFile(filePath, 'utf8');
            } else if (ext === '.docx') {
                const result = await mammoth.extractRawText({ path: filePath });
                fileText = result.value;
            } else if (ext === '.pdf') {
                const dataBuffer = await fs.readFile(filePath);
                const pdfData = await pdfParse(dataBuffer);
                fileText = pdfData.text;
            }
        } catch (err) {
            console.warn(`Could not read ${file}: ${err.message}`);
            continue;
        }

        fileNames.push(file);
        totalCharacters += fileText.length;
        combinedText += `\n\n=== FILE: ${file} ===\n\n${fileText}`;
    }

    // Trim leading newline
    if (combinedText.startsWith('\n\n')) {
        combinedText = combinedText.slice(2);
    }

    // Truncate if too long
    if (combinedText.length > MAX_CONTEXT_CHARS) {
        combinedText = combinedText.substring(0, MAX_CONTEXT_CHARS) +
            '\n\n[NOTE: Source text truncated to fit context window.]';
        totalCharacters = combinedText.length;
    }

    return { combinedText, fileNames, totalCharacters };
}

// GET /projects – list project folders
app.get('/projects', async (req, res) => {
    try {
        const items = await fs.readdir(PROJECTS_DIR, { withFileTypes: true });
        const projects = items
            .filter(item => item.isDirectory())
            .map(item => item.name)
            .sort();
        res.json({ projects });
    } catch (err) {
        console.error('Error reading projects directory:', err);
        res.status(500).json({ error: 'Could not read projects directory.' });
    }
});

// GET /status/:project – get file info for a project
app.get('/status/:project', async (req, res) => {
    try {
        const { project } = req.params;
        const { combinedText, fileNames, totalCharacters } = await readProjectFiles(project);
        res.json({
            project,
            filesLoaded: fileNames.length,
            totalCharacters,
            fileNames
        });
    } catch (err) {
        if (err.message.includes('not found')) {
            return res.status(404).json({ error: err.message });
        }
        console.error(`Error reading project ${req.params.project}:`, err);
        res.status(500).json({ error: 'Failed to read project files.' });
    }
});

// POST /query – ask a question about a project
app.post('/query', async (req, res) => {
    try {
        const { project, question } = req.body;
        if (!project || !question) {
            return res.status(400).json({ error: 'Both "project" and "question" are required.' });
        }

        const { combinedText, fileNames } = await readProjectFiles(project);
        if (fileNames.length === 0) {
            return res.status(400).json({ 
                error: 'No readable files found in this project. Please add .txt, .md, .docx or .pdf files.' 
            });
        }

        const systemMessage = `You are a research assistant for a professional TV series writer. You have been given the complete source materials for a specific story project including episode scripts, treatment summaries, character biographies, and world-building documents. Your job is to answer specific questions about characters, dialogue patterns, relationships, backstory, and story details quickly and accurately. Be concise. Reference the specific episode or document your answer comes from when possible. If the answer cannot be found in the provided material say so honestly. Never invent or assume information not present in the source material.`;

        const userMessage = `Project: ${project}\n\nSource documents:\n\n${combinedText}\n\n---\n\nQuestion: ${question}`;

        const apiKey = process.env.DEEPSEEK_API_KEY;
        if (!apiKey || apiKey === 'your_api_key_here') {
            return res.status(500).json({ error: 'DeepSeek API key not configured. Please set DEEPSEEK_API_KEY in .env' });
        }

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                max_tokens: 1024,
                messages: [
                    { role: 'system', content: systemMessage },
                    { role: 'user', content: userMessage }
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('DeepSeek API error:', errorText);
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const answer = data.choices[0].message.content;

        res.json({ answer, project });
    } catch (err) {
        console.error('Query error:', err);
        res.status(500).json({ error: err.message || 'An unexpected error occurred.' });
    }
});

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
    console.log(`Story Bible Assistant running at http://localhost:${PORT}`);
});