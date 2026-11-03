"""Summarize an Exam 1 gradebook export into data.json for this page.

Usage: python3 aggregate.py path/to/gradebook.csv > data.json

Only aggregate counts and summary statistics are written; no student
identifiers or individual scores leave the gradebook export. Keep the
export itself out of this repository.

Scoring: a cell such as "33.25:dropped" was not kept. Each student's kept
grade is the one score not marked dropped. A version counts as taken when its
score is above 0.
"""
import csv
import json
import statistics
import sys

VERSIONS = {
    "airbnb_telco": "Exam 1 - Airbnb & Telco",
    "covid_billionaires": "Exam 1 - Covid Cases & Billionaires",
}
ACCOMMODATIONS = [
    "Accommodations ONLY Exam 1 - Alzheimers & Parental Education",
    "Accommodations ONLY Exam 1 - Energy & Credit Cards",
]
POSSIBLE = 42
BIN = 2
GAIN_BANDS = [  # (label, low inclusive, high exclusive) for second minus first
    ("10 or more lower", float("-inf"), -10),
    ("5 to 10 lower", -10, -5),
    ("0 to 5 lower", -5, 0),
    ("No change", 0, 0),
    ("0 to 5 higher", 0, 5),
    ("5 to 10 higher", 5, 10),
    ("10 or more higher", 10, float("inf")),
]


def parse(cell):
    text = (cell or "").strip()
    return float(text.split(":")[0] or 0), text.endswith(":dropped")


def quantile(sorted_xs, p):  # linear interpolation, matches R type 7 and d3
    h = (len(sorted_xs) - 1) * p
    lo = int(h)
    hi = min(lo + 1, len(sorted_xs) - 1)
    return sorted_xs[lo] + (h - lo) * (sorted_xs[hi] - sorted_xs[lo])


def summary(group, xs):
    xs = sorted(xs)
    r = lambda v: round(v, 1)
    return {
        "group": group, "n": len(xs), "mean": r(statistics.mean(xs)),
        "sd": r(statistics.stdev(xs)), "min": r(xs[0]), "q1": r(quantile(xs, .25)),
        "median": r(quantile(xs, .5)), "q3": r(quantile(xs, .75)), "max": r(xs[-1]),
    }


def bins(xs):
    edges = list(range(0, POSSIBLE + 1, BIN))
    counts = [0] * (len(edges) - 1)
    for x in xs:
        counts[min(int(x // BIN), len(counts) - 1)] += 1
    return [{"from": a, "to": b, "count": c} for a, b, c in zip(edges, edges[1:], counts)]


def gain_band(d):
    if d == 0:
        return "No change"
    for label, lo, hi in GAIN_BANDS:
        if lo <= d < hi and label != "No change":
            return label


def main(path):
    with open(path, newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    a, b, kept, pairs = [], [], [], []
    for row in rows:
        scores = {k: parse(row[c]) for k, c in VERSIONS.items()}
        others = [parse(row[c]) for c in ACCOMMODATIONS]
        undropped = [s for s, d in list(scores.values()) + others if not d]
        kept.append(max(undropped) if undropped else 0.0)
        sa, sb = scores["airbnb_telco"][0], scores["covid_billionaires"][0]
        if sa > 0:
            a.append(sa)
        if sb > 0:
            b.append(sb)
        if sa > 0 and sb > 0:
            pairs.append((sa, sb))
    gains = [sb - sa for sa, sb in pairs]
    band_counts = {label: 0 for label, _, _ in GAIN_BANDS}
    for d in gains:
        band_counts[gain_band(d)] += 1
    out = {
        "possible": POSSIBLE,
        "students": len(rows),
        "versions": {
            "airbnb_telco": {"label": "Airbnb & Telco", "n": len(a), "median": round(quantile(sorted(a), .5), 1), "bins": bins(a)},
            "covid_billionaires": {"label": "Covid & Billionaires", "n": len(b), "median": round(quantile(sorted(b), .5), 1), "bins": bins(b)},
        },
        "kept": {"n": len(kept), "median": round(quantile(sorted(kept), .5), 1),
                 "mean": round(statistics.mean(kept), 1), "zeros": sum(1 for k in kept if k == 0), "bins": bins(kept)},
        "both": {"n": len(pairs), "higher_second": sum(1 for d in gains if d > 0),
                 "median_gain": round(statistics.median(gains), 1),
                 "bands": [{"label": l, "count": band_counts[l]} for l, _, _ in GAIN_BANDS]},
        "summary": [
            summary("Airbnb & Telco: everyone", a),
            summary("Covid & Billionaires: everyone", b),
            summary("Airbnb & Telco: took both", [p[0] for p in pairs]),
            summary("Covid & Billionaires: took both", [p[1] for p in pairs]),
            summary("Kept grade: all students", kept),
            summary("Kept grade: excluding 0s", [k for k in kept if k > 0]),
        ],
    }
    json.dump(out, sys.stdout, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main(sys.argv[1])
