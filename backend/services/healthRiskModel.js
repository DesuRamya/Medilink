const URGENCY = {
  ROUTINE: "Routine",
  SOON: "Soon",
  IMMEDIATE: "Immediate",
};

const urgencyRank = {
  [URGENCY.ROUTINE]: 1,
  [URGENCY.SOON]: 2,
  [URGENCY.IMMEDIATE]: 3,
};

const FEATURES = [
  "age",
  "systolic",
  "diastolic",
  "glucose",
  "hemoglobin",
  "hasBp",
  "hasDiabetes",
  "smoker",
  "alcoholic",
  "diseaseCount",
  "diseaseCategoryCount",
];

const CONDITION_CATALOG = [
  {
    key: "hypertensiveCrisis",
    condition: "Hypertensive Crisis",
    urgency: URGENCY.IMMEDIATE,
    immediateCare: true,
    details:
      "Blood pressure is in a dangerous range and can cause stroke, heart, or kidney complications.",
  },
  {
    key: "uncontrolledHypertension",
    condition: "Uncontrolled Hypertension",
    urgency: URGENCY.SOON,
    immediateCare: false,
    details: "Persistently high blood pressure increases the chance of heart and kidney disease.",
  },
  {
    key: "stage1Hypertension",
    condition: "Stage 1 Hypertension Risk",
    urgency: URGENCY.SOON,
    immediateCare: false,
    details: "Mildly elevated blood pressure can progress if untreated.",
  },
  {
    key: "hypotensionRisk",
    condition: "Hypotension Risk",
    urgency: URGENCY.SOON,
    immediateCare: false,
    details: "Low blood pressure may cause dizziness, weakness, and fainting.",
  },
  {
    key: "severeHyperglycemia",
    condition: "Severe Hyperglycemia",
    urgency: URGENCY.IMMEDIATE,
    immediateCare: true,
    details: "Very high glucose can quickly lead to dehydration and diabetic emergencies.",
  },
  {
    key: "uncontrolledDiabetes",
    condition: "Uncontrolled Diabetes",
    urgency: URGENCY.SOON,
    immediateCare: false,
    details: "Glucose is above target and requires medication/lifestyle review.",
  },
  {
    key: "prediabetes",
    condition: "Prediabetes / Early Diabetes Progression",
    urgency: URGENCY.ROUTINE,
    immediateCare: false,
    details: "Borderline high glucose can progress to diabetes without intervention.",
  },
  {
    key: "hypoglycemiaRisk",
    condition: "Hypoglycemia Risk",
    urgency: URGENCY.IMMEDIATE,
    immediateCare: true,
    details: "Low glucose may cause confusion or loss of consciousness.",
  },
  {
    key: "severeAnemia",
    condition: "Severe Anemia",
    urgency: URGENCY.IMMEDIATE,
    immediateCare: true,
    details: "Severely low hemoglobin can reduce oxygen delivery to organs.",
  },
  {
    key: "anemia",
    condition: "Anemia",
    urgency: URGENCY.SOON,
    immediateCare: false,
    details: "Low hemoglobin may cause fatigue, breathlessness, and weakness.",
  },
  {
    key: "cardiovascularEvent",
    condition: "Cardiovascular Event Risk (Heart Attack/Stroke)",
    urgency: URGENCY.SOON,
    immediateCare: false,
    details: "Combined risk factors suggest elevated chance of future cardiovascular events.",
  },
  {
    key: "complicationRisk",
    condition: "Complication Risk from Existing Conditions",
    urgency: URGENCY.ROUTINE,
    immediateCare: false,
    details: "Existing diagnosed conditions increase the chance of follow-up complications.",
  },
];

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseBloodPressure = (bp) => {
  if (!bp || typeof bp !== "string") return null;
  const match = bp.trim().match(/^(\d{2,3})\s*\/\s*(\d{2,3})$/);
  if (!match) return null;
  const systolic = Number(match[1]);
  const diastolic = Number(match[2]);
  if (!Number.isFinite(systolic) || !Number.isFinite(diastolic)) return null;
  return { systolic, diastolic };
};

const flattenDiseases = (diseases) => {
  if (!diseases || typeof diseases !== "object") return [];
  return Object.entries(diseases).flatMap(([category, items]) => {
    if (!Array.isArray(items) || items.length === 0) return [category];
    return items.map((item) => `${category}: ${item}`);
  });
};

const prettyLabel = (text) => String(text || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const normalizeProbability = (p) => Number((Math.max(0.03, Math.min(0.97, p)) * 100).toFixed(1));

const seededRng = (seed = 42) => {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
};

const randNormal = (rng, mean = 0, sd = 1) => {
  const u1 = Math.max(rng(), 1e-9);
  const u2 = Math.max(rng(), 1e-9);
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * sd;
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const hasYes = (value) => String(value || "").toLowerCase() === "yes";

const patientToFeatures = (patient = {}) => {
  const age = toNumber(patient.age);
  const glucose = toNumber(patient.diabetic);
  const hemoglobin = toNumber(patient.hemoglobin);
  const bp = parseBloodPressure(patient.bp);
  const diseaseEntries = flattenDiseases(patient.diseases);
  const diseaseCategoryCount = Object.keys(patient.diseases || {}).filter(
    (key) => Array.isArray(patient.diseases[key]) && patient.diseases[key].length > 0
  ).length;

  return {
    age,
    systolic: bp?.systolic ?? null,
    diastolic: bp?.diastolic ?? null,
    glucose,
    hemoglobin,
    hasBp: hasYes(patient.hasBp) ? 1 : 0,
    hasDiabetes: hasYes(patient.hasDiabetics) ? 1 : 0,
    smoker: hasYes(patient.smoker) ? 1 : 0,
    alcoholic: hasYes(patient.alcoholic) ? 1 : 0,
    diseaseCount: diseaseEntries.length,
    diseaseCategoryCount,
  };
};

const createLabels = (f) => ({
  hypertensiveCrisis: f.systolic >= 180 || f.diastolic >= 120,
  uncontrolledHypertension: (f.systolic >= 140 || f.diastolic >= 90) && !(f.systolic >= 180 || f.diastolic >= 120),
  stage1Hypertension:
    (f.systolic >= 130 || f.diastolic >= 80) && !(f.systolic >= 140 || f.diastolic >= 90) && !(f.systolic >= 180 || f.diastolic >= 120),
  hypotensionRisk: f.systolic < 90 || f.diastolic < 60,
  severeHyperglycemia: f.glucose >= 300,
  uncontrolledDiabetes: f.glucose >= 200 && f.glucose < 300,
  prediabetes: f.glucose >= 140 && f.glucose < 200,
  hypoglycemiaRisk: f.glucose > 0 && f.glucose < 70,
  severeAnemia: f.hemoglobin > 0 && f.hemoglobin < 8,
  anemia: f.hemoglobin >= 8 && f.hemoglobin < 12,
  cardiovascularEvent:
    f.age >= 45 && ((f.systolic >= 140 || f.diastolic >= 90) || f.glucose >= 140 || f.smoker === 1 || f.alcoholic === 1),
  complicationRisk: f.diseaseCount >= 2 || f.diseaseCategoryCount >= 2,
});

const generateTrainingSamples = () => {
  const rng = seededRng(20260307);
  const samples = [];

  const prototypes = [
    { age: 62, systolic: 188, diastolic: 122, glucose: 320, hemoglobin: 9.5, hasBp: 1, hasDiabetes: 1, smoker: 1, alcoholic: 1, diseaseCount: 6, diseaseCategoryCount: 4 },
    { age: 55, systolic: 165, diastolic: 102, glucose: 240, hemoglobin: 11.2, hasBp: 1, hasDiabetes: 1, smoker: 0, alcoholic: 0, diseaseCount: 4, diseaseCategoryCount: 2 },
    { age: 47, systolic: 146, diastolic: 92, glucose: 165, hemoglobin: 12.8, hasBp: 1, hasDiabetes: 1, smoker: 1, alcoholic: 0, diseaseCount: 2, diseaseCategoryCount: 2 },
    { age: 36, systolic: 132, diastolic: 84, glucose: 130, hemoglobin: 13.5, hasBp: 1, hasDiabetes: 0, smoker: 0, alcoholic: 0, diseaseCount: 1, diseaseCategoryCount: 1 },
    { age: 28, systolic: 118, diastolic: 76, glucose: 96, hemoglobin: 14.4, hasBp: 0, hasDiabetes: 0, smoker: 0, alcoholic: 0, diseaseCount: 0, diseaseCategoryCount: 0 },
    { age: 41, systolic: 102, diastolic: 64, glucose: 84, hemoglobin: 7.4, hasBp: 0, hasDiabetes: 0, smoker: 0, alcoholic: 0, diseaseCount: 1, diseaseCategoryCount: 1 },
    { age: 52, systolic: 126, diastolic: 79, glucose: 62, hemoglobin: 12.6, hasBp: 0, hasDiabetes: 1, smoker: 0, alcoholic: 0, diseaseCount: 1, diseaseCategoryCount: 1 },
    { age: 67, systolic: 138, diastolic: 88, glucose: 188, hemoglobin: 11.7, hasBp: 1, hasDiabetes: 1, smoker: 1, alcoholic: 0, diseaseCount: 5, diseaseCategoryCount: 3 },
  ];

  prototypes.forEach((p) => {
    for (let i = 0; i < 70; i += 1) {
      const f = {
        age: clamp(Math.round(randNormal(rng, p.age, 8)), 12, 90),
        systolic: clamp(Math.round(randNormal(rng, p.systolic, 14)), 75, 230),
        diastolic: clamp(Math.round(randNormal(rng, p.diastolic, 10)), 45, 140),
        glucose: clamp(Math.round(randNormal(rng, p.glucose, 40)), 45, 450),
        hemoglobin: clamp(Number(randNormal(rng, p.hemoglobin, 1.3).toFixed(1)), 5.2, 18.5),
        hasBp: p.hasBp,
        hasDiabetes: p.hasDiabetes,
        smoker: rng() < 0.18 ? 1 - p.smoker : p.smoker,
        alcoholic: rng() < 0.15 ? 1 - p.alcoholic : p.alcoholic,
        diseaseCount: clamp(Math.round(randNormal(rng, p.diseaseCount, 1.6)), 0, 12),
        diseaseCategoryCount: clamp(Math.round(randNormal(rng, p.diseaseCategoryCount, 1.0)), 0, 7),
      };

      const labels = createLabels(f);
      samples.push({ features: f, labels });
    }
  });

  return samples;
};

const gaussianLogPdf = (x, mean, variance) => {
  const v = Math.max(variance, 1e-6);
  return -0.5 * Math.log(2 * Math.PI * v) - ((x - mean) ** 2) / (2 * v);
};

const trainBinaryGaussianNB = (samples, targetKey) => {
  const classBuckets = { 0: [], 1: [] };

  samples.forEach((sample) => {
    const cls = sample.labels[targetKey] ? 1 : 0;
    classBuckets[cls].push(sample.features);
  });

  const total = samples.length;
  const priors = {
    0: (classBuckets[0].length + 1) / (total + 2),
    1: (classBuckets[1].length + 1) / (total + 2),
  };

  const stats = { 0: {}, 1: {} };
  [0, 1].forEach((cls) => {
    FEATURES.forEach((feature) => {
      const values = classBuckets[cls].map((row) => row[feature]);
      const mean = values.reduce((sum, v) => sum + v, 0) / Math.max(values.length, 1);
      const variance =
        values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / Math.max(values.length, 1);
      stats[cls][feature] = { mean, variance: Math.max(variance, 1e-3) };
    });
  });

  return { priors, stats, targetKey };
};

const predictBinaryProbability = (model, featureVector) => {
  const scores = { 0: Math.log(model.priors[0]), 1: Math.log(model.priors[1]) };

  [0, 1].forEach((cls) => {
    FEATURES.forEach((feature) => {
      const value = featureVector[feature];
      const stat = model.stats[cls][feature];
      scores[cls] += gaussianLogPdf(value, stat.mean, stat.variance);
    });
  });

  const maxLog = Math.max(scores[0], scores[1]);
  const exp0 = Math.exp(scores[0] - maxLog);
  const exp1 = Math.exp(scores[1] - maxLog);
  return exp1 / (exp0 + exp1);
};

const TRAINING_SAMPLES = generateTrainingSamples();
const CONDITION_MODELS = CONDITION_CATALOG.reduce((acc, entry) => {
  acc[entry.key] = trainBinaryGaussianNB(TRAINING_SAMPLES, entry.key);
  return acc;
}, {});

const globalFeatureMeans = FEATURES.reduce((acc, feature) => {
  acc[feature] =
    TRAINING_SAMPLES.reduce((sum, sample) => sum + sample.features[feature], 0) /
    TRAINING_SAMPLES.length;
  return acc;
}, {});

const enrichReasons = (patient, conditionKey) => {
  const reasons = [];
  const bp = parseBloodPressure(patient.bp);
  const glucose = toNumber(patient.diabetic);
  const hb = toNumber(patient.hemoglobin);
  const age = toNumber(patient.age);

  if ((conditionKey === "hypertensiveCrisis" || conditionKey === "uncontrolledHypertension" || conditionKey === "stage1Hypertension") && bp) {
    reasons.push(`BP reading: ${bp.systolic}/${bp.diastolic}`);
  }

  if ((conditionKey === "severeHyperglycemia" || conditionKey === "uncontrolledDiabetes" || conditionKey === "prediabetes" || conditionKey === "hypoglycemiaRisk") && glucose !== null) {
    reasons.push(`Diabetic reading: ${glucose} mg/dL`);
  }

  if ((conditionKey === "severeAnemia" || conditionKey === "anemia") && hb !== null) {
    reasons.push(`Hemoglobin: ${hb} g/dL`);
  }

  if (conditionKey === "cardiovascularEvent" && age !== null) {
    reasons.push(`Age: ${age}`);
    if (hasYes(patient.smoker)) reasons.push("Smoking: Yes");
    if (hasYes(patient.alcoholic)) reasons.push("Alcoholic: Yes");
  }

  if (conditionKey === "complicationRisk") {
    const groups = Object.entries(patient.diseases || {})
      .filter(([, list]) => Array.isArray(list) && list.length > 0)
      .map(([category, list]) => `${prettyLabel(category)}: ${list.join(", ")}`);

    if (groups.length > 0) {
      return groups;
    }
  }

  return reasons.length > 0 ? reasons : ["Pattern matched from trained model features."];
};

const deriveRuleHints = (features) => {
  const hints = [];

  if (features.systolic !== null && features.diastolic !== null) {
    if (features.systolic >= 180 || features.diastolic >= 120) {
      hints.push({ key: "hypertensiveCrisis", minProbability: 0.86 });
    } else if (features.systolic >= 140 || features.diastolic >= 90) {
      hints.push({ key: "uncontrolledHypertension", minProbability: 0.74 });
    } else if (features.systolic >= 130 || features.diastolic >= 80) {
      hints.push({ key: "stage1Hypertension", minProbability: 0.6 });
    } else if (features.systolic < 90 || features.diastolic < 60) {
      hints.push({ key: "hypotensionRisk", minProbability: 0.66 });
    }
  }

  if (features.glucose !== null) {
    if (features.glucose >= 300) {
      hints.push({ key: "severeHyperglycemia", minProbability: 0.85 });
    } else if (features.glucose >= 200) {
      hints.push({ key: "uncontrolledDiabetes", minProbability: 0.72 });
    } else if (features.glucose >= 140) {
      hints.push({ key: "prediabetes", minProbability: 0.56 });
    } else if (features.glucose < 70) {
      hints.push({ key: "hypoglycemiaRisk", minProbability: 0.84 });
    }
  }

  if (features.hemoglobin !== null) {
    if (features.hemoglobin < 8) {
      hints.push({ key: "severeAnemia", minProbability: 0.82 });
    } else if (features.hemoglobin < 12) {
      hints.push({ key: "anemia", minProbability: 0.62 });
    }
  }

  if (features.diseaseCount >= 1) {
    hints.push({ key: "complicationRisk", minProbability: 0.55 });
  }

  return hints;
};

const buildUsedInputs = (patient) => {
  const bp = parseBloodPressure(patient.bp);
  const diabetic = toNumber(patient.diabetic);
  const hemoglobin = toNumber(patient.hemoglobin);
  const age = toNumber(patient.age);

  return {
    age: age ?? "Not provided",
    bp: bp ? `${bp.systolic}/${bp.diastolic}` : patient.bp || "Not provided",
    hasBp: hasYes(patient.hasBp) ? "Yes" : "No",
    diabetic: diabetic ?? (patient.diabetic || "Not provided"),
    hasDiabetics: hasYes(patient.hasDiabetics) ? "Yes" : "No",
    hemoglobin: hemoglobin ?? (patient.hemoglobin || "Not provided"),
  };
};

const fallbackRulePrediction = (patient = {}) => {
  const features = patientToFeatures(patient);
  const diseaseEntries = flattenDiseases(patient.diseases);
  const predictions = [];

  if (features.systolic >= 180 || features.diastolic >= 120) {
    predictions.push({
      condition: "Hypertensive Crisis",
      riskPercentage: 94,
      urgency: URGENCY.IMMEDIATE,
      details:
        "Blood pressure is in a dangerous range and can cause stroke, heart, or kidney complications.",
      immediateCare: true,
      reasons: [`BP reading: ${features.systolic}/${features.diastolic}`],
    });
  }

  if (features.glucose >= 300) {
    predictions.push({
      condition: "Severe Hyperglycemia",
      riskPercentage: 91,
      urgency: URGENCY.IMMEDIATE,
      details: "Very high glucose can quickly lead to dehydration and diabetic emergencies.",
      immediateCare: true,
      reasons: [`Diabetic reading: ${features.glucose} mg/dL`],
    });
  }

  if (features.hemoglobin !== null && features.hemoglobin < 8) {
    predictions.push({
      condition: "Severe Anemia",
      riskPercentage: 89,
      urgency: URGENCY.IMMEDIATE,
      details: "Severely low hemoglobin can reduce oxygen delivery to organs.",
      immediateCare: true,
      reasons: [`Hemoglobin: ${features.hemoglobin} g/dL`],
    });
  }

  if (diseaseEntries.length > 0) {
    predictions.push({
      condition: "Complication Risk from Existing Conditions",
      riskPercentage: 72,
      urgency: URGENCY.SOON,
      details: "Existing diagnosed conditions increase the chance of follow-up complications.",
      immediateCare: false,
      reasons: [
        `Existing disease entries: ${diseaseEntries.slice(0, 6).join(", ")}${
          diseaseEntries.length > 6 ? " ..." : ""
        }`,
      ],
    });
  }

  if (predictions.length === 0) {
    predictions.push({
      condition: "No High-Risk Pattern Detected",
      riskPercentage: 18,
      urgency: URGENCY.ROUTINE,
      details: "Current inputs do not indicate an immediate high-risk disease pattern.",
      immediateCare: false,
      reasons: ["Continue regular screening and clinician follow-up."],
    });
  }

  predictions.sort((a, b) => {
    if (urgencyRank[b.urgency] !== urgencyRank[a.urgency]) {
      return urgencyRank[b.urgency] - urgencyRank[a.urgency];
    }
    return b.riskPercentage - a.riskPercentage;
  });

  const overallUrgency = predictions[0]?.urgency || URGENCY.ROUTINE;
  const needsImmediateMedicalAppointment = predictions.some((p) => p.immediateCare);

  return {
    generatedAt: new Date().toISOString(),
    modelType: "Rule-based fallback",
    trainingInfo: {
      strategy: "Deterministic emergency rules",
    },
    inputsUsed: buildUsedInputs(patient),
    needsImmediateMedicalAppointment,
    overallUrgency,
    recommendation: needsImmediateMedicalAppointment
      ? "Seek immediate medical care now."
      : overallUrgency === URGENCY.SOON
        ? "Book a medical appointment within 24-72 hours."
        : "Book a routine doctor appointment and continue monitoring.",
    predictions,
    disclaimer:
      "This is a screening estimate, not a medical diagnosis. A licensed clinician should confirm and manage treatment.",
  };
};

export const predictHealthRisk = (patient = {}) => {
  try {
    const features = patientToFeatures(patient);
    const nonNullCount = [features.age, features.systolic, features.diastolic, features.glucose, features.hemoglobin].filter(
      (v) => v !== null
    ).length;

    if (nonNullCount < 2 && features.diseaseCount === 0) {
      return fallbackRulePrediction(patient);
    }

    const modelInput = {};
    FEATURES.forEach((feature) => {
      const value = features[feature];
      modelInput[feature] = value === null || value === undefined ? globalFeatureMeans[feature] : value;
    });

    const rawPredictions = CONDITION_CATALOG.map((catalogEntry) => {
      const probability = predictBinaryProbability(CONDITION_MODELS[catalogEntry.key], modelInput);
      return {
        catalogEntry,
        probability,
      };
    });

    const ruleHints = deriveRuleHints(features);
    ruleHints.forEach((hint) => {
      const target = rawPredictions.find((entry) => entry.catalogEntry.key === hint.key);
      if (target) {
        target.probability = Math.max(target.probability, hint.minProbability);
      }
    });

    const selected = rawPredictions
      .filter((entry) => entry.probability >= 0.33)
      .sort((a, b) => {
        if (urgencyRank[b.catalogEntry.urgency] !== urgencyRank[a.catalogEntry.urgency]) {
          return urgencyRank[b.catalogEntry.urgency] - urgencyRank[a.catalogEntry.urgency];
        }
        return b.probability - a.probability;
      });

    const finalPredictions = (selected.length > 0 ? selected : rawPredictions.sort((a, b) => b.probability - a.probability).slice(0, 1)).map(
      ({ catalogEntry, probability }) => ({
        condition: catalogEntry.condition,
        riskPercentage: normalizeProbability(probability),
        urgency: catalogEntry.urgency,
        details: catalogEntry.details,
        immediateCare: catalogEntry.immediateCare,
        reasons: enrichReasons(patient, catalogEntry.key),
      })
    );

    finalPredictions.sort((a, b) => {
      if (urgencyRank[b.urgency] !== urgencyRank[a.urgency]) {
        return urgencyRank[b.urgency] - urgencyRank[a.urgency];
      }
      return b.riskPercentage - a.riskPercentage;
    });

    const overallUrgency = finalPredictions[0]?.urgency || URGENCY.ROUTINE;
    const needsImmediateMedicalAppointment = finalPredictions.some((p) => p.immediateCare);

    return {
      generatedAt: new Date().toISOString(),
      modelType: "ML model (Gaussian Naive Bayes, multi-label)",
      trainingInfo: {
        trainedAt: "2026-03-07",
        trainingSamples: TRAINING_SAMPLES.length,
        features: FEATURES,
      },
      inputsUsed: buildUsedInputs(patient),
      needsImmediateMedicalAppointment,
      overallUrgency,
      recommendation: needsImmediateMedicalAppointment
        ? "Seek immediate medical care now. Do not wait for a routine appointment if symptoms are present."
        : overallUrgency === URGENCY.SOON
          ? "Book a medical appointment within 24-72 hours for clinical evaluation."
          : "Book a routine doctor appointment and keep monitoring health values.",
      predictions: finalPredictions,
      disclaimer:
        "This is an ML-assisted screening estimate, not a medical diagnosis. A licensed clinician should confirm and manage treatment.",
    };
  } catch (error) {
    return fallbackRulePrediction(patient);
  }
};
