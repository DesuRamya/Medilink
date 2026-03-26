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
    if (!Array.isArray(items) || items.length === 0) return [];
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

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_PATH = path.join(__dirname, "..", "models", "healthrisk-model.json");
let cachedModel = null;
let modelLoadError = null;

const loadTrainedModel = () => {
  if (cachedModel || modelLoadError) return cachedModel;
  try {
    if (!fs.existsSync(MODEL_PATH)) {
      modelLoadError = new Error(`HealthRiskModel: Missing model file at ${MODEL_PATH}`);
      return null;
    }
    const raw = fs.readFileSync(MODEL_PATH, "utf8");
    cachedModel = JSON.parse(raw);
    return cachedModel;
  } catch (err) {
    modelLoadError = err;
    return null;
  }
};

const sigmoid = (value) => {
  if (value >= 0) {
    const z = Math.exp(-value);
    return 1 / (1 + z);
  }
  const z = Math.exp(value);
  return z / (1 + z);
};

const buildModelVector = (features, model) => {
  const means = model?.standardization?.means || {};
  const stds = model?.standardization?.stds || {};
  return (model?.features || FEATURES).map((feature) => {
    const mean = means[feature] ?? 0;
    const std = stds[feature] ?? 1;
    const value = features[feature];
    const actual = value === null || value === undefined ? mean : value;
    return (actual - mean) / (std || 1);
  });
};

const scoreLabel = (model, labelKey, vector) => {
  const labelModel = model?.models?.[labelKey];
  if (!labelModel) return null;
  const weights = labelModel.weights || [];
  let score = labelModel.bias || 0;
  for (let i = 0; i < weights.length; i += 1) {
    score += weights[i] * (vector[i] ?? 0);
  }
  return {
    probability: sigmoid(score),
    threshold: labelModel.threshold ?? 0.5,
  };
};

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
    if (features.systolic > 180 || features.diastolic > 120) {
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
    if (features.glucose >= 200) {
      hints.push({ key: "severeHyperglycemia", minProbability: 0.85 });
    } else if (features.glucose >= 126) {
      hints.push({ key: "uncontrolledDiabetes", minProbability: 0.72 });
    } else if (features.glucose >= 100) {
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

  if (features.diseaseCount >= 2 || features.diseaseCategoryCount >= 2) {
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

    const trainedModel = loadTrainedModel();
    if (!trainedModel) {
      return fallbackRulePrediction(patient);
    }

    const modelVector = buildModelVector(features, trainedModel);
    const availability = {
      hasBp: features.systolic !== null && features.diastolic !== null,
      hasGlucose: features.glucose !== null,
      hasHemoglobin: features.hemoglobin !== null,
      hasAge: features.age !== null,
    };

    const bpKeys = new Set(["hypertensiveCrisis", "uncontrolledHypertension", "stage1Hypertension", "hypotensionRisk"]);
    const glucoseKeys = new Set(["severeHyperglycemia", "uncontrolledDiabetes", "prediabetes", "hypoglycemiaRisk"]);
    const hemoglobinKeys = new Set(["severeAnemia", "anemia"]);

    const rawPredictions = CONDITION_CATALOG.map((catalogEntry) => {
      const scored = scoreLabel(trainedModel, catalogEntry.key, modelVector);
      if (!scored) {
        return { catalogEntry, probability: 0, threshold: 1, available: false };
      }

      let available = true;
      if (bpKeys.has(catalogEntry.key)) {
        available = availability.hasBp;
      } else if (glucoseKeys.has(catalogEntry.key)) {
        available = availability.hasGlucose;
      } else if (hemoglobinKeys.has(catalogEntry.key)) {
        available = availability.hasHemoglobin;
      } else if (catalogEntry.key === "complicationRisk") {
        available = features.diseaseCount > 0 || features.diseaseCategoryCount > 0;
      } else if (catalogEntry.key === "cardiovascularEvent") {
        available = availability.hasAge;
      }

      return {
        catalogEntry,
        probability: scored.probability,
        threshold: scored.threshold,
        available,
      };
    });

    const ruleHints = deriveRuleHints(features);
    ruleHints.forEach((hint) => {
      const target = rawPredictions.find((entry) => entry.catalogEntry.key === hint.key);
      if (target && target.available) {
        target.probability = Math.max(target.probability, hint.minProbability);
      }
    });

    const availablePredictions = rawPredictions.filter((entry) => entry.available);
    if (availablePredictions.length === 0) {
      return fallbackRulePrediction(patient);
    }

    const selectedRaw = availablePredictions.sort((a, b) => {
      if (urgencyRank[b.catalogEntry.urgency] !== urgencyRank[a.catalogEntry.urgency]) {
        return urgencyRank[b.catalogEntry.urgency] - urgencyRank[a.catalogEntry.urgency];
      }
      return b.probability - a.probability;
    });

    const pickTopByGroup = (entries, keys) => {
      const filtered = entries.filter((entry) => keys.includes(entry.catalogEntry.key));
      if (filtered.length <= 1) return filtered;
      return filtered
        .sort((a, b) => {
          if (urgencyRank[b.catalogEntry.urgency] !== urgencyRank[a.catalogEntry.urgency]) {
            return urgencyRank[b.catalogEntry.urgency] - urgencyRank[a.catalogEntry.urgency];
          }
          return b.probability - a.probability;
        })
        .slice(0, 1);
    };

    const classifyBpKey = (f) => {
      if (f.systolic === null || f.diastolic === null) return null;
      if (f.systolic > 180 || f.diastolic > 120) return "hypertensiveCrisis";
      if (f.systolic >= 140 || f.diastolic >= 90) return "uncontrolledHypertension"; // Stage 2
      if (f.systolic >= 130 || f.diastolic >= 80) return "stage1Hypertension";
      if (f.systolic < 90 || f.diastolic < 60) return "hypotensionRisk";
      return null;
    };

    const classifyGlucoseKey = (f) => {
      if (f.glucose === null) return null;
      if (f.glucose >= 200) return "severeHyperglycemia";
      if (f.glucose >= 126) return "uncontrolledDiabetes";
      if (f.glucose >= 100) return "prediabetes";
      if (f.glucose < 70) return "hypoglycemiaRisk";
      return null;
    };

    const bpGroup = ["hypertensiveCrisis", "uncontrolledHypertension", "stage1Hypertension", "hypotensionRisk"];
    const glucoseGroup = ["severeHyperglycemia", "uncontrolledDiabetes", "prediabetes", "hypoglycemiaRisk"];
    const anemiaGroup = ["severeAnemia", "anemia"];

    const groupKeys = new Set([...bpGroup, ...glucoseGroup, ...anemiaGroup]);
    const pickByKey = (entries, key) => entries.filter((entry) => entry.catalogEntry.key === key);

    const bpKey = classifyBpKey(features);
    const glucoseKey = classifyGlucoseKey(features);

    const bpSelected = bpKey ? pickByKey(availablePredictions, bpKey) : pickTopByGroup(selectedRaw, bpGroup);
    const glucoseSelected = glucoseKey
      ? pickByKey(availablePredictions, glucoseKey)
      : pickTopByGroup(selectedRaw, glucoseGroup);
    const anemiaSelected = pickTopByGroup(selectedRaw, anemiaGroup);

    const groupFiltered = [...bpSelected, ...glucoseSelected, ...anemiaSelected].filter(Boolean);
    const others = selectedRaw.filter((entry) => !groupKeys.has(entry.catalogEntry.key));
    const selected = [...groupFiltered, ...others].sort((a, b) => {
      if (urgencyRank[b.catalogEntry.urgency] !== urgencyRank[a.catalogEntry.urgency]) {
        return urgencyRank[b.catalogEntry.urgency] - urgencyRank[a.catalogEntry.urgency];
      }
      return b.probability - a.probability;
    });

    const finalPredictions = selected.map(({ catalogEntry, probability }) => ({
      condition: catalogEntry.condition,
      riskPercentage: normalizeProbability(probability),
      urgency: catalogEntry.urgency,
      details: catalogEntry.details,
      immediateCare: catalogEntry.immediateCare,
      reasons: enrichReasons(patient, catalogEntry.key),
    }));

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
      modelType: "ML model (Python-trained logistic regression, multi-label)",
      trainingInfo: {
        trainedAt: trainedModel.generatedAt || "Unknown",
        trainingSamples: trainedModel.training?.samples ?? "Unknown",
        features: trainedModel.features || FEATURES,
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
