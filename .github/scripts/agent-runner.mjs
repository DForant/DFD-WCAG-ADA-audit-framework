import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const apiKey = process.env.GEMINI_API_KEY;
const issueNumber = process.env.ISSUE_NUMBER;
const issueTitle = process.env.ISSUE_TITLE;
const issueBody = process.env.ISSUE_BODY;

if (!apiKey) {
  console.error('FATAL: GEMINI_API_KEY secret is not set.');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

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

  if (fs.existsSync('tests')) {
    const testFiles = fs.readdirSync('tests').filter(f => f.endsWith('.js') || f.endsWith('.mjs'));
    for (const file of testFiles) {
      context += `\n--- File: tests/${file} ---\n` + fs.readFileSync(`tests/${file}`, 'utf8') + '\n';
    }
  }

  return context;
}

function writeFilesToDisk(fileList) {
  for (const file of fileList) {
    const dir = path.dirname(file.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(file.filePath, file.content, 'utf8');
    console.log(`[Disk Write] Updated: ${file.filePath}`);
  }
}

function runVerificationSuite() {
  try {
    const output = execSync('npm test', { encoding: 'utf8', stdio: 'pipe' });
    return { success: true, logs: output };
  } catch (error) {
    return {
      success: false,
      logs: (error.stdout || '') + '\n' + (error.stderr || '') + '\n' + error.message
    };
  }
}

async function askAgent(prompt) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt,
    config: {
      systemInstruction: `
You are an autonomous senior software engineer.
You implement features, fix issues, and write tests for a WCAG/ADA audit tool.
You adhere strictly to Node.js ES Modules (import/export).
Be vigilant with string escaping: do NOT nest raw backticks inside template literals without escaping them (e.g. use \\\` or standard quotes).
Return ONLY a valid JSON array of objects representing modified or created files.
`,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        description: 'List of files modified or created',
        items: {
          type: Type.OBJECT,
          properties: {
            filePath: { type: Type.STRING, description: 'Relative file path' },
            content: { type: Type.STRING, description: 'Full updated source code' }
          },
          required: ['filePath', 'content']
        }
      }
    }
  });

  return JSON.parse(response.text);
}

async function run() {
  console.log(`Starting Self-Healing Agent for Issue #${issueNumber}: "${issueTitle}"`);

  let codebase = getCodebaseContext();
  let prompt = `
Context Codebase:
${codebase}

-----------------
Issue To Resolve:
Title: ${issueTitle}
Description:
${issueBody}
-----------------

Implement the necessary code and test updates to resolve the issue. Ensure syntax and logic will pass 'npm test'.
`;

  const MAX_ATTEMPTS = 3;
  let attempt = 1;
  let passed = false;

  while (attempt <= MAX_ATTEMPTS && !passed) {
    console.log(`\n=== Self-Correction Cycle: Attempt ${attempt} of ${MAX_ATTEMPTS} ===`);

    const files = await askAgent(prompt);
    if (!files || files.length === 0) {
      console.warn('No modifications returned by model.');
      break;
    }

    writeFilesToDisk(files);

    console.log('Running test verification suite...');
    const verification = runVerificationSuite();

    if (verification.success) {
      console.log('✅ Verification passed. All tests and syntax checks are green.');
      passed = true;
    } else {
      console.warn(`❌ Verification failed on attempt ${attempt}.`);
      console.warn(`Error Output:\n${verification.logs}`);

      if (attempt === MAX_ATTEMPTS) {
        console.error('Reached maximum retry limit without passing tests.');
        process.exit(1);
      }

      codebase = getCodebaseContext();
      prompt = `
Your previous code modifications failed 'npm test'.

Failure Log:
${verification.logs}

Current Codebase:
${codebase}

Fix the exact syntax, runtime, or logic errors identified in the log so that 'npm test' exits with code 0.
Return ONLY the corrected JSON file list.
`;
      attempt++;
    }
  }

  if (!passed) {
    process.exit(1);
  }
}

run();