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
const MODELS_FILE = path.join(__dirname, 'models.json');

async function readModels() {
    try {
        const data = await fs.readFile(MODELS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        // If file doesn't exist, return empty array
        return [];
    }
}

async function writeModels(models) {
    await fs.writeFile(MODELS_FILE, JSON.stringify(models, null, 2), 'utf8');
}

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
    const supportedExts = ['.txt', '.md', '.docx', '.pdf'];

    // Recursive walk through directory
    async function walkDir(dir, relativePrefix = '') {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = relativePrefix ? path.join(relativePrefix, entry.name) : entry.name;
            if (entry.isDirectory()) {
                await walkDir(fullPath, relativePath);
            } else {
                const ext = path.extname(entry.name).toLowerCase();
                if (!supportedExts.includes(ext)) {
                    continue;
                }

                let fileText = '';
                try {
                    if (ext === '.txt' || ext === '.md') {
                        fileText = await fs.readFile(fullPath, 'utf8');
                    } else if (ext === '.docx') {
                        const result = await mammoth.extractRawText({ path: fullPath });
                        fileText = result.value;
                    } else if (ext === '.pdf') {
                        const dataBuffer = await fs.readFile(fullPath);
                        const pdfData = await pdfParse(dataBuffer);
                        fileText = pdfData.text;
                    }
                } catch (err) {
                    console.warn(`Could not read ${relativePath}: ${err.message}`);
                    continue;
                }

                fileNames.push(relativePath);
                totalCharacters += fileText.length;
                combinedText += `\n\n=== FILE: ${relativePath} ===\n\n${fileText}`;
            }
        }
    }

    await walkDir(projectPath);

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

// ==================== AI Model Management ====================

// GET /api/models – list all saved models (without exposing API keys)
app.get('/api/models', async (req, res) => {
    try {
        const models = await readModels();
        // Return safe versions (strip apiKey)
        const safeModels = models.map(({ id, name, baseURL, modelName }) => ({
            id,
            name,
            baseURL,
            modelName
        }));
        res.json(safeModels);
    } catch (err) {
        console.error('Error reading models:', err);
        res.status(500).json({ error: 'Could not load models.' });
    }
});

// POST /api/models – add a new model
app.post('/api/models', async (req, res) => {
    try {
        const { name, baseURL, apiKey, modelName } = req.body;
        if (!name || !baseURL || !apiKey || !modelName) {
            return res.status(400).json({ error: 'All fields (name, baseURL, apiKey, modelName) are required.' });
        }
        const models = await readModels();
        const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
        const newModel = { id, name, baseURL, apiKey, modelName };
        models.push(newModel);
        await writeModels(models);
        // Return the safe version
        const { apiKey: _, ...safeModel } = newModel;
        res.status(201).json(safeModel);
    } catch (err) {
        console.error('Error adding model:', err);
        res.status(500).json({ error: 'Failed to add model.' });
    }
});

// PUT /api/models/:id – update an existing model
app.put('/api/models/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, baseURL, apiKey, modelName } = req.body;
        const models = await readModels();
        const index = models.findIndex(m => m.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Model not found.' });
        }
        // Update only provided fields (allow partial update)
        if (name !== undefined) models[index].name = name;
        if (baseURL !== undefined) models[index].baseURL = baseURL;
        if (apiKey !== undefined) models[index].apiKey = apiKey;
        if (modelName !== undefined) models[index].modelName = modelName;
        await writeModels(models);
        const { apiKey: _, ...safeModel } = models[index];
        res.json(safeModel);
    } catch (err) {
        console.error('Error updating model:', err);
        res.status(500).json({ error: 'Failed to update model.' });
    }
});

// DELETE /api/models/:id – delete a model
app.delete('/api/models/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const models = await readModels();
        const filtered = models.filter(m => m.id !== id);
        if (filtered.length === models.length) {
            return res.status(404).json({ error: 'Model not found.' });
        }
        await writeModels(filtered);
        res.status(204).send();
    } catch (err) {
        console.error('Error deleting model:', err);
        res.status(500).json({ error: 'Failed to delete model.' });
    }
});

// POST /query – ask a question about a project
app.post('/query', async (req, res) => {
    try {
        const { project, question, modelId } = req.body;
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

        let apiKey, baseURL, modelName;
        if (modelId) {
            const models = await readModels();
            const model = models.find(m => m.id === modelId);
            if (!model) {
                return res.status(400).json({ error: 'Selected AI model not found.' });
            }
            apiKey = model.apiKey;
            baseURL = model.baseURL;
            modelName = model.modelName;
        } else {
            // Fallback to default DeepSeek configuration
            apiKey = process.env.DEEPSEEK_API_KEY;
            if (!apiKey || apiKey === 'your_api_key_here') {
                return res.status(500).json({ error: 'DeepSeek API key not configured. Please set DEEPSEEK_API_KEY in .env' });
            }
            baseURL = 'https://api.deepseek.com/v1/chat/completions';
            modelName = 'deepseek-chat';
        }

        const response = await fetch(baseURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: modelName,
                max_tokens: 1024,
                messages: [
                    { role: 'system', content: systemMessage },
                    { role: 'user', content: userMessage }
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('AI API error:', errorText);
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        const answer = data.choices[0].message.content;

        res.json({ answer, project, modelId: modelId || 'default' });
    } catch (err) {
        console.error('Query error:', err);
        res.status(500).json({ error: err.message || 'An unexpected error occurred.' });
    }
});

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
    console.log(`Story Bible Assistant running at http://localhost:${PORT}`);
});