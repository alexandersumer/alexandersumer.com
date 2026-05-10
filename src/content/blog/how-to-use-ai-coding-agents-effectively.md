---
title: 'How to Use AI Coding Agents Effectively'
date: 2026-03-15
description: 'The gap between frustration and productivity with AI coding agents is judgment. Plan, execute, review, and verify separately, and invest in fast feedback loops.'
draft: false
---

Many people use coding agents for a bit, get frustrated, and conclude "they're not good." That's like picking up a guitar, fumbling through a few chords, and concluding "guitars just don't work." What you're actually building is judgment about AI itself: when to delegate, when to collaborate, and when to do the work yourself. The people getting the most out of agents today aren't using better tools. They built the skill to use them well.

Planning, execution, review, and verification are different activities. They need to happen separately. People conflate them. They ask the agent to plan and build at the same time, and the result is worse plans AND worse code. Most coding agents have a planning or read-only mode that analyzes your codebase and proposes a strategy without writing anything. Use it. If yours doesn't, just tell the agent: "analyze this codebase and propose a plan. Do not write any code."

Agents make code cheaper to produce, which raises the premium on knowing what code should exist. The old software engineering disciplines get more important under automation: Parnas on information hiding, Brooks on conceptual integrity, Evans on domain language, Ousterhout on complexity. Context gives the agent local facts. Exemplars give it concrete patterns. Skills carry design standards across sessions. Verification keeps the loop honest.

---

## Planning

### Plan Your Sessions

Take your time writing prompts. Think through the sequence: what goes first, what the agent needs to learn before it acts, what commands it will run and in what order.

For non-trivial work, make the agent write the plan down before implementation. Use whatever artifact your team will keep current: proposal, design doc, task list, spec, ticket, or Markdown file. Capture the goal, likely files, sequence, checks, risks, and rollback point. Written plans expose vague thinking.

Interrogate the plan before the agent touches code. Ask what can go wrong, what assumptions it is making, what branches it considered, what edge cases are missing, what can be done independently, and what must happen in order. Revise until the work can be executed one step at a time without hidden branches.

Break the approved plan into a sequence of prompts, executed one by one. Each chunk small enough that the agent handles it within context.

Example session: (1) agent reads relevant code and existing tests, (2) writes a plan, (3) you challenge and revise the plan, (4) implement step 1, (5) verify step 1, (6) implement step 2, and so on.

The anti-pattern is monolithic execution: stuffing all requirements into one prompt and asking the agent to build everything at once. The result feels like "10 devs worked on it without talking to each other." Giving the agent all the context up front is fine, as long as it's reasoning about the plan, not executing it all in one shot.

Front-load context. Before the agent writes anything, have it read the README, understand the test framework, confirm it can reproduce the problem. Lead with constraints and context, not implementation details.

### Show It What Good Looks Like

One of the highest-leverage moves is to clone high-quality open-source repositories locally and use them as pattern libraries. Ask for a narrow extraction: how this project structures background jobs, represents errors across module boundaries, tests CLI commands, separates API types from internal models, or keeps module interfaces stable.

The agent adapts concrete patterns better than prose instructions. Real repos include the parts documentation and blog posts omit: call sites, tests, edge cases, naming conventions, backwards compatibility, and the boring glue around the abstraction. That is where most of the design actually lives.

Use this before implementation. Have the agent summarize the pattern, identify the parts that transfer, identify the parts that belong to that repo's context, then compare it to your codebase. Keep the extraction narrow. Clone the repo locally so the agent can inspect the relevant files on demand. Treat the repo as a reference library.

### Encode Repeatable Patterns

Some work is the same operation applied to many targets. Migrate 15 clients to a new pool. Add feature flags to 8 services. Replace a deprecated API across 20 call sites. When you recognize that pattern, build two artifacts: a tracking table in Markdown of targets with their status, and a skill that describes how to apply the operation to one target.

The tracking table is the source of truth for what needs doing and what's done. The skill is the source of truth for how. Any contributor, human or agent, picks up a target, follows the same steps, and produces a consistent result. This saves a lot of time, and improves consistency on repeatable work.

Skills make judgment reusable. They handle migrations, testing protocols, security checks, review checklists, and other repeated workflows. Whether your tool calls them skills, rules, playbooks, memories, or project instructions, the point is the same: durable operating procedures should live somewhere more stable than a chat window.

---

## Execution

### Parallelize Your Agent Sessions

Use parallel sessions when the work can be separated. Put each one in its own worktree or clone so files and context do not collide. Use separate sessions for writing, reviewing, and fixing. One concern per session.

### Use the Smartest Models

Smarter models are almost always better, for every task. This is counterintuitive because people assume a "simple" task doesn't need a frontier model. But smarter models find more efficient solutions, make fewer wrong turns, and are less likely to spiral into an unrecoverable state. They use fewer tokens to get to the right answer because they don't waste cycles on bad approaches.

I only use the smartest models available at the highest reasoning effort. Even though they cost more per token, I end up spending less overall: less time, fewer tokens, fewer CI cycles, fewer sessions thrown away to context corruption.

Don't optimize for token cost when the bottleneck is your time. A $0.50 prompt that gets it right in one shot is cheaper than five $0.05 prompts that each need fixing.

### Manage Your Context Window

LLMs perform measurably worse as the context window fills. Most agents show a context usage indicator. Compact or summarize proactively at 50% to keep quality high. At 70%, compact or start fresh.

Start new sessions for new tasks. Don't reuse a debugging session for feature work. If your agent supports sub-tasks or background agents, use them for tasks that read many files. They get their own isolated context and return a summary, keeping your main session clean.

---

## Verification

### Give the Agent a Verification Step

Instead of just asking the agent to refactor something, tell it: "after refactoring, write a script to check that only test cases calling suspending methods got `runTest` added and that no annotations were removed." The agent catches its own mistakes before you have to.

The verification must be automated and deterministic: a command, script, test, or check the agent can actually run.

The fundamental loop is: write code, run tests, fix failures. Agents can move fast through a project with a good test suite. Without tests, the agent assumes everything is fine.

### Separate Writing From Review

Review finds risks. Verification proves behavior. Do not ask the same session that wrote the code to be the only reviewer. It has the plan, failed attempts, and your framing in context. That makes it more likely to miss the same blind spot.

For important changes, start clean review sessions. Give each reviewer only the diff, relevant files, and local conventions. Give each one a narrow job: correctness, failure modes, security, tests, or design.

Require evidence. A useful finding names the file, line, broken contract, and the input or change path that exposes it. Drop anything that is a nitpick, generic advice, or not tied to code you can inspect.

### Validate Your Tests

Agents default to writing implementation first, then backfilling tests. This makes the tests coupled to the implementation, not the specification. A test written to match existing code passes by construction. It asserts what the code does, not what it should do.

Have the agent write the test first. Run it. Watch it fail. Then write the implementation. A test that has never failed is a test you cannot trust. A smoke detector that has never been near smoke tells you nothing about whether it works.

### Invest in Your Local Dev Loop

Your coding agent is only as good as your feedback loop. You need to reproduce CI locally, run the service e2e locally, get quick feedback that is representative of production.

If your CI only runs remotely and takes 20 minutes, you're flying blind for 20-minute stretches. Fast local feedback (lint, type check, unit tests, e2e tests, evals, security scan) is what lets agents iterate without waiting on you.

### Agents Write Insecure Code

In a study of 470 real GitHub PRs, AI-generated code contained 2.7x more security vulnerabilities than human-written code. Every PR was functional. The code worked. It wasn't secure. Larger models did not perform significantly better on security. This is systemic.

On BaxBench, a basic security reminder in the prompt improved secure code output from 56% to 66% for Claude Opus 4.5. That was measured on single-pass generation and likely weakens in multi-turn agentic sessions where the security reminder gets buried under turns of conversation. Add security scanning to your verification loop. Static analysis on every PR.

### Make Verification Automatic

Project instructions guide behavior. Lint rules, type checks, tests, security scanners, pre-commit hooks, branch protection, and CI constrain behavior. An `AGENTS.md` file can ask the model to do the right thing. A failing check stops the wrong thing from landing.

This matters more as agents get better. The model may understand your instruction, agree with it, and still violate it five turns later when the context is crowded or the local goal changes. Deterministic enforcement does not rely on attention.

Most coding agents support automated guardrails: hooks that fire at lifecycle events, rules that trigger on specific actions, or pre/post-processing steps. Block edits on the main branch, run the linter before accepting changes, auto-format after every edit, run the full test suite before the agent declares itself done.

Use project instructions for judgment, taste, architecture, and workflow. Use automation for invariants. If a rule can be checked mechanically, move it out of prose and into the dev loop.

---

## Meta-Skills

### Know When to Bail

Context corruption is irreversible. When the agent goes down a wrong path, the failed attempts and error messages stay in the context window. They don't just take up space. They actively confuse the model on every subsequent turn. You are not wasting time. You are making every future response in that session worse.

People try to correct course mid-session. It doesn't work. The bad context is already baked in, shaping every prediction. Start a clean session. It takes 30 seconds.

Bail signals: the agent repeats itself, contradicts a decision it made earlier, or suggests fixes you already rejected.

### Commit Before Everything

Agents move fast and break things across many files at once. Without frequent commits, you have no way to isolate what the agent changed from what you changed, and no way to roll back a bad generation without losing your own work.

Commit before every major agent operation. Use feature branches. Keep commits small and focused. `git diff` between commits is the fastest way to review what the agent actually did, and small commits let you revert a single bad step instead of an entire session.

### Refactor Continuously

As the codebase grows, some of the highest-leverage agent work is regular design pressure. Code generation makes tactical changes cheap. Cheap tactical changes accumulate complexity. Continuous refactoring means reducing accidental complexity before the codebase starts to hurt.

The old books become more relevant here: _A Philosophy of Software Design_ for complexity, Parnas for information hiding, _Domain-Driven Design_ for preserving the language of the domain, Brooks for conceptual integrity. These principles survived every tooling wave. Code generation makes them more valuable.

Run periodic design reviews in read-only mode. Look for shallow modules, information leakage, pass-through methods, conjoined methods, generic abstractions that erased domain meaning, and places where one conceptual change requires edits across too many files. Ask for a ranked design review before any diff.

The prompt shape matters. "Refactor this" produces churn. Ask the agent to find the smallest change that reduces cognitive load or change amplification while preserving domain meaning. Ask for two designs. Ask what each design hides from callers. Ask what invariant owns the rule. Ask what future change gets easier.

Agents can read more call sites than you want to, compare patterns across the codebase, and surface drift before it hardens. Their design judgment is only as good as the principles you gave them.

Protect real domain complexity when the code gets smaller. A good refactor reduces accidental complexity while preserving the distinctions the system depends on. If the domain has three concepts, merging them into one generic abstraction destroys information.

### Work in Agent-Friendly Languages

Coding agents perform best in languages that satisfy three conditions simultaneously: type safety, source-available package distribution, and large-scale popularity. Today that's TypeScript and Go.

Each condition matters on its own. Type safety gives the agent a compiler-driven feedback loop: free, instant verification at every edit that narrows the search space of valid programs. Without it, the agent relies on runtime testing or human review to know if its output is correct. Source-available packaging (npm packages, Go modules) means the model trained on the full dependency graph, and at inference time the agent can read actual library source on disk rather than speculating from documentation that's often incomplete or wrong. JVM and .NET ecosystems distribute compiled bytecode by default. There is nothing for the agent to open and read, so it hallucinates APIs more often. Popularity provides training data volume. An obscure language could be perfectly typed and fully source-distributed but still underserved due to sparse training signal.

You need all three together. Type safety without source availability means the agent verifies its own code but guesses at library interfaces (Kotlin, C#). Type safety without popularity means the compiler catches mistakes but sparse training data limits the model (Rust, Zig). Source availability without type safety means the agent reads everything but gets weak correctness feedback (Python, Ruby). Popularity without the other two means lots of training data but high error rates (JavaScript without TypeScript).

### Know What Good Code Looks Like

The agent accelerates experts more than beginners. If you don't know what good code looks like in a given domain, the agent can produce convincing garbage and you won't catch it.

Example: an agent refactors your database access layer and the code compiles, passes tests, and looks clean. A senior engineer glances at it and sees that it opens a new connection per query instead of using the pool. The agent wrote correct code. It wrote code that will fall over at a few hundred concurrent users. If you don't already know what connection handling should look like, you approve that PR.

This is why agents widen the gap between senior and junior engineers. The agent does the typing. The human does the judgment.

We saw this during a production incident where error rates spiked. A coding agent reviewed the logs and found sidecars returning 5xx errors. It concluded the sidecars were the root cause. They were a symptom. The real problem was that our cluster had a hard limit of 24 nodes. We had scaled to that ceiling. CPUs were maxed with no room to scale horizontally. The agent had zero context on the infrastructure. It found a plausible explanation in the logs and stopped there. The agent is only as good as the context you give it. When that context doesn't include the system, the human is the one who bridges the gap.

You get the most out of agents in areas where you already know what the answer should look like. That ability comes from doing software engineering the hard way.

That judgment doesn't require deep specialization. Agents supply depth on demand. The advantage belongs to the curious generalist who has picked up working knowledge across many domains. Knowing what problems to solve, what questions to ask, and whether the agent's output is right across many areas comes from curiosity, not specialization.

### Know When NOT to Use Agents

Agents are bad at work that requires holding a large amount of subtle context over many steps. If the task requires understanding how six services interact under specific failure conditions, or tracing a race condition across threads, the agent will lose the thread before you do.

They're also bad when the cost of a wrong answer is high and verification is hard. Agents are confident and fast. If you can't verify the output quickly, that confidence works against you. Security-sensitive code, complex migrations, anything where "it compiles and tests pass" is not sufficient, those are places to slow down and do the work yourself or treat the agent's output as a rough draft, not a result.
