import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenAI, Type } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Error: GEMINI_API_KEY environment variable is missing.');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function run() {
  const diffPath = path.resolve('pr_diff.patch');
  const feedbackPath = path.resolve('feedback.txt');

  if (!fs.existsSync(diffPath) || !fs.existsSync(feedbackPath)) {
    console.error('Missing context files: pr_diff.patch or feedback.txt');
    process.exit(1);
  }

  const diff = fs.readFileSync(diffPath, 'utf8');
  const feedback = fs.readFileSync(feedbackPath, 'utf8');

  const prompt = `
You are an automated code remediation assistant.
Reviewer feedback has been provided on an existing Pull Request.

Existing PR unified diff:
\`\`\`diff
${diff}
\`\`\`

Reviewer feedback / requested changes:
"""
${feedback}
"""

Task:
Generate the updated content for any affected files to resolve the feedback.
Return a structured list of files with their relative file paths and complete updated file content.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash-lite',
    contents: prompt,
    config: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          files: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                path: { type: Type.STRING },
                content: { type: Type.STRING }
              },
              required: ['path', 'content']
            }
          }
        },
        required: ['files']
      }
    }
  });

  const parsed = JSON.parse(response.text);

  if (!parsed.files || parsed.files.length === 0) {
    console.log('No files to update based on Gemini response.');
    return;
  }

  for (const file of parsed.files) {
    const targetPath = path.resolve(file.path);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, file.content, 'utf8');
    console.log(`Updated: ${file.path}`);
  }
}

run().catch((err) => {
  console.error('Execution failure in ai-remediate.mjs:', err);
  process.exit(1);
});