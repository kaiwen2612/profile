---
title: "Off-Topic V2 Guardrail"
slug: off-topic-v2-guardrail
summary: "An internal GovTech project that benchmarked six embedding-plus-classifier architectures and expanded the training data for an off-topic guardrail, to catch off-topic prompts sent to government chatbots more reliably."
technologies:
  - name: "PyTorch & Hugging Face Transformers"
    why: "Loaded and ran three frozen long-context embedding models (Snowflake Arctic Embed m-v2, Jina Embeddings v3, BGE-M3), including a compatibility patch for Jina's xlm-roberta implementation on the transformers version in use."
  - name: "scikit-learn"
    why: "Trained the Logistic Regression classifiers and computed accuracy, F1, and confusion-matrix error counts for every architecture."
  - name: "XGBoost"
    why: "The gradient-boosted classifier half of each architecture pairing, trained with early stopping; it out-performed Logistic Regression on nearly every dataset tested."
  - name: "pandas & TF-IDF/Jaccard similarity"
    why: "Used in the exploratory data analysis to measure system-prompt/user-prompt similarity and to build a chatbot type x domain coverage matrix that guided the dataset expansion."
decisions:
  - decision: "Chose to freeze three long-context embedding models (Snowflake Arctic Embed m-v2, Jina Embeddings v3, BGE-M3) and train a lightweight classifier (Logistic Regression or XGBoost) on top of each, rather than fine-tuning an embedding model end-to-end, and benchmarked all six resulting architectures against each other and against the two existing production baselines."
    rejectedAlternative: "Fine-tuning an embedding model directly. These three models were specifically chosen because they support up to 8,192 tokens of context, well beyond the 514/1,024-token limits of the existing off-topic classifiers, so extending usable context was the point; freezing the embeddings and training only a small classifier on top kept six full architecture comparisons fast enough to run and evaluate directly against each other."
  - decision: "Expanded the training data with three targeted interventions grounded in the EDA findings, instead of just scaling up the existing dataset: 50 hard positives and 50 hard negatives per unique system prompt to stress-test the decision boundary, extra system prompts targeting the chatbot type x domain combinations a coverage-matrix analysis showed were underrepresented (Developer & Data Work chatbots had the weakest coverage), and real production prompts folded in for real-world validity."
    rejectedAlternative: "Leaving the dataset as-is and relying on model choice alone to close the gap. The EDA showed the existing dataset had genuine coverage and boundary-case gaps that a bigger model couldn't paper over — data curation was the higher-leverage fix."
result: "The jina-embeddings-v3 (frozen) + XGBoost architecture was selected as the best overall: 98% accuracy on the diverse dataset, 92% accuracy on the hard edge-case dataset, and 85.71% accuracy (F1 0.8815) on the production dataset, the strongest balance of controlled-dataset and real-world performance among the six architectures tested. On the production dataset it clearly beat the existing govtech/jina-embeddings-v2-small-en-off-topic baseline (60.79% accuracy, 785 false negatives) and traded blows with govtech/stsb-roberta-base-off-topic (90.15% accuracy but 217 false positives, versus the new model's 20)."
learned: "TODO: a genuine reflection — what surprised you comparing six architectures side by side, what the EDA taught you about the existing dataset's weak spots, or what you'd tackle next now that jina-embeddings-v3 + XGBoost is the leading candidate."
order: 3
---

**Off-Topic V2** was an internal GovTech project to strengthen an existing off-topic guardrail: a classifier that flags user prompts sent to a chatbot as on-topic or off-topic relative to that chatbot's system prompt. The goal was to improve generalization across diverse prompts and ambiguous edge cases, and to reduce both false positives and false negatives, while staying within the low-latency, low-hardware-budget constraints of a production guardrail.

## Problem

The existing off-topic classifiers (`govtech/stsb-roberta-base-off-topic` and `govtech/jina-embeddings-v2-small-en-off-topic`) were limited to 514 and 1,024 tokens of context respectively, well short of what a realistic system prompt plus user prompt can run to. The question driving the project was whether the current dataset and model choices were actually sufficient: did system-prompt/user-prompt similarity meaningfully predict the on-topic/off-topic label, and did the dataset's system prompts cover a diverse enough range of chatbot types and domains to generalize well.

## Approach

The project ran in three phases. First, an exploratory data analysis measured TF-IDF cosine and Jaccard similarity between each system prompt and user prompt, and built a chatbot-type-by-domain coverage matrix from a 4,000-prompt sample drawn from 153,687 unique system prompts, to see where the existing dataset was thin. Second, the dataset was expanded based on what the EDA found. Third, six candidate architectures (three frozen embedding models, each paired with Logistic Regression and with XGBoost) were trained and evaluated on the expanded data and benchmarked against the two existing baselines.

## Technical decisions

TF-IDF cosine similarity turned out to separate on-topic from off-topic prompts more clearly than Jaccard similarity, since it weights informative terms by frequency and corpus rarity rather than just measuring raw token overlap; on-topic prompts consistently scored higher on both measures. The coverage matrix showed Developer & Data Work was the chatbot type with the weakest domain coverage in the sampled data.

Those findings shaped two decisions. The first was to build the six candidate architectures around frozen long-context embedding models (Snowflake Arctic Embed m-v2, Jina Embeddings v3, BGE-M3, each supporting up to 8,192 tokens) with a lightweight classifier on top, rather than fine-tuning an embedding model directly, since extending usable context past the existing models' 514/1,024-token ceiling was the actual goal. The second was to expand the dataset in three targeted ways rather than simply scaling it up: 50 hard positives and 50 hard negatives per unique system prompt to stress-test the decision boundary, additional system prompts for the underrepresented chatbot type x domain combinations the coverage matrix surfaced, and real production prompts for real-world validity.

## Implementation

Each embedding model was wrapped in a frozen embedder that tokenizes the system-prompt/user-prompt pair, runs a forward pass, applies CLS pooling, and L2-normalizes the result, with a small compatibility patch added so Jina's xlm-roberta implementation would run on the transformers version in use. On top of each embedding model, a Logistic Regression classifier and an XGBoost classifier (trained with early stopping) were fit separately, giving six architecture combinations in total. Every dataset (the original, the diversity-expanded set, the hard-examples set, and the production set) was split into training, validation, and test sets at an 80/10/10 ratio with stratification, models were trained on the training split, and final numbers were reported on the held-out test split.

## Testing

Every architecture, and both existing baseline models, were evaluated on the same held-out test split of each dataset using three metrics: accuracy, F1 score (to account for class imbalance), and the confusion-matrix breakdown of false positives versus false negatives, since the two error types carry different risk in a guardrail: a false negative lets an off-topic prompt through, while a false positive blocks a legitimate one.

## Results

Across four datasets and six architectures, `jinaai/jina-embeddings-v3` (frozen) + XGBoost came out on top: 98% accuracy on the diverse dataset, 92% accuracy on the hard edge-case dataset, and 85.71% accuracy (F1 0.8815, 20 false positives, 12 false negatives) on the production dataset. That production-dataset result compared favorably to both existing baselines: `govtech/jina-embeddings-v2-small-en-off-topic` scored only 60.79% accuracy with 785 false negatives on the same data, and while `govtech/stsb-roberta-base-off-topic` reached 90.15% accuracy, it did so with 217 false positives versus the new model's 20, a much higher rate of blocking legitimate prompts.

## What I learned

**TODO:** a genuine reflection — what surprised you comparing six architectures side by side, what the EDA taught you about the existing dataset's weak spots, or what you'd tackle next now that jina-embeddings-v3 + XGBoost is the leading candidate.
