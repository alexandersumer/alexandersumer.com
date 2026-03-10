---
title: "Preparing for ARENA: The Mental Models You'll Need"
date: 2026-03-06
description: 'A guide to the key mental models you need before starting ARENA, covering transformers, mechanistic interpretability, RL, and alignment.'
draft: false
---

## What you're walking into

ARENA has five sequenced chapters: Neural Network Fundamentals, Transformers & Mechanistic Interpretability, Reinforcement Learning, LLM Evaluations, and Alignment Science. This post introduces nine mental models that cut across those chapters. The goal is to make the concepts easier to follow when they come up, not to teach them from scratch.

This assumes you are comfortable with Python, tensors, and basic ML, but new to interpretability and alignment.

---

## 1. Neural networks are learned function approximators

A neural network is a parameterized function mapping inputs to outputs. Training adjusts those parameters to reduce a measure of error, called the loss function, by computing how each parameter contributed to the error and updating it accordingly with gradient descent.

Every architectural choice changes what the network can learn easily. Convolutions encode the assumption that nearby pixels matter more than distant ones. Attention lets the network learn which parts of the input matter for a given prediction. Residual connections are central to the rest of the curriculum, and you will build them into a ResNet in Chapter 0.

Residual connections solve a simple problem. Without one, each layer has to rewrite its entire input from scratch, like rewriting a whole document every time even if only a few sentences need to change. That is a hard job, and it makes it easy to lose useful information along the way. A residual connection changes this: the layer's output gets added back to its input, so the layer only has to learn the difference between what came in and what should go out.

That difference is the "residual," like the residual in statistics: the gap between a prediction and the actual value. A layer can now default to doing nothing, output zero, and pass the input through unchanged. Then it only has to learn small corrections. This is easier to optimize. The same idea shows up at every layer of a transformer.

## 2. Tensors are the language, einops is the dialect

You'll implement everything from scratch in PyTorch, so you need to think natively in tensors. A tensor is a multi-dimensional grid of numbers where each axis has a meaning: batch, sequence position, embedding dimension, attention head, and so on.

The important point is not just that tensors store numbers. They store structure. If you lose track of what each axis means, transformer code becomes hard to read very quickly.

The `einops` library helps by making axis structure explicit. Instead of chaining `reshape`, `permute`, and `transpose`, you can write `rearrange(x, 'batch seq (heads dim) -> batch heads seq dim', heads=8)` and the intent is obvious. Get comfortable with `einops` and `einsum` before the program starts. They show up everywhere.

## 3. The transformer as a residual stream computer

This is the single most important mental model in the curriculum.

A transformer processes sequences of tokens, which are words or word-pieces. Each token gets converted into a vector of numbers called an embedding: a point in a high-dimensional space where similar meanings tend to end up near each other.

The key question is: where does the model keep its current working state as it processes the sequence? The answer is the residual stream. You can think of it as a shared running state for each token. Each token's embedding enters the stream, and then every component in the transformer, attention heads and MLP layers, reads from that stream, computes something, and adds its result back in.

No component replaces what is already there. It only adds to it. This is the residual connection idea from section 1, applied at every step.

This additive structure matters for interpretability. The model's final output is a set of logits, raw scores over the vocabulary, and those logits are built from the sum of many component contributions. So you can ask: what did attention head 3 in layer 2 add to this prediction? That decomposition is what makes mechanistic interpretability possible.

## 4. Attention is information routing

A token often needs information from somewhere else in the sequence. To predict the next word in "The capital of France is \_\_\_", the current position needs to pull in information from "France." More generally, tokens need a way to look up context.

Attention is that lookup mechanism. Where MLP layers transform each position independently, attention heads move information between positions. For each token, a head asks: which other tokens have information I need, and what should I copy from them?

This breaks into two subproblems. The QK circuit (query and key matrices) decides where to look. Each token produces a query ("what am I looking for?") and a key ("what do I contain?"). When a query and key point in similar directions, the head attends to that source position. The OV circuit (value and output matrices) decides what to move. It extracts content from the source and writes it into the destination token's residual stream. These two subproblems are largely independent, which is why they can be studied separately.

Induction heads are the first case study. Their job is pattern completion: if A was followed by B earlier in the context, and A appears again, predict B. This requires two heads working together across layers. The first copies information about what preceded each token. The second uses that information to find the match and boost the continuation.

## 5. Features, directions, and superposition

The basic interpretability picture is that the model represents meaningful concepts as directions in activation space. A direction might correspond to "this token is a number," "this text is about animals," or "this word is part of a name." When that feature is active, the residual stream vector has a large component along that direction. When it is inactive, it does not.

That picture is simple enough in principle. The complication is that the model seems to represent far more useful features than it has clean dimensions to store them in.

In a 3D space, you can have three perfectly independent directions. In a 1,000-dimensional space, you get 1,000. But networks appear to use many more features than that. A 1,000-dimensional residual stream may encode tens of thousands of concepts.

So what happens when there are more concepts than clean slots? The model packs multiple features into overlapping directions. That is superposition. Think of it like assigning many different radio stations to nearly the same frequency. As long as only a few broadcast at once, you can still pick out each signal.

This works because of two facts. First, most features are sparse: "is this about dogs" and "is this a legal term" are rarely active at the same time. Second, high-dimensional spaces have much more room than 3D intuition suggests. As dimensions grow, you can fit large numbers of near-orthogonal directions that interfere only a little.

A sparse autoencoder, or SAE, is a network trained to recover individual features from a model's mixed internal activations. It learns a larger feature space while enforcing that only a few features should be active at once. The hope is that these learned features line up with interpretable concepts.

This is why neuron-by-neuron inspection often breaks down, and why SAEs are a major focus of the interpretability chapters.

## 6. Circuits: how features connect

Finding a feature is only the start. The deeper question is how the model uses features to produce a behavior. A circuit is the smallest causal story you can tell about that: which components, in which order, produce a specific output.

The major case study is the Indirect Object Identification, or IOI, circuit in GPT-2 Small. Given "When Mary and John went to the store, John gave a drink to \_\_\_", the model predicts "Mary." Researchers traced this to a set of attention heads with distinct roles. Some detect that "John" is repeated. Some identify "Mary" as the non-repeated name. Some suppress "John" from the prediction.

The technique for establishing this is activation patching, a way to run a controlled experiment on the model's internals. You run the model on a clean input and a corrupted input, for example with the names scrambled. Then you swap one component's activations from the corrupted run into the clean run. If the prediction breaks, that component was causally involved. For instance, patching the "repeated name" head in the IOI circuit shifts the output away from "Mary" and back toward chance.

This is how you move from knowing what features exist to knowing how the model actually uses them.

## 7. Reinforcement learning and RLHF

In supervised learning, you have correct answers to compare against. In reinforcement learning, you do not get told the right move directly. You only get a reward signal: a number saying how well the agent did after the fact.

That makes the problem harder. The agent has to learn a policy, a rule mapping situations to actions, from delayed and incomplete feedback.

Two problems dominate this setting. The first is credit assignment. If you win a chess game, which move deserves the credit: the opening, the middle-game sacrifice, or the endgame technique? The second is exploration versus exploitation. Should the agent try new strategies that might work better, or keep using the strategy that already seems best?

You will implement two algorithms. Deep Q-Networks, or DQN, learn the expected value of each action in each state and then pick the best one. Proximal Policy Optimization, or PPO, skips the value table and updates the policy directly, which scales better when the action space is large, like generating text token by token.

PPO matters for safety because it underlies RLHF, Reinforcement Learning from Human Feedback. In RLHF, human preference judgments ("output A is better than output B") become a reward signal for fine-tuning language models. You will apply RLHF to the transformers you build earlier in the course.

## 8. Evaluations

Loss tells you how well a model predicts on average. That is useful, but not enough. A model can score well on aggregate benchmarks and still, say, reliably follow harmful instructions when they are phrased as role-play.

Evaluations test for specific behaviors and failure modes, not just overall capability. You will build a benchmark from scratch, use the UK AISI's Inspect library for standardized evaluations, and construct LLM agents (models given tools and multi-step reasoning scaffolding) to evaluate.

Evaluation is harder than it looks. Models can game benchmarks. Capabilities can depend on prompt format, tool access, or surrounding context. There is a real gap between "can do X in a lab" and "will do X in deployment." This is how capability gets tested instead of assumed.

## 9. Alignment science

A model can be capable and still pursue the wrong objective. The hard part is that misalignment may not show up during training. A model can behave well on the distribution it was trained on and drift when the context changes, for instance following instructions faithfully in evaluations but behaving differently when it detects it is deployed unsupervised.

This chapter covers several angles on that problem. Emergent misalignment is when fine-tuning for one objective causes unexpected behavioral changes on others. Persona vectors and model psychology try to characterize stable behavioral tendencies. You will also apply interpretability to chain-of-thought reasoning, and use both black-box methods (studying behavior from the outside) and white-box methods (examining activations and weights directly) to detect misaligned behavior.

This is where the earlier tools stop being abstract. Everything you learned about features, circuits, and evaluations converges on the question: does this model do what we intended, including in settings we did not design for?

---

## Practical advice

**Pair programming:** Don't neglect the navigator role, the person thinking strategically while someone else codes. It forces you to explain your reasoning at a higher level, which transfers directly to research.

**Pacing:** ARENA is dense. You won't retain everything on the first pass. Focus on understanding why each technique works. You can look up the details later.

**Capstone:** The final three weeks are project time. Start thinking early. A clean replication of one result from a recent paper is worth more than an ambitious half-finished project.

**Prerequisites:** Be fluent with PyTorch tensor operations, basic linear algebra such as matrix multiplication, eigenvalues, and SVD, and Python. Work through the prerequisite notebook they send you.

---

## The big picture

AI safety research asks: as AI systems grow more capable, how do we ensure they do what we want?

ARENA's angle is that understanding how a model computes its outputs gives you leverage. If you can see how information moves, where representations live, and which components drive which behaviors, you have a foundation for detecting and correcting dangerous behavior.

The tools you'll learn have real limitations. But the field is still small enough that a solid capstone project can be a genuine contribution.
