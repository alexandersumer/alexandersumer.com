---
title: 'Mental Models for ARENA'
date: 2026-03-06
description: 'A guide to the key mental models you need before starting ARENA, covering transformers, mechanistic interpretability, RL, and alignment.'
draft: false
---

## What ARENA covers

ARENA has five sequenced chapters: Neural Network Fundamentals, Transformers & Mechanistic Interpretability, Reinforcement Learning, LLM Evaluations, and Alignment Science. Each builds on the last. This guide covers the mental models you'll need going in.

---

## 1. Neural networks are learned function approximators

A neural network is a parameterized function mapping inputs to outputs. Training adjusts those parameters to reduce a measure of error, called the loss function, by computing how each parameter contributed to the error and updating it accordingly with gradient descent.

Every architectural choice changes what the network can learn easily. Convolutions encode the assumption that nearby pixels matter more than distant ones. Attention, which we'll get to in section 4, lets the network learn which parts of the input matter for a given prediction. Residual connections, which you'll build into a ResNet in Chapter 0, are central to the rest of the curriculum.

Residual connections solve a simple problem. Without one, each layer has to rewrite its entire input from scratch, like rewriting a whole document every time even if only a few sentences need to change. That is a hard job, and it makes it easy to lose useful information along the way. A residual connection changes this: the layer's output gets added back to its input, so the layer only has to learn the difference between what came in and what should go out.

That difference is the "residual," like the residual in statistics: the gap between a prediction and the actual value. A layer can now default to doing nothing, output zero, and pass the input through unchanged. Then it only has to learn small corrections. This is easier to optimize, and it is the same basic idea that makes transformers work.

## 2. Thinking in tensors

You'll implement everything from scratch in PyTorch, so you need to think natively in tensors. A tensor is a multi-dimensional grid of numbers where each axis has a meaning: batch, sequence position, embedding dimension, attention head, and so on.

The important point is not just that tensors store numbers. They store structure. If you lose track of what each axis means, transformer code becomes hard to read very quickly.

Two libraries make this manageable. Get comfortable with both before the program starts. They show up everywhere.

`einsum` makes tensor multiplication declarative. Matrix multiplication, dot products, and outer products are all the same underlying operation: multiply along shared axes and sum. Instead of remembering which PyTorch function handles which shape, you name the axes. `einsum('batch seq dim, dim hidden -> batch seq hidden', x, w)` says: multiply along `dim`, keep everything else. Axis names that appear in both inputs but not the output get contracted. The remaining names define the shape of the result.

`einops` solves a different problem. A single tensor axis often packs multiple logical dimensions together, and you need to unpack them. Consider a tensor of shape `(2, 10, 512)`: two batch items, 10 tokens each, 512 dimensions per token. That 512 is not a flat list of numbers. It contains 8 attention heads worth of information concatenated together, 64 dimensions per head. Positions 0–63 belong to head 1, 64–127 to head 2, and so on through head 8.

`rearrange(x, 'batch seq (heads dim) -> batch heads seq dim', heads=8)` makes that hidden structure explicit. It splits the 512 into 8 groups of 64 and gives each head its own axis, producing shape `(2, 8, 10, 64)`: 2 batch items, 8 heads, 10 tokens, 64 dimensions per head. Each head now has a clean workspace to compute attention in, without its numbers interleaved with the other heads.

This pays off immediately in section 4. Every attention head needs its own separate queries, keys, and values. The rearrange is what splits them apart so each head can operate independently, and the reverse merges them back when the head is done.

## 3. The transformer as a residual stream computer

A transformer processes sequences of tokens, which are words or word-pieces. Each token gets converted into a vector of numbers called an embedding: a point in a high-dimensional space where similar meanings tend to end up near each other.

The key question is: where does the model keep its current working state as it processes the sequence? The answer is the residual stream. You can think of it as a shared running state for each token. Each token's embedding enters the stream, and then every component in the transformer, attention heads and MLP layers, reads from that stream, computes something, and adds its result back in.

No component replaces what is already there. It only adds to it. This is the residual connection idea from section 1, applied at every step.

This additive structure matters for interpretability. The model's final output, the logits or raw scores over the vocabulary, is built from the sum of many component contributions. So you can ask a concrete question like: what did attention head 3 in layer 2 contribute to this prediction? That decomposition is one of the main reasons mechanistic interpretability is possible.

## 4. Attention is information routing

A token often needs information from somewhere else in the sequence. To predict the next word in "The capital of France is \_\_\_", the current position needs to pull in information from "France." More generally, tokens need a way to look up context.

Attention is that lookup mechanism. Attention heads do not mainly transform information in place the way MLP layers do. MLPs apply nonlinear functions to each position independently. Attention heads move information between positions. For each token, a head asks: which other tokens have information I need, and what should I copy from them?

Each head uses four matrices to do this:

- **Q** (query) and **K** (key) determine where to look. Each token produces a query, meaning "what am I looking for?", and a key, meaning "what do I contain?" Queries and keys that point in similar directions produce high attention scores, causing the head to attend to that source position.
- **V** (value) and **O** (output) determine what to move. The value extracts the relevant content from the source, and the output matrix writes it into the destination token's residual stream.

So there are really two subproblems here: where to look, handled by QK, and what to move, handled by OV. These are largely independent, which is why they can often be studied separately.

Induction heads are your first case study. The basic idea is: "I've seen this pattern before, so what came next last time?" If A was followed by B earlier in the context, and A appears again now, predict B. This requires two heads across layers working together. The first, often called a previous-token head, is purely mechanical: it always attends one position back, regardless of content, copying information about what preceded each token. The second head is the interesting one. It uses the information the first head copied to find the matching token and boost the predicted continuation. This two-head composition, one head setting up the information another head needs, is the simplest example of a circuit, which section 6 covers in full.

## 5. Features, directions, and superposition

The basic interpretability picture is that the model represents meaningful concepts as directions in activation space. A direction might correspond to "this token is a number," "this text is about animals," or "this word is part of a name." When that feature is active, the residual stream vector has a large component along that direction. When it is inactive, it does not.

The complication is that the model seems to represent far more features than it has dimensions to store them in.

In a 1,000-dimensional space, you can have at most 1,000 orthogonal directions. But networks appear to use many more features than that. A 1,000-dimensional residual stream may encode tens of thousands of concepts. The model packs multiple features into overlapping, nearly orthogonal directions. That is superposition.

This works because of two facts. First, most features are sparse: "is this about dogs" and "is this a legal term" are rarely active at the same time. Second, high-dimensional spaces have much more room than our 3D intuition suggests. As dimensions grow, you can fit huge numbers of directions that are not perfectly orthogonal but still interfere only a little.

The model takes advantage of this by storing features in near-separate directions rather than perfectly separate ones. Because most of those features rarely turn on together, the overlap usually does not cause serious problems.

Sparse autoencoders, or SAEs, are the main tool for untangling this. If the model compressed 10,000 features into 1,000 dimensions via superposition, an SAE expands back out to a larger space and looks for axes that correspond to individual features. It enforces that only a few features should be active at once. That sparsity constraint is what makes this work: without it, there are infinitely many ways to decompose the activations and no reason to prefer one over another. The hope is that these learned features line up with interpretable concepts.

## 6. Circuits: how features connect

Finding a feature is only the start. The deeper question is how the model uses features to produce a behavior.

That is what a circuit is for. A circuit is a subgraph of the model's computation that explains a specific behavior: not just what features exist, but how features in earlier layers lead to features in later layers and finally to the output.

The major case study is the Indirect Object Identification, or IOI, circuit in GPT-2 Small. Given "When Mary and John went to the store, John gave a drink to \_\_\_", the model predicts "Mary." The interesting part is not just that it gets the answer right. It is that researchers can identify a set of attention heads with distinct roles in producing that answer. Some detect that "John" is repeated. Some identify "Mary" as the non-repeated name. Some suppress "John" from the prediction.

The core technique here is activation patching. You run the model on a clean input and a corrupted input, for example with the names scrambled. Then you selectively swap one component's activations from the corrupted run into the clean run. If replacing a specific head's output damages the prediction, that head is causally involved in the behavior, not just correlated with it. It is essentially a controlled experiment on the model's internals.

## 7. Reinforcement learning and RLHF

In supervised learning, you have correct answers to compare against. In reinforcement learning, you do not get told the right move directly. You only get a reward signal: a number saying how well the agent did after the fact.

That makes the problem harder. The agent has to learn a policy, a rule mapping situations to actions, from delayed and incomplete feedback.

Two problems dominate this setting. The first is credit assignment. If you win a chess game, which move deserves the credit: the opening, the middle-game sacrifice, or the endgame technique? The second is exploration versus exploitation. Should the agent try new strategies that might work better, or keep using the strategy that already seems best?

You'll implement two algorithms. Deep Q-Networks, or DQN, learn a map of how good each action is in each situation, then pick the best one. Proximal Policy Optimization, or PPO, skips the map and directly adjusts what the agent does. That directness is part of why PPO scales to RLHF, where the action space is all possible text outputs and building a value map over that is impractical.

PPO matters most for safety because it underlies RLHF, Reinforcement Learning from Human Feedback. In RLHF, human preference judgments like "output A is better than output B" get turned into a reward signal for fine-tuning language models. You'll apply RLHF to the transformers you build earlier in the course.

## 8. Evaluations

Loss tells you how well a model predicts on average. That is useful, but it is not enough. A model can have good overall performance and still fail in exactly the ways you care about.

Evaluations test for specific behaviors and failure modes, not just overall capability.

You'll build a benchmark from scratch, use the UK AISI's Inspect library for standardized evaluations, and construct LLM agents, meaning models given tools and multi-step reasoning scaffolding, to evaluate.

Evaluation is harder than it looks. Models can game benchmarks. Capabilities can depend heavily on prompt format, tool access, or surrounding context. There is also a real gap between "can do X in a lab" and "will do X in deployment," and good evaluations try to close that gap.

## 9. Alignment science

A model can be capable and still pursue the wrong objective. That is the basic problem alignment tries to address.

This chapter covers several ways that problem can show up. One is emergent misalignment, where fine-tuning for one objective causes unexpected behavioral changes on others. Another is persona vectors and model psychology, which try to characterize stable behavioral tendencies in models. You'll also look at interpretability applied to chain-of-thought reasoning, and at both black-box and white-box methods for characterizing misaligned behavior.

Black-box methods study behavior from the outside, without seeing internals. White-box methods examine activations and weights directly.

The question running through all of this is whether a model's behavior reliably tracks the objective you intended, including in settings you did not design for in advance.

---

## Practical advice

**Pair programming:** Don't neglect the navigator role, the person thinking strategically while someone else codes. It forces you to explain your reasoning at a higher level, which transfers directly to research.

**Pacing:** ARENA is dense. You won't retain everything on the first pass. Focus on understanding why each technique works. You can look up the details later.

**Capstone:** The final week is project time. Start thinking early. A clean replication of one result from a recent paper is worth more than an ambitious half-finished project.

**Prerequisites:** Be fluent with PyTorch tensor operations, basic linear algebra such as matrix multiplication, eigenvalues, and SVD, and Python. Work through the prerequisite notebook they send you.

---

## The big picture

AI safety research asks: as AI systems grow more capable, how do we ensure they do what we want?

ARENA's angle is that understanding how a model computes its outputs gives you leverage. If you can see how information moves, where representations live, and which components drive which behaviors, you have a foundation for detecting and correcting dangerous behavior.

The tools you'll learn have real limitations, but the field is still small enough that a solid capstone project can be a genuine contribution.
