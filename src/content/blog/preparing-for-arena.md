---
title: "Preparing for ARENA: The Mental Models You'll Need"
date: 2026-03-06
description: 'A guide to the key mental models you need before starting ARENA, covering transformers, mechanistic interpretability, RL, and alignment.'
draft: false
---

## What you're walking into

ARENA has five sequenced chapters: Neural Network Fundamentals, Transformers & Mechanistic Interpretability, Reinforcement Learning, LLM Evaluations, and Alignment Science. Each builds on the last. This guide covers the mental models you'll need going in.

---

## 1. Neural networks are learned function approximators

A neural network is a parameterized function mapping inputs to outputs. Training adjusts those parameters to reduce a measure of error (the _loss function_) by computing how each parameter contributes to the error and updating it accordingly (_gradient descent_).

Every architectural choice shapes what the network can learn easily. Convolutions encode the assumption that nearby pixels matter more than distant ones. Attention (section 4) lets the network learn which parts of the input to focus on. Residual connections, which you'll build into a ResNet in Chapter 0, are central to the rest of the curriculum.

**Residual connections.** Normally a layer must learn the entire function that maps its input to the desired output. A residual connection changes the job: the layer's output gets _added back to its own input_. So the layer only needs to learn the _difference_ between what came in and what should go out. That difference is the "residual," like the residual in statistics (the gap between a prediction and the actual value). This means a layer can default to doing nothing (outputting zero, passing the input through unchanged) and only learn small corrections. This is easier to optimize, and it's the same principle that makes transformers work.

## 2. Tensors are the language, einops is the dialect

You'll implement everything from scratch in PyTorch, so you need to think natively in tensors. A tensor is a multi-dimensional grid of numbers where each axis has a meaning: batch (which example), sequence position (which token), embedding dimension (which feature slot), attention head, etc.

The `einops` library lets you name these axes explicitly. Instead of chaining `reshape`, `permute`, and `transpose`, you write `rearrange(x, 'batch seq (heads dim) -> batch heads seq dim', heads=8)` and the intent is obvious. Get comfortable with einops and einsum before the program starts. They show up everywhere.

## 3. The transformer as a residual stream computer

This is the single most important mental model in the curriculum.

A transformer processes sequences of tokens (words or word-pieces). Each token gets converted into a vector of numbers called an **embedding**: a point in a high-dimensional space where similar meanings end up near each other.

The **residual stream** is how this works in transformers. Each token's embedding enters the stream, and then every component in the transformer (attention heads and MLP layers) reads from the stream, computes something, and _adds_ its result back. No component replaces what's there; it only adds to it. This is the residual connection idea from section 1, applied at every step.

Because the stream is built purely by addition, the model's final output (the **logits**, raw scores over the vocabulary for predicting the next token) is a _sum of contributions_ from every component. You can decompose it and ask "what did attention head 3 in layer 2 contribute to this prediction?" This is what makes mechanistic interpretability possible.

## 4. Attention is information routing

Attention heads don't transform information the way MLP layers do (MLPs apply nonlinear functions to each position independently). Attention heads _move information between positions_. Each head computes: "for each token, which other tokens have relevant information, and what should I copy from them?"

Each head uses four matrices to do this:

- **Q** (query) and **K** (key) determine _where to look_. Each token produces a query ("what am I looking for?") and a key ("what do I contain?"). Queries and keys that point in similar directions produce high attention scores, causing the head to attend to that source position.
- **V** (value) and **O** (output) determine _what to move_. The value extracts the relevant content from the source, and the output matrix writes it into the destination token's residual stream.

The where-to-look machinery (QK) and the what-to-move machinery (OV) are largely independent, so you can study them separately.

**Induction heads** are your first case study. They implement a pattern-completion algorithm: "if A was followed by B earlier in the context, and A appears again now, predict B." This requires two heads across layers cooperating. The first ("previous token head") copies information about what preceded each token. The second ("induction head") uses that information to identify the match and boost the prediction.

## 5. Features, directions, and superposition

The working hypothesis of mechanistic interpretability is that **features** (meaningful concepts like "this text is about dogs" or "this token is a number") are represented as **directions** in the residual stream. When a feature is active, the residual stream vector has a large component along the corresponding direction. When it's inactive, it doesn't.

In a 3D space, you can have three perfectly independent (orthogonal) directions, each representing one feature. In a 1,000-dimensional space, you get 1,000. But networks seem to use far more features than they have dimensions. A 1,000-dimensional stream might encode tens of thousands of concepts.

This is **superposition**. It works because most features are _sparse_: "is this about dogs" and "is this a legal term" are rarely active at the same time. In high-dimensional spaces, you can find a huge number of directions that are _nearly_ (not perfectly) perpendicular. The network assigns one near-perpendicular direction per feature. Because features rarely co-activate, the small interference between imperfectly separated directions rarely causes problems in practice.

**Sparse autoencoders (SAEs)** are the main tool for untangling superposition. An SAE takes the model's internal activations and decomposes them into a much larger set of features, with the constraint that only a few are active at any time (sparsity). Each learned feature corresponds to a specific concept and activates only when that concept is present.

## 6. Circuits: how features connect

A **circuit** is a subgraph of the model's computation that explains a specific behavior: not just what features exist, but how features in early layers cause features in later layers to produce the final output.

The major case study is the **Indirect Object Identification (IOI)** circuit in GPT-2 Small. Given "When Mary and John went to the store, John gave a drink to \_\_\_", the model predicts "Mary." About 26 attention heads participate, with interpretable roles: some detect that "John" is repeated, some identify "Mary" as the non-repeated name, some suppress "John" from the prediction.

The core technique is **activation patching**. You run the model on a clean input and a corrupted input (e.g., names scrambled), then selectively swap one component's internal activations between runs and see if performance breaks. If swapping a specific head's output damages the prediction, that head is part of the circuit.

## 7. Reinforcement learning and RLHF

In supervised learning you have correct answers to compare against. In reinforcement learning (RL) you have only a reward signal: a number that says how well the agent did after the fact, not what it should have done differently. An agent learns a **policy** (a rule mapping situations to actions) that maximizes cumulative reward over time. The central challenges are credit assignment (a reward arrives after many actions; which ones deserve credit?) and exploration vs. exploitation (try new strategies, or stick with what works?).

You'll implement Deep Q-Networks (DQN, which learn the expected value of each action in each situation) and Proximal Policy Optimization (PPO, which directly adjusts the policy). PPO matters most for safety because it underlies **RLHF** (Reinforcement Learning from Human Feedback): human preference judgments ("output A is better than output B") become the reward signal for fine-tuning language models. You'll apply RLHF to the transformers you build earlier in the course.

## 8. Evaluations

You'll build a benchmark from scratch, use the UK AISI's Inspect library for standardized evaluations, and construct LLM agents (models given tools and multi-step reasoning scaffolding) to evaluate. Evaluation is harder than it looks: models can game benchmarks, capabilities can be context-dependent, and there is a real gap between "can do X in a lab" and "will do X in deployment."

## 9. Alignment science

This chapter covers **emergent misalignment** (fine-tuning a model for one objective causing unexpected behavioral changes on others), persona vectors and model psychology, interpretability applied to chain-of-thought reasoning, and both black-box methods (testing behavior from outside, without seeing internals) and white-box methods (examining internal activations and weights) for characterizing misaligned behavior.

---

## Practical advice

**Pair programming:** Don't neglect the navigator role (thinking strategically while someone else codes). It forces you to articulate reasoning at a higher level, which transfers directly to research.

**Pacing:** ARENA is dense. You won't retain everything on the first pass. Focus on understanding _why_ each technique works; you can re-derive or look up the details later.

**Capstone:** The final three weeks are project time. Start thinking early. A clean replication of one result from a recent paper is worth more than an ambitious half-finished project.

**Prerequisites:** Be fluent with PyTorch tensor operations, basic linear algebra (matrix multiplication, eigenvalues, SVD), and Python. Work through the prerequisite notebook they send you.

---

## The big picture

AI safety research asks: as AI systems grow more capable, how do we ensure they do what we want? ARENA's angle is that if you can understand _how_ a model computes its outputs, you have a foundation for detecting and correcting dangerous behavior. The tools you'll learn have real limitations, but the community is small enough that a solid capstone project can be a genuine contribution.
