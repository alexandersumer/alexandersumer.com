---
title: 'The Verification Bottleneck'
date: 2026-03-08
description: 'AI tools produce code faster than teams can verify it. The failures concentrate at service boundaries, and no existing tool closes the gap alone.'
draft: false
---

The 2025 DORA report found that AI-assisted teams merged 98% more pull requests, with PR sizes growing 154%. Code review time increased 91%. Bug rates rose 9%. Organizational delivery performance was flat. DORA's conclusion: "AI is exposing the downstream bottlenecks in testing, code review, and quality assurance that are not equipped to handle this new, accelerated pace."

This is not speculative. The 2024 report had already shown that a 25% increase in AI adoption correlated with a 7.2% decrease in delivery stability. 95% of developers now use AI tools, up from 76% in 2024. The code is being written. The verification has not caught up.

The failures that matter concentrate at service boundaries. When Cloudflare went down for four hours in November 2025, the root cause was a database permission change that caused a SQL query to return duplicate rows, doubling a configuration file's size. The proxy service had a hardcoded memory limit of 200 features. The oversized file triggered a Rust panic, cascading across Workers KV, Access, Turnstile, and Dashboard. Both the database change and the proxy's memory limit were locally correct. The failure existed only in their interaction.

When AWS US-EAST-1 lost DynamoDB in October 2025, two DNS automation components had a latent race condition. One Enactor applying a delayed older plan collided with a second Enactor applying a newer plan, producing an empty DNS record for `dynamodb.us-east-1.amazonaws.com`. Over 50 dependent services failed. Estimated insurance losses reached $581 million. Each component worked correctly in isolation. The bug lived at the boundary.

The question is whether the gap between code production and code verification is durable enough to warrant its own infrastructure, or whether it closes on its own as tooling matures.

## Why Current Approaches Leave a Gap

Each tool in the verification stack covers real ground. None closes the full gap.

**Unit tests** catch logic errors inside a service. They cannot verify behavior that emerges from real multi-service interaction. GitClear's 2025 study of 211 million lines of code found that AI-assisted code has 8x more duplicated code blocks and code churn (new code revised within two weeks) nearly doubled from 3.1% to 5.7% between 2020 and 2024. More code, more churn, same test infrastructure.

**Contract tests and schema generation** (Pact, OpenAPI, Smithy, Protocol Buffers) prevent schema drift at compile time. They do not catch semantic regressions where the schema is correct and the behavior is wrong. Contract-first code generation is the single highest-leverage move most teams have not yet made. It eliminates much of the surface area that integration testing tries to cover after the fact.

**Distributed tracing** (OpenTelemetry, Jaeger) provides the runtime call graph needed to understand how services actually interact. Only 57% of companies use distributed traces, and only 41% have OpenTelemetry in production. Even those that do mostly use tracing reactively to diagnose incidents rather than proactively to scope what to test before deployment.

**Observability platforms** detect issues after deployment but lack the causal link between a specific change and a specific regression. The Cloudflare and AWS incidents above were diagnosed post-hoc through observability. Neither was prevented by it.

**Ephemeral environments** (Signadot, Namespace) solve the infrastructure problem of fast sandboxes but not the intelligence problem of deciding what to test. Signadot claims 85-90% cost reduction over full environment duplication, but smart test selection is outside their scope.

**End-to-end tests** become a deployment bottleneck in microservices architectures. They cannot diagnose which boundary broke three layers deep. Flakiness compounds across every service in the call chain. Google's testing blog describes this as the "ice cream cone" anti-pattern: too many E2E tests, too few targeted integration tests.

No current tool takes production trace data, uses it to scope targeted multi-service tests before deployment, gates the deployment on results, and verifies that the gate's predictions held in production.

## What a Solution Requires

The naive version is too slow to work. Spin up a full sandbox, discover the entire interaction graph, run a comprehensive test suite on every PR: that is a 10+ minute pipeline. Teams will disable it within a week.

Speed is the survival constraint. If the per-PR gate is slow, developers bypass it. If they bypass it, the system collects no data. If it collects no data, the interaction graph stagnates. The entire architecture exists to keep the per-PR path under two minutes. Gates under two minutes get treated as part of the workflow. Gates over five minutes get treated as optional.

### The interaction graph

The interaction graph maps every service, API surface, dependency, and observed call path. It is a persistence and query layer on top of data that already exists: distributed traces provide the runtime call graph, API schemas provide the static contract surface, and CI run history provides signal quality data about which paths broke and which tests produced signal versus noise.

The graph is built once during onboarding, then updated continuously. Without it, every run starts cold. With it, a PR that touches service B's retry logic can be immediately scoped to the paths where B interacts with C, D, and E.

The graph must also surface what it does not know. A confidence indicator per path ("observed in production traces" vs. "inferred from schema only") lets teams calibrate trust. Blind spots from non-instrumented channels (direct database reads, shared caches) should be visible, not hidden. Jepsen testing has repeatedly demonstrated that distributed systems fail in ways their designers did not anticipate: MongoDB losing committed writes, PostgreSQL violating serializability since version 9.1, CockroachDB failing its own consistency guarantees. The interaction graph should encode this uncertainty rather than pretend it away.

### Three layers of execution depth

The layering matches how risk works. Most PRs touch one service and affect a small number of paths. Batch deployments combine changes and create interaction risk. Nightly runs catch slow drift.

**Layer 1: Per-PR gate (under 2 minutes).** Uses a warm sandbox with services at known-good versions, hot-swaps only the changed service, consults the interaction graph to identify affected paths, and runs a targeted subset of integration tests. This is smarter test selection, not test generation. Failures produce diagnostics pointing to the specific service boundary that broke.

**Layer 2: Per-batch gate (5 to 15 minutes).** When multiple PRs are batched for deployment, a change to service B's retry logic combined with a change to service C's timeout configuration can create a failure mode neither PR triggered alone. This layer runs a broader suite across the combined scope, including fault injection scenarios too slow for per-PR. Netflix's Failure Injection Testing framework demonstrates the value of controlled fault injection: isolating failures to specific test accounts first, then gradually expanding to production traffic percentages.

**Layer 3: Deep suite (nightly, 30+ minutes).** Full interaction graph traversal: broad path coverage, fault injection, race condition probing. This is also where test effectiveness is measured and the per-PR suite is re-prioritized based on what actually caught real issues versus noise. Waze estimates that canary releases alone prevent approximately 25% of incidents on their services. A system that combines canary-style validation with targeted interaction testing should do better.

### Post-deployment verification

A sandbox is not production. After a gated change deploys, the system watches production telemetry for the specific service boundaries it tested. If the gate predicted "no regression on the B-to-D path" and production traces show an error spike on that path, that is a verification miss.

This is distinct from observability. Observability surfaces anomalies. This layer correlates anomalies to specific gated changes and specific sandbox predictions. Every deployment becomes a test of the gate's accuracy. Predictions that held strengthen confidence scoring. Predictions that missed trigger graph updates and test re-prioritization.

This feedback loop is the highest-value component. Without it, the gate is only as good as its initial configuration. With it, every deployment makes the next prediction more accurate.

## Market Dynamics

The interaction graph and per-PR gating are the core product: daily value, high switching costs. Layers 2 and 3 justify tiered pricing.

The defensible pricing axis is "number of services gated," not "number of tests run." Each service added to the graph increases coverage for every path that service participates in and improves confidence scoring for adjacent services. Removing a service degrades predictions for every path that touched it.

The entry point is the platform engineering budget, positioned as CI/CD infrastructure rather than testing tooling. Infrastructure budgets tied to incident prevention are larger and stickier than testing tool budgets.

The system learns which paths break, which fault injections reveal real issues, and which fixes hold. A new entrant starts cold. CI/CD gating that demonstrably prevents incidents is painful to remove. Sandbox orchestration, on the other hand, is commoditizing.

## Threats

**Adjacent competitors.** Observability vendors (Datadog, Honeycomb) already have production traces, service maps, and CI/CD integrations. The bet is that pre-deployment verification is a different product surface: different data pipelines, different execution model, different feedback loops. But a well-resourced vendor with the right team could close the gap.

**Mundane improvement of existing tools.** Better static contracts through Smithy and protobuf adoption, broader tracing coverage through OpenTelemetry, smarter test selection in existing build tools. These are boring, incremental, and collectively close most of the gap without a new product category. OpenTelemetry saw a 45% year-over-year increase in code commits in 2024 and 85% of organizations are investing in it. The window may be narrower than assumed.

**Coding agents learning to self-verify.** Verification in distributed systems is harder than generation: an agent would need to reason about realistic state across dozens of services, inject faults, and account for timing variance. The gap between "hard" and "solved" is the uncertainty this entire bet rests on.

## Key Risks

**Per-PR speed.** If Layer 1 exceeds two minutes, adoption fails. This is the single most important engineering risk.

**False positives.** A gate that cries wolf is worse than no gate. The target is a false positive rate below 5% within 30 days of onboarding.

**Sandbox fidelity.** Stacks with heavy reliance on managed cloud services will have lower-fidelity sandboxes. Transparent fidelity scoring is non-negotiable.

**Graph accuracy.** Stale traces and non-instrumented communication channels create blind spots. The system must surface what it does not know.

**Underestimating simpler solutions.** Many targeted failures can be prevented earlier and cheaper. A team that invests seriously in machine-enforced contracts, complete tracing, and unit tests with realistic failure injection will shrink the residual gap. The system must deliver clear value on failures that survive those investments.
