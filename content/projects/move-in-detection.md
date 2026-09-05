---
title: "Residential Move-in Detection using Utilities Consumption Data & Machine Learning"
slug: move-in-detection
summary: "A predictive machine learning model that distinguishes legitimate residential move-ins from faulty electricity meters, to cut unnecessary technician site visits for SP Group's metering-to-billing operations."
technologies:
  - name: "Python & Jupyter Notebook"
    why: "Used for the whole workflow: data processing, feature engineering, and model training/evaluation."
  - name: "Pandas & NumPy"
    why: "Merged and transformed the notification, account, and billing datasets, and engineered features like consumption ratios from them."
  - name: "Scikit-Learn"
    why: "Trained the Logistic Regression baseline, ran cross-validation for hyperparameter tuning, and evaluated both models with predict() and confusion_matrix()."
  - name: "XGBoost"
    why: "The stronger of the two models tried; chosen as the final model after it clearly out-predicted Logistic Regression on non-move-in (potential fault) cases."
decisions:
  - decision: "Framed the problem as a supervised classification task and trained a predictive model to tell a legitimate move-in apart from a faulty meter, instead of continuing to rely on the existing static rule-based flagging system."
    rejectedAlternative: "Keeping the existing rules-based system as-is. It had been in place for years but had no way to distinguish a move-in-driven consumption spike from an actual faulty meter, which was exactly the gap this project closed."
  - decision: "Chose XGBoost over Logistic Regression as the final model. After tuning Logistic Regression's decision boundary so both models caught move-in cases equally well (51 of 58, about 88%), XGBoost still predicted non-move-in cases far more accurately: 95% (246 of 260) versus Logistic Regression's 71% (185 of 260)."
    rejectedAlternative: "Logistic Regression as the final model. It matched XGBoost on move-in detection once tuned, but its much higher false-positive rate on non-move-in cases mattered here: correctly flagging a genuinely faulty meter, rather than waving it through as a move-in, is what limits the company's losses from undetected meter tampering."
result: "The chosen XGBoost model correctly identified 95% of non-move-in cases (246 of 260) while matching Logistic Regression's ~88% accuracy on move-in cases (51 of 58) after tuning. In practice, that means the model can rule out a move-in-driven consumption spike with high confidence, letting the operations team skip the technician site visit for most of the cases the old rules system used to flag unnecessarily, while still catching cases that need investigation."
learned: "Three specific mistakes taught me more than getting things right the first time would have. I initially pulled the wrong six-month consumption window for each notification (the month it was triggered, instead of the month before), which silently skewed the training data — a reminder to be more analytical about exactly what a date offset means before using it. I also engineered a feature using both actual and estimated consumption readings, and for some notifications the estimated values masked any real rise in usage, which limited that feature's usefulness before I even got to modelling. And I originally evaluated both models without refitting each one's cross-validated hyperparameters on the full training set, which would have made the model comparison unfair. Catching that changed how I think about cross-validation: it's not just for picking a hyperparameter, it's a step you have to close the loop on before you trust any evaluation number."
order: 2
---

At SP Group, part of a bigger initiative to use AI to improve the efficiency of metering-to-billing operations, I built a predictive machine learning model to detect new residential move-in events from utility consumption data.

## Problem

Electricity meter readings are sent back to SP's system roughly every two months. Each reading is checked against a system of rules, and if a reading looks unusually high, it's flagged as a possible faulty meter, triggering a technician to visit the premises for an on-site investigation. But a high reading is often just as likely to be entirely legitimate: someone new has moved in, and their usage pattern simply differs from the previous occupant's. The rules system, built years earlier, had no way to tell these two cases apart. Every move-in-driven spike triggered the same costly site visit as a genuine fault, wasting manpower and time on trips that never needed to happen.

## Approach

I built a predictive machine learning model specifically to detect new move-in events, designed to slot into the existing daily operational flow of the meter-irregularity investigation process rather than replace it outright. When a reading is flagged as unusually high, the model gives the operations team a signal on whether the spike looks like a move-in rather than a fault, before a technician is ever dispatched. The work ran through five phases: data collection and processing, feature engineering, model training, model evaluation, and model comparison.

## Technical decisions

The core decision was to close the exact gap the rules system couldn't: rather than adding more static thresholds, I framed this as a supervised classification problem and trained a model on historical consumption data to make the move-in-vs-fault distinction directly.

The second was which model to ship. I trained both a Logistic Regression model and an XGBoost model, then tuned Logistic Regression's decision boundary so it caught move-in cases as accurately as XGBoost (51 of 58 actual move-in cases, about 88%, for both). That let me compare them fairly on the case that mattered more: correctly identifying non-move-in (potentially faulty) meters, since catching a genuine fault protects the company from losses due to tampered or broken meters. XGBoost won clearly there, at 95% (246 of 260) versus Logistic Regression's 71% (185 of 260), so XGBoost became the final model.

## Implementation

Data collection started with SP's notification, account, and billing data. I merged the download and upload notification datasets, extracted the notifications triggered by high consumption, joined that with account and billing information, and labelled each high-consumption notification as move-in-triggered or not, keeping only notifications from domestic accounts triggered by a rise in electricity usage.

From that processed data, I engineered two main features: the number of notifications triggered for the same postcode within the past 10, 20, and 30 days (a cluster of notifications in one postcode suggests a newly built or newly occupied block, and so a higher chance of move-ins), and the ratio of electricity usage for the month closest to each notification, which captures whether electricity, water, and gas usage are rising together in a pattern typical of a new occupant. I filtered the dataset down to notifications with labels plus consumption for the month before the notification date, replaced NaN and infinity values (Scikit-Learn's Logistic Regression can't take them), and split the data into training and test sets before training both models with cross-validation to tune their hyperparameters.

## Testing

I evaluated both trained models by calling Scikit-Learn's `predict()` on the held-out test set and plotting each model's confusion matrix with `confusion_matrix()`, comparing predicted labels against actual outcomes rather than relying on a single aggregate accuracy score.

## Results

The chosen XGBoost model correctly identified 95% of non-move-in cases (246 of 260), against Logistic Regression's 71% (185 of 260) on the same test set, once both models were tuned to catch move-in cases equally well (51 of 58, about 88%). In practice, that means the model can rule out a move-in-driven consumption spike with high confidence for most of the cases the old rules system used to flag unnecessarily, while still surfacing the readings that genuinely need a technician.

## What I learned

Three mistakes taught me more than getting things right the first time would have. I initially pulled the wrong six-month consumption window for each notification (the month it was triggered, instead of the month before), which silently skewed the training data — a reminder to be more analytical about exactly what a date offset means before using it downstream. I also engineered a feature using both actual and estimated consumption readings, and for some notifications the estimated values masked any real rise in usage, which limited that feature's usefulness before I even got to modelling. And I originally evaluated both models without refitting each one's cross-validated hyperparameters on the full training set, which would have made the model comparison unfair; catching that changed how I think about cross-validation, since it's not just for picking a hyperparameter, it's a step you have to close the loop on before trusting any evaluation number.
