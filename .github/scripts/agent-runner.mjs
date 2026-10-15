import { Agent, LocalAgentConfig } from '@google/antigravity';
import { execSync } from 'child_process';

const apiKey = process.env.GEMINI_API_KEY;
const issueNumber = process.env.ISSUE_NUMBER;
const issueTitle = process.env.ISSUE_TITLE;
const issueBody = process.env.ISSUE_BODY;

if (!apiKey) {
  console.error('FATAL: GEMINI_API_KEY secret is not set.');
  process.exit(1);
}

if (!issueNumber || !issueTitle) {
  console.error('FATAL: ISSUE_NUMBER or ISSUE_TITLE environment variables are missing.');
  process.exit(1);
}

function verifyBuildAndTests() {
  console.log('Running test verification suite (npm test)...');
  try {
    const output = execSync('npm test', { encoding: 'utf8', stdio: 'inherit' });
    return { success: true, logs: output };
  } catch (error) {
    return {
      success: false,
      logs: (error.stdout || '') + '\n' + (error.stderr || '') + '\n' + error.message
    };
  }
}

async function run() {
  console.log(`Starting Antigravity Autonomous Agent for Issue #${issueNumber}: "${issueTitle}"`);

  const systemInstructions = `
You are an autonomous senior software engineer working on a WCAG/ADA accessibility audit tool.
You adhere strictly to Node.js ES Modules (import/export).

CRITICAL JAVASCRIPT SYNTAX RULE:
Never nest unescaped backticks inside a template literal.
INCORRECT:  markdown += \`| \`\${item.id}\` |\`;
CORRECT:    markdown += \`| \\\`\${item.id}\\\` |\`;
OR:         markdown += '| \`' + item.id + '\` |';

OPERATIONAL WORKFLOW:
1. Review the existing project structure, dependencies, and test setup.
2. Read the relevant files across scanner.js, normalizer.js, reporter.js, targets.json, and the tests/ directory.
3. Apply the minimal necessary modifications to implement the feature or resolve the bug.
4. Execute terminal commands (e.g., 'npm test') to inspect, debug, and verify your changes.
5. Ensure all tests exit cleanly with code 0 before completing your session.
`;

  const config = new LocalAgentConfig({
    apiKey,
    systemInstructions,
    workspaceRoot: process.cwd(),
    capabilities: {
      fileSystem: { allowRead: true, allowWrite: true },
      terminal: { allowExecute: true }
    }
  });

  const agent = new Agent(config);

  const prompt = `
Resolve GitHub Issue #${issueNumber}: "${issueTitle}"

Issue Description:
${issueBody || 'No issue description provided.'}

Instructions:
- Examine the codebase, make the necessary file edits, and run 'npm test' to verify your solution.
- Fix any syntax errors or test regressions you encounter.
`;

  try {
    const response = await agent.chat(prompt);
    console.log('\n--- Antigravity Agent Execution Summary ---');
    console.log(await response.text());
  } catch (err) {
    console.error('Antigravity Agent encountered an execution failure:', err);
    process.exit(1);
  } finally {
    await agent.close();
  }

  // Deterministic local gate: Enforce that tests pass before allowing PR creation
  const gateCheck = verifyBuildAndTests();
  if (!gateCheck.success) {
    console.error('Final verification check failed after agent finished execution.');
    process.exit(1);
  }

  console.log('✅ Final verification gate passed cleanly.');
}

run();