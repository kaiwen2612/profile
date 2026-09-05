---
title: "Residential Move-in Detection using Utilities Consumption Data & Machine Learning"
slug: move-in-detection
summary: "A predictive machine learning model that distinguishes legitimate residential move-ins from faulty electricity meters, to cut unnecessary technician site visits for SP Group's metering-to-billing operations."
technologies:
  - name: "TODO: name the specific ML technique/library used (e.g. scikit-learn, XGBoost, logistic regression)"
    why: "TODO: why that approach fit a move-in-vs-fault classification problem"
decisions:
  - decision: "Framed the problem as a supervised classification task and trained a predictive model to tell a legitimate move-in apart from a faulty meter, instead of continuing to rely on the existing static rule-based flagging system."
    rejectedAlternative: "Keeping the existing rules-based system as-is. It had been in place for years but had no way to distinguish a move-in-driven consumption spike from an actual faulty meter, which was exactly the gap this project closed."
  - decision: "TODO: a second real decision — e.g. which features you used, how you handled the class imbalance between rare move-in events and the much larger volume of normal readings, or how the model's output was surfaced to the operations team."
    rejectedAlternative: "TODO: what you considered instead and why you didn't go that route."
result: "The model's job was to catch the specific gap the old rules system missed: telling a legitimate move-in apart from a genuine faulty meter, so the operations team could rule out move-ins before dispatching a technician, cutting the false positives (and wasted site visits) the old system generated. TODO: add a real number if you have one — model accuracy, the false-positive reduction, or site visits avoided."
learned: "TODO: a genuine reflection — what surprised you about this project, or what you'd do differently."
order: 2
---

At SP Group, part of a bigger initiative to use AI to improve the efficiency of metering-to-billing operations, I built a predictive machine learning model to detect new residential move-in events from utility consumption data.

## Problem

Electricity meter readings are sent back to SP's system roughly every two months. Each reading is checked against a system of rules, and if a reading looks unusually high, it's flagged as a possible faulty meter, triggering a technician to visit the premises for an on-site investigation. But a high reading is often just as likely to be entirely legitimate: someone new has moved in, and their usage pattern simply differs from the previous occupant's. The rules system, built years earlier, had no way to tell these two cases apart. Every move-in-driven spike triggered the same costly site visit as a genuine fault, wasting manpower and time on trips that never needed to happen.

## Approach

I built a predictive machine learning model specifically to detect new move-in events, designed to slot into the existing daily operational flow of the meter-irregularity investigation process rather than replace it outright. When a reading is flagged as unusually high, the model gives the operations team a signal on whether the spike looks like a move-in rather than a fault, before a technician is ever dispatched.

## Technical decisions

The core decision was to close the exact gap the rules system couldn't: rather than adding more static thresholds, I framed this as a supervised classification problem and trained a model on historical consumption data to make the move-in-vs-fault distinction directly. **TODO:** describe a second real decision here — for example, which features the model used, how the class imbalance between rare move-in events and the much larger volume of normal readings was handled, or how you decided to surface the model's output to the investigation team.

## Implementation

**TODO:** describe how the model was actually built and integrated — where in the meter-irregularity investigation pipeline it ran, what output it gave the operations team, and any data engineering needed to get consumption history into a usable shape for training.

## Testing

**TODO:** how the model was validated — a held-out test set, a comparison against the existing rules system's false-positive rate, or feedback from the operations team once it was in use.

## Results

The model's purpose was to catch precisely the case the old rules system missed: telling a legitimate move-in apart from an actual faulty meter, so the operations team could rule out move-ins before a technician was ever sent out, cutting the false positives, and the wasted site visits, the old system generated.

**TODO:** add a real number here if you have one — model accuracy, the reduction in false-positive site visits, or how many technician trips were avoided.

## What I learned

**TODO:** a genuine reflection — what surprised you working on this, or what you'd do differently if you built it again.
