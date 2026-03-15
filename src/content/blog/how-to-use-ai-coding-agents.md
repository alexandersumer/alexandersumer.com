---
title: 'How to Use AI Coding Agents'
date: 2026-03-15
description: 'The gap between frustration and productivity with AI coding agents is judgment. Plan, execute, and verify separately, and invest in fast feedback loops.'
draft: false
---

I'm giving a presentation this week on AI coding agents. In preparing for it I went deep on the latest research, practitioner blogs, and security disclosures to stress-test my own advice. This post is what survived.

## The piano analogy

Many people use coding agents for a bit, get frustrated, and conclude "they're not good." That's like playing a piano for a week and saying pianos don't work.

What you are actually building when you use these tools intensely is judgment. You develop intuitions for when to delegate, when to collaborate, and when to do the work yourself.

Anthropic's 2026 Trends Report puts numbers on this: engineers use AI in roughly 60% of their work but can fully delegate only 0-20% of tasks. The gap is skill. Addy Osmani describes effective AI-assisted coding as "difficult and unintuitive," requiring new patterns. 90% of the code for Claude Code is written by Claude Code. That didn't happen on day one.

What you get for the investment is a mental model that lets you move way faster than people who either refuse to use the tools or use them without understanding what they're good at.

## Plan, execute, verify

These are fundamentally different activities and they need to happen separately.

People conflate them. They ask the agent to plan and build at the same time, and the result is worse plans AND worse code. Plan Mode in Claude Code (Shift+Tab) exists for this. It puts the agent in read-only mode where it can analyze your codebase and propose a strategy but won't write anything. SFEIR Institute found that Plan mode reduces token consumption by 40-60% on complex tasks. Better output for less than half the cost.

Everything below maps to one of these three phases.

## Planning

### Write specs before code

Have the AI draft a spec. Review it. Correct it. Only then implement. The spec is what you go back to when things drift.

GitHub's AI team calls this "specs as shared source of truth." Osmani starts every project with a spec.md that the AI drafts and he approves, then loops through write/test/fix against it.

The spec should define what "done" looks like. Acceptance criteria, not feature descriptions. Make it a living document. Version-control it alongside the code.

### Plan your sessions

Take your time writing prompts. Think through the sequence: what goes first, what goes second, what the agent needs to learn before it acts, what commands it will run and in what order.

Osmani generates structured prompt plan files: a sequence of prompts for each task, executed one by one. Each chunk small enough that the agent handles it within context.

Example session: (1) agent reads relevant code and existing tests, (2) drafts a spec, (3) you review, (4) implement step 1, (5) verify step 1, (6) implement step 2, and so on.

The anti-pattern is the monolithic prompt. Stuffing all requirements into one instruction. Engineers describe the result as feeling like "10 devs worked on it without talking to each other."

Front-load context. Before the agent writes anything, have it read the README, understand the test framework, confirm it can reproduce the problem. What you tell the agent first shapes how it interprets everything after. Lead with constraints and context, not implementation details.

### CLAUDE.md is infrastructure

Most teams underinvest in this. The CLAUDE.md file is read at the start of every conversation. It is your agent's persistent memory.

What it should contain: project structure, how to build/test/lint, key architectural decisions, and how the agent should verify its own work.

What it should NOT contain: detailed code style rules (that's a linter's job) or large amounts of text. Claude Code's system prompt already has ~50 instructions, nearly a third of what the agent can reliably follow (HumanLayer research). Your CLAUDE.md competes with those for attention. Keep it short.

For monorepos: hierarchical CLAUDE.md files. Root for global rules, subdirectory for service-specific context.

## Execution

### Parallelize your agent sessions

Create multiple full clones of your repo, not worktrees. Full clones let you check out the same branch in multiple sessions simultaneously.

The principle here is parallel sessions with isolated context. Each session has its own context window. 3 parallel sessions give you the equivalent of 600k tokens of total budget (SFEIR Institute). One session on auth refactoring, another writing tests, a third on docs. No cross-contamination, no quality degradation from overloading a single context.

Trail of Bits takes this further with disposable cloud instances via their dropkit CLI. Spin up a droplet, run Claude Code, destroy it when done.

One concern per session.

### Use the best models

Use the most intelligent models even if they're expensive. Don't optimize for token cost when the bottleneck is your time. A $0.50 prompt that gets it right in one shot is cheaper than five $0.05 prompts that each need fixing.

More advanced: use a multi-model strategy. Smartest model for planning and complex reasoning. Faster model for well-defined execution. A different model entirely for QA, because cross-model verification catches errors that self-review misses.

### Automate your repetition

If you find yourself typing something over and over, create a skill for it.

A skill is a SKILL.md file in `.claude/skills/` that teaches Claude how to approach a category of work. Not step-by-step scripts. Conventions, checklists, decision frameworks. The taxonomy: skills (knowledge), commands (slash commands for specific sequences), agents (specialists with their own context), hooks (lifecycle event handlers).

Example: "I kept typing 'run the linter, then the type checker, then the tests' so I created a `/verify` command that does all three and only shows me failures."

### Manage your context window

LLMs perform measurably worse as the context window fills. Monitor the context meter. Compact proactively at 50% to keep quality high. At 70%, compact or start fresh.

Start new sessions for new tasks. Don't reuse a debugging session for feature work. Use subagents for tasks that read many files. They get their own isolated context and return a summary, keeping your main session clean.

## Verification

### Give the agent a verification step

Instead of just asking the agent to refactor something, tell it: "after refactoring, write a script to check that only test cases calling suspending methods got `runTest` added and that no annotations were removed." The agent catches its own mistakes before you have to.

The verification must be automated and deterministic. Not "look at the code and tell me if it's right."

Osmani calls write/test/fix the fundamental unit of AI-assisted development. Agents can move fast through a project with a good test suite. Without tests, the agent assumes everything is fine.

### Invest in your local dev loop

Your coding agent is only as good as your feedback loop. You need to reproduce CI locally, run the service e2e locally, get quick feedback that is representative of production.

If your CI only runs remotely and takes 20 minutes, you're flying blind for 20-minute stretches. Fast local feedback (lint, type check, unit tests, security scan) compounds when working with agents.

### Security is not optional

DryRun Security (March 2026): across 30 PRs from three coding agents, 87% contained at least one security vulnerability. Every PR was functional. The code worked. It wasn't secure.

Veracode 2025: 45% of AI-generated code across 100+ LLMs contained OWASP Top 10 vulnerabilities. Java had a 72% failure rate. Larger models did not perform significantly better on security. This is systemic.

Broken access control, business logic flaws, and OAuth implementation failures appeared across all three major agents tested. The best model (Claude Opus 4.5 Thinking) produced secure code only 56% of the time without prompting. A generic security reminder bumped that to 66%.

Add security scanning to the verification loop. Static analysis on every PR. Explicitly prompt for security. Even a basic reminder helps.

### Hooks make verification automatic

Hooks fire at specific lifecycle events in Claude Code and enforce rules without relying on the model's instruction-following.

PreToolUse: block edits on main branch, run linter before accepting changes. PostToolUse: auto-format after every edit, run type checker. Stop: run full test suite before the agent declares itself done. PreCompact: save git diff before compaction.

An instruction in CLAUDE.md saying "never use rm -rf" can be forgotten under context pressure. A hook that blocks it cannot. Trail of Bits calls this out specifically.

## Meta-skills

### Know when to bail

Ctrl+C, decline PRs, move on. There is no coming back from corrupted context.

Once the agent has gone down a wrong path, the failed attempts and error messages sit in the context actively confusing the model. You are not just wasting time. You are making every future response in that session worse.

73% of users don't configure compaction and end up with incoherent responses after 30 minutes (SFEIR Institute). Trail of Bits: "when responses degrade, start a clean session rather than fighting a polluted context. It takes 30 seconds and saves 10-15 minutes."

Bail signals: the agent repeats itself, contradicts a decision it made earlier, or starts suggesting solutions you already rejected.

### Commit before everything

Every expert workflow assumes git discipline but nobody talks about it.

Commit before every major agent operation. Feature branches. Small, focused commits. Checkpoints undo file changes within a session but git gives you durable rollback. `git diff` shows exactly what the agent changed. Small commits create natural context boundaries.

### Know what good code looks like

The agent accelerates experts more than beginners. If you don't know what good code looks like in a given domain, the agent can produce convincing garbage and you won't catch it.

From Anthropic's internal research: "I'm primarily using AI in cases where I know what the answer should be or should look like. I developed that ability by doing software engineering the hard way."

### Watch your supply chain

People are installing MCP servers, plugins, and third-party skills without thinking twice. This is a real attack surface.

OpenClaw attack: 1,184 confirmed malicious packages, roughly 1 in 5 in the ecosystem. IDEsaster disclosure: 30+ vulnerabilities across Cursor, Copilot, Claude Code, and others. Claude Code itself had CVEs patched in v2.0.65+ for hook injection and MCP consent bypass.

Audit MCP configurations in `.mcp.json`. Don't auto-approve all servers. Review plugin permissions. The attack vector for AI coding tools is text: prompt injection through tool outputs, malicious context in cloned repos, poisoned dependencies.
