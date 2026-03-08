---
title: 'The Verification Bottleneck'
date: 2026-03-08
description: 'AI tools produce code faster than teams can verify it. The failures concentrate at service boundaries, and no existing tool closes the gap alone.'
draft: false
---

AI coding tools have shifted the bottleneck in software delivery from writing code to verifying it is safe to ship. Teams produce pull requests faster than they can review and validate them.

This does not mean "more bugs everywhere." It produces a specific failure mode: changes that pass local checks but cause regressions in distributed behavior. The individual service looks fine. The system breaks.

The bottleneck is structural. AI increases the volume and velocity of change. Review capacity, integration testing infrastructure, and deployment safety processes all scale sub-linearly with code output. The 2025 DORA report reinforces this: teams that increased deployment frequency without proportional investment in stability practices saw higher change failure rates, not lower. The result is a growing window between "code merged" and "code verified," and most incidents live in that window.

The question is whether this gap is durable enough to warrant its own infrastructure, or whether it closes on its own as tooling matures.

## Who Has This Problem

The verification gap concentrates in a specific profile: platform engineering and infrastructure teams at companies running enough services in production that no single engineer holds the full interaction model in their head. These teams have already invested in CI/CD, observability, and some form of contract testing. They are watching their existing verification stack fall behind as AI-assisted code velocity exposes gaps that were always present but previously tolerable. The common trigger is a production incident caused by a change that passed every existing check.

Consider two examples that illustrate different classes of failure.

In the first, an AI-generated change to an internal API client removes a required header from outbound requests. Unit tests pass. Contract tests pass. CI is green. In production, three downstream services require that header and reject every request without it. Cascade failure across the payment pipeline. Six-figure SLA exposure. Every automated check said the change was safe. But this failure could have been prevented without multi-service integration testing at all. If the required header had been part of a machine-enforced contract generated from a shared definition, the change would have been caught at compile time.

In the second, an AI-generated change modifies how a service handles partial failures during a multi-step payment flow. The service now retries a step that previously failed permanently, which is correct behavior in isolation. But a downstream service treats the retry as a new request, creating duplicate charges. Both services conform to their API contracts. Both pass their own test suites. The failure only exists in the interaction between them under a specific failure condition that neither service owns independently. No cheaper layer catches this.

That distinction between failures that require multi-service execution to detect and failures that should be caught earlier and cheaper matters throughout what follows.

## Where Failures Concentrate and Why the Distinction Matters

The failures that matter cluster at service boundaries. Each network handoff between services is a point where things can silently break: a request header or auth claim gets dropped, retry logic changes and triggers duplicate side effects, error handling shifts and alters downstream semantics, a new call path introduces ordering dependencies, or a downstream service tolerates the schema but not the behavior.

Not all of these require multi-service execution to catch. Retry logic that causes duplicate payments is arguably a logic error in how one service handles a known boundary condition, not a failure at the boundary itself. Better unit tests with realistic failure mode injection would catch it without spinning up a second service. Similarly, missing headers should be caught by machine-enforced contracts before code ever runs. The failures that genuinely require multi-service execution are the ones where the bug only manifests when real services interact: auth token propagation across call chains, ordering dependencies across async boundaries, behavioral mismatches where both sides conform to the schema but disagree on semantics.

This distinction shapes the solution. A verification system should not try to catch everything at the integration layer. It should catch what can only be caught there, and push everything else to cheaper, faster layers: static contracts for schema conformance, unit tests with realistic failure modes for boundary-adjacent logic, and multi-service execution only for true interaction failures. The better a team's contracts and unit tests already are, the less the integration layer needs to do for them, and the more precisely it can focus on what those layers cannot reach.

## Why Current Approaches Leave a Gap

Each existing approach covers real ground. None closes the gap alone, and understanding where each falls short clarifies what a solution actually needs to provide.

**Unit tests and mocks** catch logic errors inside a service but abstract away the interactions where integration failures occur. They can be extended with realistic failure injection to cover boundary-adjacent logic (retry behavior, timeout handling, error mapping), but they cannot verify behavior that emerges from real multi-service interaction.

**Contract tests and schema generation** (Pact, OpenAPI validation, Smithy, Protocol Buffers) verify interface conformance and, when contracts are generated from shared definitions, prevent an entire class of schema drift failures at compile time. They do not catch semantic regressions where the schema is correct and the behavior is wrong. Investing in contract-first code generation is the single highest-leverage move most teams have not yet made, and it eliminates much of the surface area that integration testing tries to cover after the fact.

**Distributed tracing** (OpenTelemetry, Jaeger) provides the runtime call graph, latency baselines, and error characteristics needed to understand how services actually interact. It is the most underused tool in this space. Complete tracing coverage already gives you the service interaction graph that any verification system needs. The problem is that most teams do not have complete coverage, and even those that do use tracing reactively (diagnosing production incidents) rather than proactively (scoping what to test before deployment).

**Observability platforms** (Datadog, Honeycomb, Splunk) detect issues after deployment but lack the causal link between a specific pre-deployment change and a specific post-deployment regression. They tell you something is wrong. They do not tell you which change caused it.

**Ephemeral environments** (Signadot, Namespace) solve the infrastructure problem of fast sandboxes but not the intelligence problem of deciding what to test and gating deployments on results.

**End-to-end browser tests** (Playwright, Selenium, Cypress) test the system from the outside in. They cannot diagnose which service boundary broke three layers deep, cannot cover headless interactions (background jobs, event-driven workflows, internal API calls), and are expensive to maintain. In distributed systems, flakiness compounds across every service in the call chain. As Chris Richardson has argued, E2E tests in microservices architectures often become a deployment bottleneck that recreates the coupling microservices were supposed to eliminate.

The gap, then, is not in any single category but in the combination. No current tool takes production trace data and dependency graphs, uses them to scope targeted multi-service tests before deployment, gates the deployment on results, and then verifies that the gate's predictions held in production.

## What a Solution Requires

The naive version of this idea is too slow to work. Spin up a full sandbox, discover the entire interaction graph, generate and run a comprehensive test suite on every PR? That is a 10+ minute pipeline. Teams will disable it within a week.

Speed is the survival constraint. If the per-PR gate is slow, developers bypass it. If they bypass it, the system collects no data. If it collects no data, the interaction graph stagnates. If the graph stagnates, every run is slow because it has nothing to scope against. The entire architecture exists to keep the per-PR path under two minutes. That threshold is a judgment call based on observed CI bypass behavior: gates under two minutes get treated as part of the workflow, gates over five minutes get treated as optional, and the dead zone in between is where adoption decays.

### The interaction graph

The interaction graph maps every service, every API surface, every dependency, and every observed call path. It is a persistence and query layer on top of data sources that already exist or should exist: distributed traces provide the runtime call graph, API schemas provide the static contract surface, and CI run history provides signal quality data about which paths broke, which fixes held, and which tests produced signal versus noise.

The graph is built once during onboarding from these sources, then updated continuously as new trace data arrives and new CI results accumulate. It is what makes fast per-PR gating possible. Without it, every run starts cold. With it, a PR that touches service B's retry logic can be immediately scoped to the paths where B interacts with C, D, and E, without re-discovering anything.

The graph must also surface what it does not know. A confidence indicator per path ("observed in production traces" vs. "inferred from schema only") lets teams calibrate trust. Services communicating through non-instrumented channels (direct database reads, shared caches, filesystem side-channels) are blind spots. They should be visible, not hidden.

### Three layers of execution depth

The layering matches how risk actually works. Most PRs touch one service and affect a small number of paths. Batch deployments combine changes and create interaction risk. Nightly runs catch slow drift.

**Layer 1: Per-PR gate (under 2 minutes).** The system does not spin up the full mesh from scratch. It uses a warm sandbox with services at known-good versions and hot-swaps only the changed service(s). It consults the interaction graph to identify the affected paths, then runs a targeted subset of integration tests scoped to those paths. This is primarily smarter test selection, not test generation. If something fails, the developer gets a diagnostic pointing to the specific service boundary that broke, not a generic red/green.

**Layer 2: Per-batch gate (5 to 15 minutes).** When multiple PRs are batched for deployment, affected surfaces overlap. A change to service B's retry logic might be safe in isolation, but combined with a change to service C's timeout configuration, it creates a failure mode neither PR triggered alone. This layer runs a broader suite across the combined scope, including fault injection scenarios that are too slow for per-PR.

**Layer 3: Deep suite (nightly or on-demand, 30+ minutes).** Full interaction graph traversal: broad path coverage, fault injection, race condition probing, multi-service state transition testing. This is also where test effectiveness is measured and the per-PR suite is re-prioritized based on what actually caught real issues versus what produced noise. It catches the slow-burn regressions that narrow per-PR scoping misses: emergent failures that only manifest when multiple services drift over time.

### Post-deployment verification

The three layers above are pre-deployment gates. They answer "is this change safe to ship?" But a sandbox is not production. The system must also verify that gated changes actually behave as predicted once they are live.

After a gated change deploys, the system watches production telemetry for the specific service boundaries it tested. It consumes traces, error logs, and latency metrics from whatever observability pipeline the customer already runs and compares observed behavior against the baseline in the interaction graph. If the gate predicted "no regression on the B-to-D path" and production traces show a spike in errors on that exact path within the deployment window, that is a verification miss.

This is distinct from observability. Observability surfaces anomalies. This layer correlates anomalies to specific gated changes and specific sandbox predictions. Every deployment becomes a test of the gate's accuracy. Predictions that held strengthen the graph's confidence scoring. Predictions that missed trigger graph updates and test re-prioritization.

This feedback loop is arguably the highest-value component in the entire system. Without it, the gate is only as good as its initial configuration. With it, every deployment makes the next prediction more accurate. And because the loop builds on the customer's existing observability stack rather than replacing it, the integration cost is low relative to the value.

## Market Dynamics

The interaction graph and per-PR gating are the core product: daily value, high switching costs. Layers 2 and 3 represent increasing depth that justifies tiered pricing.

The defensible pricing axis is "number of services gated," not "number of tests run." Each additional service added to the interaction graph increases coverage of the paths that service participates in and improves confidence scoring for adjacent services whose call chains pass through it. This is coverage compounding, not a pure network effect, but it produces similar lock-in: removing a service from the graph degrades predictions for every path that touched it.

The entry point is the platform engineering budget, positioned as CI/CD infrastructure rather than testing tooling. The buyer is the team responsible for deployment reliability, not the team responsible for writing tests. Testing tool budgets are discretionary and small. Infrastructure budgets tied to incident prevention are larger and stickier.

### What compounds and what does not

The system learns which paths break, which fault injections reveal real issues versus noise, and which fixes hold. A new entrant starts cold. The interaction graph is specific to each customer's architecture and cannot be replicated without running the same system through the same gates over time. CI/CD gating that demonstrably prevents incidents is painful to remove.

Sandbox orchestration, on the other hand, is commoditizing. If the test selection and scoping engine is replicated, the proprietary surface narrows to the managed platform and accumulated graph data.

## Threats

Three threats are worth taking seriously.

The first is **adjacent competitors.** Observability vendors (Datadog, Honeycomb) already have production traces, service maps, and CI/CD integrations. If they add pre-deployment gating, they start with distribution advantage and existing trust relationships. The bet is that pre-deployment verification is a different product surface than observability: different data pipelines, different execution model, different feedback loops. Bolting this onto an observability platform is a rebuild, not a feature addition. But a well-resourced vendor with the right team could close the gap.

The second is the **mundane improvement of existing tools.** Better static contracts through Smithy and protobuf adoption, broader tracing coverage through OpenTelemetry, smarter test selection built into existing build tools. These are boring, incremental, and collectively close most of the gap without a new product category. The temporal window may be narrower than assumed, not because of any single breakthrough, but because the existing toolchain gets incrementally better on multiple fronts.

The third is **coding agents learning to self-verify** multi-service behavior before submitting code. Verification in distributed systems is harder than generation: an agent would need to reason about realistic state across dozens of services, inject faults, and account for timing variance. That is a qualitatively different capability than writing correct code for a single service. The gap between "hard" and "solved" is the uncertainty this entire bet rests on, and honest forecasting requires admitting that the timeline is the least certain assumption in this document.

## Key Risks

**Per-PR speed.** If Layer 1 exceeds two minutes, adoption fails. Everything else in the architecture serves this constraint. This is the single most important engineering risk.

**False positives.** A gate that cries wolf is worse than no gate. Confidence scoring, plain-language rationales for every failure, and suppression controls are non-negotiable. The target is a false positive rate below 5% within 30 days of onboarding. Above that, teams disable the gate.

**Sandbox fidelity.** Stacks with heavy reliance on managed cloud services will have lower-fidelity sandboxes than container-native stacks. Transparent fidelity scoring lets teams know exactly where the simulation boundary lies. Never fake confidence.

**Graph accuracy.** Stale traces, undiscovered dependencies, or non-instrumented communication channels create blind spots. The system must surface what it does not know, not just what it does.

**Underestimating simpler solutions.** Many of the failures this system targets can be prevented earlier and cheaper: machine-enforced contracts prevent schema drift at compile time, complete tracing makes boundary failures visible without a separate system, better unit tests with realistic failure injection catch boundary-adjacent logic errors without multi-service execution. A team that invests seriously in all three of these layers will shrink the residual gap. The system must deliver clear value on the failures that survive those investments, or teams will correctly choose the simpler path.

## Conclusion

AI coding tools have widened a gap between code production and code verification. The failures that live in that gap concentrate at service boundaries, and existing tools each cover part of the surface without closing it. Static contracts prevent schema drift but not semantic regressions. Tracing provides the interaction graph but is used reactively. Observability catches problems after they are incidents. Integration testing catches interaction failures but lacks intelligent scoping.

The architecture described here layers verification depth to match risk scope, builds on distributed tracing rather than replacing it, and closes the feedback loop between pre-deployment predictions and post-deployment reality. The hard constraint is speed. Everything else follows from whether the per-PR gate stays under two minutes.

This is a bet on a temporal gap. The interaction graph compounds with use, the gating becomes painful to remove, and a new entrant starts cold. The threats are real but different in kind: observability vendors have distribution, existing tools are improving incrementally, and agents may eventually self-verify. The risks that kill the effort are internal: a gate that is too slow, a false positive rate that erodes trust, or a failure to deliver value beyond what simpler investments in contracts and tracing already provide.
