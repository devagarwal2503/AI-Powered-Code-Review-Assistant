/**
 * promptBuilder.js — Assembles the structured prompt for OpenAI
 *
 * Prompt engineering decisions:
 *
 * 1. System role vs user role:
 *    - system: sets the model's identity and output format (doesn't change per-PR)
 *    - user: contains the actual PR diff and context (changes every time)
 *    This separation makes the system prompt cacheable (OpenAI can cache it
 *    server-side, reducing latency and cost on repeat calls).
 *
 * 2. JSON schema in the prompt:
 *    We include the exact JSON schema we expect. With JSON mode enabled,
 *    the model is forced to return valid JSON — but it still tries to match
 *    the schema you describe. Being explicit = better adherence.
 *
 * 3. What to include vs. exclude in the prompt:
 *    Include: changed lines (always), surrounding context (when available)
 *    Exclude: unrelated files, test files for library code, auto-generated files
 *
 * 4. "Skip" instructions:
 *    Without these, models tend to over-flag trivial style issues (variable naming,
 *    whitespace) which dilute the real findings and annoy developers.
 *    We explicitly tell it to skip things that don't matter.
 *
 * 5. Severity calibration:
 *    We define each severity level precisely so the model calibrates consistently.
 *    Without this, "high" means different things each time.
 */

/**
 * Builds the system prompt — the model's identity and output contract.
 * This is static (same for every PR) so OpenAI can potentially cache it.
 *
 * @returns {string}
 */
function buildSystemPrompt() {
  return `You are an expert software engineer and security-focused code reviewer with 10+ years of experience across web backends, APIs, and distributed systems. You review pull requests with the same rigor as a senior engineer at a top technology company.

Your goal is to identify REAL issues — not cosmetic preferences. Every finding you report should be something a senior engineer would actually raise in a code review.

SEVERITY DEFINITIONS (be calibrated and consistent):
- high: Security vulnerability (injection, auth bypass, secret exposure), data loss risk, or critical bug that will cause failures in production
- medium: Logic error, missing error handling, architectural problem, or performance issue that could cause real problems under load
- low: Minor bug risk, unclear code that could lead to future bugs, or a missing best practice
- info: Useful observation or improvement suggestion that isn't really an issue

CATEGORIES:
- security: Authentication, authorization, injection risks, secret exposure, input validation
- bug-risk: Logic errors, edge cases, race conditions, incorrect async handling, null/undefined risks
- architecture: Tight coupling, missing abstractions, scalability issues, design pattern violations
- performance: N+1 queries, unnecessary blocking, memory leaks, inefficient algorithms
- style: Readability issues that could lead to future bugs (NOT pure formatting preferences)

SKIP THESE (do not report):
- Pure whitespace or formatting issues
- Variable naming that's merely imperfect (only flag if genuinely misleading)
- Changes in lines you have no context for
- Issues that are clearly intentional (e.g. a TODO comment)
- Test files unless the test logic itself has a bug

OUTPUT FORMAT:
You MUST return ONLY a valid JSON object. No markdown. No explanation outside the JSON. No code fences.

The JSON must exactly match this schema:
{
  "findings": [
    {
      "file": "path/to/file.js",
      "line": 42,
      "severity": "high" | "medium" | "low" | "info",
      "category": "security" | "bug-risk" | "architecture" | "performance" | "style",
      "title": "Short one-line summary (max 80 characters)",
      "explanation": "2-3 sentences explaining the specific issue in context of this code. Reference the actual variable names, function names, or patterns you see.",
      "suggestion": "Concrete, actionable fix with a code example or clear approach"
    }
  ],
  "summary": "2-3 sentence overall assessment of the PR quality, key themes, and what the reviewer should focus on"
}

If no real issues are found, return: {"findings": [], "summary": "No significant issues found in this PR. The changes look clean and follow good practices."}`;
}

/**
 * Builds the user message containing the actual PR diff and context.
 *
 * @param {Array} files - GitHub file objects with .filename and .patch
 * @param {Map<string, string>} contextMap - Map of filename → surrounding context
 * @param {Object} prMeta - { owner, repo, pullNumber, prTitle, headSha }
 * @returns {string}
 */
function buildUserPrompt(files, contextMap, prMeta) {
  const { owner, repo, pullNumber, prTitle } = prMeta;
  const lines = [];

  lines.push(`PR #${pullNumber} in ${owner}/${repo}`);
  lines.push(`Title: ${prTitle}`);
  lines.push(`Files changed: ${files.length}`);
  lines.push('');
  lines.push('Analyze the following changes and return findings as JSON.');
  lines.push('');
  lines.push('═'.repeat(60));

  for (const file of files) {
    lines.push('');
    lines.push(`FILE: ${file.filename} [${file.status}] (+${file.additions} -${file.deletions})`);

    if (file.patchTruncated) {
      lines.push('[NOTE: This file\'s diff was truncated due to size — analyze what is shown]');
    }

    // Include surrounding context if available
    const context = contextMap.get(file.filename);
    if (context) {
      lines.push('');
      lines.push('── Surrounding file context (with line numbers):');
      lines.push(context);
    }

    // Include the diff
    lines.push('');
    lines.push('── Diff (+ added lines, - removed lines):');
    lines.push(file.patch || '[No patch available]');
    lines.push('─'.repeat(40));
  }

  return lines.join('\n');
}

/**
 * Assembles both prompts into the messages array for the OpenAI API.
 *
 * @param {Array} files
 * @param {Map<string, string>} contextMap
 * @param {Object} prMeta
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
function buildPrompts(files, contextMap, prMeta) {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(files, contextMap, prMeta);
  return { systemPrompt, userPrompt };
}

module.exports = { buildPrompts, buildSystemPrompt, buildUserPrompt };
