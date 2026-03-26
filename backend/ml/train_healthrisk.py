#!/usr/bin/env python3
"""
Train a multi-label logistic regression model for health risk prediction.
Pure-stdlib implementation: no numpy/sklearn required.
"""
from __future__ import annotations

import argparse
import csv
import json
import math
import os
import random
from datetime import datetime, timezone
from typing import Dict, List, Tuple


def sigmoid(x: float) -> float:
    if x >= 0:
        z = math.exp(-x)
        return 1.0 / (1.0 + z)
    z = math.exp(x)
    return z / (1.0 + z)


def load_csv(path: str) -> Tuple[List[str], List[str], List[List[float]], Dict[str, List[int]]]:
    with open(path, "r", encoding="utf-8") as f:
        rows = list(csv.reader(f))
    if not rows:
        raise RuntimeError("Empty CSV")

    header = [h.strip() for h in rows[0]]
    label_prefix = "label_"
    feature_keys = [h for h in header if not h.startswith(label_prefix)]
    label_keys = [h[len(label_prefix) :] for h in header if h.startswith(label_prefix)]

    X: List[List[float]] = []
    y: Dict[str, List[int]] = {k: [] for k in label_keys}

    for row in rows[1:]:
        if not row:
            continue
        row = [c.strip() for c in row]
        features = []
        for idx, key in enumerate(feature_keys):
            value = row[idx] if idx < len(row) else ""
            if value == "":
                features.append(float("nan"))
            else:
                try:
                    features.append(float(value))
                except ValueError:
                    features.append(float("nan"))
        X.append(features)

        for i, key in enumerate(label_keys):
            col_idx = len(feature_keys) + i
            value = row[col_idx] if col_idx < len(row) else "0"
            y[key].append(1 if str(value).strip() == "1" else 0)

    return feature_keys, label_keys, X, y


def compute_means_stds(X: List[List[float]]) -> Tuple[List[float], List[float]]:
    n = len(X)
    d = len(X[0]) if n else 0
    means = [0.0] * d
    counts = [0] * d
    for row in X:
        for j, v in enumerate(row):
            if not math.isnan(v):
                means[j] += v
                counts[j] += 1
    for j in range(d):
        means[j] = means[j] / counts[j] if counts[j] else 0.0

    stds = [0.0] * d
    for row in X:
        for j, v in enumerate(row):
            val = means[j] if math.isnan(v) else v
            stds[j] += (val - means[j]) ** 2
    for j in range(d):
        stds[j] = math.sqrt(stds[j] / max(n, 1))
        if stds[j] < 1e-6:
            stds[j] = 1.0
    return means, stds


def standardize(X: List[List[float]], means: List[float], stds: List[float]) -> List[List[float]]:
    Xs: List[List[float]] = []
    for row in X:
        out = []
        for j, v in enumerate(row):
            val = means[j] if math.isnan(v) else v
            out.append((val - means[j]) / stds[j])
        Xs.append(out)
    return Xs


def train_logistic(
    X: List[List[float]],
    y: List[int],
    epochs: int = 400,
    lr: float = 0.15,
    reg: float = 0.01,
    seed: int = 20260307,
) -> Tuple[List[float], float]:
    random.seed(seed)
    n = len(X)
    d = len(X[0]) if n else 0

    pos = sum(y)
    neg = n - pos
    bias = math.log((pos + 1e-6) / (neg + 1e-6))
    weights = [0.0] * d

    for epoch in range(epochs):
        grad_w = [0.0] * d
        grad_b = 0.0

        for i in range(n):
            z = bias
            row = X[i]
            for j in range(d):
                z += weights[j] * row[j]
            p = sigmoid(z)
            err = p - y[i]
            for j in range(d):
                grad_w[j] += err * row[j]
            grad_b += err

        inv_n = 1.0 / max(n, 1)
        for j in range(d):
            grad = grad_w[j] * inv_n + reg * weights[j]
            weights[j] -= lr * grad
        bias -= lr * grad_b * inv_n

        if epoch in (int(epochs * 0.6), int(epochs * 0.8)):
            lr *= 0.6

    return weights, bias


def f1_score(y_true: List[int], y_pred: List[int]) -> float:
    tp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 1 and yp == 1)
    fp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 0 and yp == 1)
    fn = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 1 and yp == 0)
    denom = (2 * tp + fp + fn)
    return (2 * tp / denom) if denom else 0.0


def best_threshold(y_true: List[int], probs: List[float]) -> Tuple[float, float]:
    best_t = 0.5
    best_f1 = -1.0
    for t in [i / 100 for i in range(5, 96)]:
        preds = [1 if p >= t else 0 for p in probs]
        f1 = f1_score(y_true, preds)
        if f1 > best_f1:
            best_f1 = f1
            best_t = t
    return best_t, best_f1


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", default=os.path.join("backend", "data", "training-samples.csv"))
    parser.add_argument("--out", default=os.path.join("backend", "models", "healthrisk-model.json"))
    parser.add_argument("--epochs", type=int, default=400)
    parser.add_argument("--lr", type=float, default=0.15)
    parser.add_argument("--reg", type=float, default=0.01)
    args = parser.parse_args()

    feature_keys, label_keys, X, y = load_csv(args.csv)
    means, stds = compute_means_stds(X)
    Xs = standardize(X, means, stds)

    models = {}
    metrics = {}
    for label in label_keys:
        weights, bias = train_logistic(
            Xs, y[label], epochs=args.epochs, lr=args.lr, reg=args.reg
        )
        probs = []
        for row in Xs:
            z = bias
            for j in range(len(weights)):
                z += weights[j] * row[j]
            probs.append(sigmoid(z))
        threshold, f1 = best_threshold(y[label], probs)
        models[label] = {
            "weights": [round(w, 8) for w in weights],
            "bias": round(bias, 8),
            "threshold": round(threshold, 4),
        }
        metrics[label] = {
            "positiveRate": round(sum(y[label]) / max(len(y[label]), 1), 4),
            "f1": round(f1, 4),
        }

    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "features": feature_keys,
        "labels": label_keys,
        "standardization": {
            "means": {k: round(means[i], 6) for i, k in enumerate(feature_keys)},
            "stds": {k: round(stds[i], 6) for i, k in enumerate(feature_keys)},
        },
        "models": models,
        "metrics": metrics,
        "training": {
            "epochs": args.epochs,
            "lr": args.lr,
            "reg": args.reg,
            "samples": len(X),
        },
    }

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    print(f"Saved model to {args.out}")


if __name__ == "__main__":
    main()
