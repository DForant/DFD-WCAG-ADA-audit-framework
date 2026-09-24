import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs';
import path from 'path';

const apiKey = process.env.GEMINI_API_KEY;
const issueNumber = process.env.ISSUE_NUMBER;
const issueTitle = process.env.ISSUE_TITLE;
const issueBody = process.env.ISSUE_BODY;

if (!apiKey) {
  console.error("FATAL: GEMINI_API_KEY secret is not set.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

// Helper to grab existing repository code context
function getCodebaseContext() {
  const targetFiles = [
    'package.json',
    'PROJECT_REQUIREMENTS.md',
    'scanner.js',
    'normalizer.js',
    'reporter.js',
    'targets.json'
  ];

  let context = '';
  for (const file of targetFiles) {
    if (fs.existsSync(file)) {
      context += `\n--- File: ${file} ---\n` + fs.readFileSync(file, 'utf8') + '\n';
    }
  }
  return context;
}

async function run() {
  console.log(`Starting AI Agent for Issue #${issueNumber}: "${issueTitle}"`);

  const codebase = getCodebaseContext();

  const systemInstruction = `
You are an expert autonomous software engineer working on the Automated WCAG/ADA Accessibility Audit Framework.
Your job is to resolve the user's GitHub Issue by updating existing files or creating new ones.
Rules:
1. Always write clean, production-ready ES Module JavaScript (Node 20+).
2. Adhere strictly to the project architecture in PROJECT_REQUIREMENTS.md.
3. Return ONLY a structured JSON array of file paths and their updated full contents.
`;

  const prompt = `
Context Codebase:
${codebase}

-----------------
Issue To Resolve:
Title: ${issueTitle}
Description:
${issueBody}
-----------------

Implement the necessary modifications. Return the list of files modified or created.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          description: "List of files modified or created by the agent",
          items: {
            type: Type.OBJECT,
            properties: {
              filePath: {
                type: Type.STRING,
                description: "Relative path to file (e.g. 'scanner.js')"
              },
              content: {
                type: Type.STRING,
                description: "Full content of the file"
              }
            },
            required: ["filePath", "content"]
          }
        }
      }
    });

    const modifiedFiles = JSON.parse(response.text);

    if (!Array.isArray(modifiedFiles) || modifiedFiles.length === 0) {
      console.warn("No files modified by the model.");
      return;
    }

    for (const file of modifiedFiles) {
      const dir = path.dirname(file.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(file.filePath, file.content, 'utf8');
      console.log(`Updated: ${file.filePath}`);
    }

    console.log("AI code generation complete. Proceeding to verification.");
  } catch (error) {
    console.error("Agent failed during execution:", error);
    process.exit(1);
  }
}

run();