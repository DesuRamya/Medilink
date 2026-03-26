import React, { useState } from 'react';
import { createWorker } from 'tesseract.js';
import 'react-phone-number-input/style.css';
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";


import '../styles/PatientFormPage.css';

import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import DiseaseGroup from '../components/DiseaseGroup';
import PhoneField from '../components/phoneField';
import { diseases, diseaseLabels } from '../data/diseases';
import { validators } from '../utils/validation';
import { apiUrl } from '../lib/api';

const genderOptions = ['Male', 'Female', 'Prefer not to say'];
const bloodGroupOptions = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];
const maritalStatusOptions = ['Single','Married','Divorced','Widowed'];
const yesNoOptions = ['Yes','No'];

export default function PatientFormPage() {
  const location = useLocation();
  const phoneFromRegistration = location.state?.phone;
  const patientToEdit = location.state?.patient || null;
  const isEditMode = Boolean(location.state?.isEdit && patientToEdit);
  const fromDoctor = Boolean(location.state?.fromDoctor);
  const navigate = useNavigate();

  const getInitialDiseaseState = (existingDiseases = {}) => {
    const initialSelectedCategories = {};
    const initialSpecifics = {};

    Object.entries(existingDiseases || {}).forEach(([category, selectedList]) => {
      if (Array.isArray(selectedList) && selectedList.length > 0) {
        initialSelectedCategories[category] = true;
        initialSpecifics[category] = {};
        selectedList.forEach((item) => {
          initialSpecifics[category][item] = true;
        });
      }
    });

    return { initialSelectedCategories, initialSpecifics };
  };

  const { initialSelectedCategories, initialSpecifics } = getInitialDiseaseState(
    patientToEdit?.diseases || {}
  );

  const initialForm = {
    name: patientToEdit?.name || '',
    dateOfBirth: patientToEdit?.dateOfBirth || '',
    age: patientToEdit?.age || '',
    gender: patientToEdit?.gender || '',
    bloodGroup: patientToEdit?.bloodGroup || '',
    phone: patientToEdit?.phone || phoneFromRegistration || '',
    alternatePhone: patientToEdit?.alternatePhone || '',
    address: patientToEdit?.address || '',
    height: patientToEdit?.height || '',
    weight: patientToEdit?.weight || '',
    maritalStatus: patientToEdit?.maritalStatus || '',
    occupation: patientToEdit?.occupation || '',
    hbTestDate: patientToEdit?.hbTestDate || '',
    hemoglobin: patientToEdit?.hemoglobin || '',
    hasBp: patientToEdit?.hasBp || '',
    bpTestDate: patientToEdit?.bpTestDate || '',
    bp: patientToEdit?.bp || '',
    hasDiabetics: patientToEdit?.hasDiabetics || '',
    diabeticTestDate: patientToEdit?.diabeticTestDate || '',
    diabetic: patientToEdit?.diabetic || '',
    alcoholic: patientToEdit?.alcoholic || '',
    smoker: patientToEdit?.smoker || '',
    Diseases:''
  };

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [selectedCategories, setSelectedCategories] = useState(initialSelectedCategories);
  const [specifics, setSpecifics] = useState(initialSpecifics);
  const [diseaseErrors, setDiseaseErrors] = useState({});
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [prescriptionPreview, setPrescriptionPreview] = useState(
    patientToEdit?.prescriptionImage ? apiUrl(patientToEdit.prescriptionImage) : ""
  );
  const [reportProcessing, setReportProcessing] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportPreview, setReportPreview] = useState("");
  const [reportExtracted, setReportExtracted] = useState(null);

  /* ---------------- HELPERS ---------------- */

  const validateField = (name, value) => {
    const fn = validators[name];
    if (!fn) return '';
    return fn(value, form) || '';
  };

  const isRecent = (dateString, months = 6) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    const limit = new Date();
    limit.setMonth(today.getMonth() - months);
    return date >= limit && date <= today;
  };

  const showHB = isRecent(form.hbTestDate, 6);
  const showBP = isRecent(form.bpTestDate, 6);
  const showDiabetic = isRecent(form.diabeticTestDate, 6);

  /* ---------------- INPUT HANDLERS ---------------- */

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    if (name === 'dateOfBirth') {
      if (!value) {
        setForm(prev => ({ ...prev, dateOfBirth: '', age: '' }));
        return;
      }

      const dob = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;

      setForm(prev => ({ ...prev, dateOfBirth: value, age }));
      return;
    }

    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handlePhoneChange = (value) => {
    setTouched(prev => ({ ...prev, phone: true }));
    setForm(prev => prev.phone === value ? prev : { ...prev, phone: value });
    setErrors(prev => ({ ...prev, phone: validators.phone(value) }));
  };

  const handleAlternatePhoneChange = (value) => {
    const normalized = value || "";
    setTouched(prev => ({ ...prev, alternatePhone: true }));
    setForm(prev => prev.alternatePhone === normalized ? prev : { ...prev, alternatePhone: normalized });
    setErrors(prev => ({
      ...prev,
      alternatePhone: validators.alternatePhone(normalized, form)
    }));
  };

  const handlePrescriptionFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setPrescriptionFile(file);
    if (!file) {
      setPrescriptionPreview(
        patientToEdit?.prescriptionImage ? apiUrl(patientToEdit.prescriptionImage) : ""
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPrescriptionPreview(reader.result || "");
    reader.readAsDataURL(file);
  };

  const normalizeDateToInput = (raw) => {
    if (!raw) return "";
    const value = raw.trim();
    const isoMatch = value.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
    const dmMatch = value.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (dmMatch) {
      const [, d, m, y] = dmMatch;
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
    return "";
  };

  const normalizePersonName = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const todayInputDate = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const parseReportValues = (text) => {
    const rawText = String(text || "");
    const cleaned = rawText.replace(/\s+/g, " ").trim();
    const result = {
      patientName: "",
      hemoglobin: "",
      bp: "",
      glucose: "",
      totalCholesterol: "",
      ldl: "",
      hdl: "",
      tsh: "",
      creatinine: "",
      egfr: "",
      bmi: "",
      reportDate: "",
    };

    const lines = rawText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const nameLine = lines.find((line) => /patient\s*name/i.test(line));
    if (nameLine) {
      const lineMatch = nameLine.match(/patient\s*name[^a-zA-Z]{0,10}(.+)/i);
      if (lineMatch) {
        result.patientName = lineMatch[1].trim();
      }
    }
    if (!result.patientName) {
      const nameMatch = cleaned.match(/\bpatient\s*name\b[^a-zA-Z]{0,10}([a-zA-Z .'-]{2,})(?=\s+(report|date|age|gender|vitals)\b|$)/i);
      if (nameMatch) {
        result.patientName = nameMatch[1].trim();
      }
    }

    const labeledBpMatch = cleaned.match(/\b(blood\s*pressure|bp)\b[^0-9]{0,12}(\d{2,3})\s*\/\s*(\d{2,3})/i);
    if (labeledBpMatch) {
      result.bp = `${labeledBpMatch[2]}/${labeledBpMatch[3]}`;
    } else {
      const bpMatch = cleaned.match(/(\d{2,3})\s*\/\s*(\d{2,3})(?!\s*\/\s*\d{4})/);
      if (bpMatch) {
        result.bp = `${bpMatch[1]}/${bpMatch[2]}`;
      }
    }

    const hbMatch = cleaned.match(/\b(hemoglobin|haemoglobin|hgb|hb)\b[^0-9]{0,10}(\d{1,2}(?:\.\d)?)/i);
    if (hbMatch) {
      result.hemoglobin = hbMatch[2];
    }

    const glucoseMatch = cleaned.match(/\b(glucose|blood\s*sugar|fbs|rbs|random|fasting|diabetic)\b[^0-9]{0,12}(\d{2,3})/i);
    if (glucoseMatch) {
      result.glucose = glucoseMatch[2];
    }

    const totalCholMatch = cleaned.match(/\b(total\s*cholesterol|cholesterol\s*\(total\)|\btotal\s*chol\b|\bTC\b)\b[^0-9]{0,12}(\d{2,3})/i);
    if (totalCholMatch) {
      result.totalCholesterol = totalCholMatch[2];
    } else {
      const cholMatch = cleaned.match(/\bcholesterol\b[^0-9]{0,12}(\d{2,3})/i);
      if (cholMatch) {
        result.totalCholesterol = cholMatch[1];
      }
    }

    const ldlMatch = cleaned.match(/\bLDL\b[^0-9]{0,10}(\d{2,3})/i);
    if (ldlMatch) {
      result.ldl = ldlMatch[1];
    }

    const hdlMatch = cleaned.match(/\bHDL\b[^0-9]{0,10}(\d{2,3})/i);
    if (hdlMatch) {
      result.hdl = hdlMatch[1];
    }

    const tshMatch = cleaned.match(/\bTSH\b[^0-9]{0,10}(\d{1,2}(?:\.\d+)?)/i);
    if (tshMatch) {
      result.tsh = tshMatch[1];
    }

    const creatinineMatch = cleaned.match(/\b(creatinine|serum\s*creatinine)\b[^0-9]{0,10}(\d{1,2}(?:\.\d+)?)/i);
    if (creatinineMatch) {
      result.creatinine = creatinineMatch[2];
    }

    const egfrMatch = cleaned.match(/\b(eGFR|GFR)\b[^0-9]{0,10}(\d{1,3})/i);
    if (egfrMatch) {
      result.egfr = egfrMatch[2];
    }

    const bmiMatch = cleaned.match(/\bBMI\b[^0-9]{0,10}(\d{1,2}(?:\.\d+)?)/i);
    if (bmiMatch) {
      result.bmi = bmiMatch[1];
    }

    const dateMatch = cleaned.match(/\b(\d{1,2}[/-]\d{1,2}[/-]\d{4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})\b/);
    if (dateMatch) {
      result.reportDate = normalizeDateToInput(dateMatch[1]);
    }

    return result;
  };

  const applyAutoDiseaseSelections = (extracted) => {
    const selections = [];
    const bpMatch = extracted.bp?.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
    const systolic = bpMatch ? Number(bpMatch[1]) : null;
    const diastolic = bpMatch ? Number(bpMatch[2]) : null;
    const hb = extracted.hemoglobin ? Number(extracted.hemoglobin) : null;
    const glucose = extracted.glucose ? Number(extracted.glucose) : null;
    const totalChol = extracted.totalCholesterol ? Number(extracted.totalCholesterol) : null;
    const ldl = extracted.ldl ? Number(extracted.ldl) : null;
    const hdl = extracted.hdl ? Number(extracted.hdl) : null;
    const tsh = extracted.tsh ? Number(extracted.tsh) : null;
    const creatinine = extracted.creatinine ? Number(extracted.creatinine) : null;
    const egfr = extracted.egfr ? Number(extracted.egfr) : null;
    const bmiFromReport = extracted.bmi ? Number(extracted.bmi) : null;
    const gender = String(form.gender || "").toLowerCase();

    if (Number.isFinite(systolic) && Number.isFinite(diastolic)) {
      if (systolic > 180 || diastolic > 120) {
        selections.push({ category: "cardiovascular", disease: "Hypertension (High Blood Pressure)" });
      } else if (systolic >= 140 || diastolic >= 90) {
        selections.push({ category: "cardiovascular", disease: "Hypertension (High Blood Pressure)" });
      } else if (systolic >= 130 || diastolic >= 80) {
        selections.push({ category: "cardiovascular", disease: "Hypertension (High Blood Pressure)" });
      } else if (systolic < 90 || diastolic < 60) {
        selections.push({ category: "cardiovascular", disease: "Hypotension (Low Blood Pressure)" });
      }
    }

    if (Number.isFinite(glucose) && glucose >= 126) {
      selections.push({ category: "endocrine", disease: "Diabetes Type 2" });
    }

    if (Number.isFinite(hb)) {
      const male = gender.includes("male");
      const female = gender.includes("female");
      const anemiaThreshold = male ? 13 : female ? 12 : 12;
      if (hb < anemiaThreshold) {
        selections.push({ category: "blood", disease: "Anemia" });
      }
    }

    if (Number.isFinite(totalChol) && totalChol >= 200) {
      selections.push({ category: "cardiovascular", disease: "High Cholesterol" });
    } else if (Number.isFinite(ldl) && ldl >= 130) {
      selections.push({ category: "cardiovascular", disease: "High Cholesterol" });
    } else if (Number.isFinite(hdl)) {
      const lowHdl = (gender.includes("male") && hdl < 40) || (gender.includes("female") && hdl < 50);
      if (lowHdl) {
        selections.push({ category: "cardiovascular", disease: "High Cholesterol" });
      }
    }

    if (Number.isFinite(tsh) && (tsh < 0.4 || tsh > 4.5)) {
      selections.push({ category: "endocrine", disease: "Thyroid Disorder (Hypothyroid/Hyperthyroid)" });
    }

    const heightM = form.height ? Number(form.height) / 100 : null;
    const weightKg = form.weight ? Number(form.weight) : null;
    const bmi = Number.isFinite(bmiFromReport)
      ? bmiFromReport
      : Number.isFinite(heightM) && Number.isFinite(weightKg) && heightM > 0
        ? Number((weightKg / (heightM * heightM)).toFixed(1))
        : null;
    if (Number.isFinite(bmi) && bmi >= 25) {
      selections.push({ category: "endocrine", disease: "Obesity" });
    }

    if ((Number.isFinite(egfr) && egfr < 60) || (Number.isFinite(creatinine) && creatinine >= 1.3)) {
      selections.push({ category: "kidney", disease: "Chronic Kidney Disease (CKD)" });
    }

    if (selections.length === 0) return;

    setSelectedCategories((prev) => {
      const next = { ...prev };
      delete next.No_such_Disease;
      delete next.noDisease;
      selections.forEach((sel) => {
        next[sel.category] = true;
      });
      return next;
    });

    setSpecifics((prev) => {
      const next = { ...prev };
      selections.forEach((sel) => {
        next[sel.category] = { ...(next[sel.category] || {}), [sel.disease]: true };
      });
      return next;
    });
  };

  const loadImageFromDataUrl = (dataUrl) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Unable to load image data."));
      img.src = dataUrl;
    });

  const rasterizeSvg = async (dataUrl, width = 1400, height = 900) => {
    const img = await loadImageFromDataUrl(dataUrl);
    const canvas = document.createElement("canvas");
    canvas.width = width || img.naturalWidth || 1400;
    canvas.height = height || img.naturalHeight || 900;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  };

  const handleReportUpload = async (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    setReportError("");
    setReportProcessing(true);

    const reader = new FileReader();
    reader.onload = () => setReportPreview(reader.result || "");
    reader.readAsDataURL(file);

    try {
      let inputForOcr = file;
      if (file.type === "image/svg+xml" || file.name?.toLowerCase().endsWith(".svg")) {
        const svgDataUrl = await new Promise((resolve, reject) => {
          const svgReader = new FileReader();
          svgReader.onload = () => resolve(svgReader.result);
          svgReader.onerror = () => reject(new Error("Unable to read SVG file."));
          svgReader.readAsDataURL(file);
        });
        inputForOcr = await rasterizeSvg(svgDataUrl);
      }

      const worker = await createWorker("eng", 1, {
        logger: () => {},
        workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js",
        corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core.wasm.js",
        langPath: "https://tessdata.projectnaptha.com/4.0.0",
      });
      const { data } = await worker.recognize(inputForOcr);
      await worker.terminate();
      const extracted = parseReportValues(data?.text || "");
      setReportExtracted(extracted);

      const formName = normalizePersonName(form.name);
      const reportName = normalizePersonName(extracted.patientName);
      if (!formName) {
        setReportError("Please enter the patient name before uploading a report.");
        return;
      }
      if (!reportName || !(reportName === formName || reportName.includes(formName) || formName.includes(reportName))) {
        setReportError("Patient name does not match the report. Please add the correct person's report.");
        return;
      }

      applyAutoDiseaseSelections(extracted);

      setForm((prev) => {
        const next = { ...prev };
        const fallbackDate = extracted.reportDate || todayInputDate();
        if (extracted.bp && !prev.bp) {
          next.bp = extracted.bp;
          next.hasBp = "Yes";
          next.bpTestDate = fallbackDate;
        }
        if (extracted.glucose && !prev.diabetic) {
          next.diabetic = extracted.glucose;
          next.hasDiabetics = "Yes";
          next.diabeticTestDate = fallbackDate;
        }
        if (extracted.hemoglobin && !prev.hemoglobin) {
          next.hemoglobin = extracted.hemoglobin;
          next.hbTestDate = fallbackDate;
        }
        return next;
      });
    } catch (err) {
      console.error(err);
      setReportError(
        `Could not read the report image. ${err?.message ? err.message : "Please upload a clearer image."}`
      );
    } finally {
      setReportProcessing(false);
    }
  };


  /* ---------------- DISEASE HANDLING ---------------- */

  const handleToggleCategory = (catKey) => {
  // If "No such diseases" is clicked
  if (catKey === 'noDisease') {
    setSelectedCategories(prev => {
      // toggle noDisease
      const isChecked = !prev.noDisease;
      return isChecked ? { noDisease: true } : {};
    });

    // Clear all specific diseases
    setSpecifics({});
    return;
  }

  // If another category is selected
  setSelectedCategories(prev => {
    const next = { ...prev };

    // Remove "noDisease" if present
    delete next.noDisease;

    next[catKey] = !next[catKey];

    // If unchecked, clear its specifics
    if (!next[catKey]) {
      setSpecifics(s => {
        const copy = { ...s };
        delete copy[catKey];
        return copy;
      });
    }

    return next;
  });
};


  const handleToggleSpecific = (catKey, disease) => {
    setSpecifics(prev => ({
      ...prev,
      [catKey]: {
        ...(prev[catKey] || {}),
        [disease]: !prev[catKey]?.[disease]
      }
    }));
  };

  // PURE validation – NO setState
  const getDiseaseErrors = () => {
  const activeCategories = Object.keys(selectedCategories)
    .filter(k => selectedCategories[k]);

  // ❌ Nothing selected
  if (activeCategories.length === 0) {
    return { _global: 'Select at least one disease category' };
  }

  // ✅ ONLY "No such diseases" selected → VALID
  if (activeCategories.length === 1 && activeCategories[0] === 'No_such_Disease') {
    return {};
  }

  const errs = {};

  // ❌ Other categories need at least one specific disease
  activeCategories.forEach(k => {
    const selected = specifics[k]
      ? Object.keys(specifics[k]).filter(x => specifics[k][x])
      : [];

    if (selected.length === 0) {
      errs[k] = `Select at least one disease for ${diseaseLabels[k] || k}`;
    }
  });

  return errs;
};



  /* ---------------- FORM VALIDATION ---------------- */

  const requiredFields = [
    'name',
    'dateOfBirth',
    'gender',
    'bloodGroup',
    'phone',
    'address',
    'maritalStatus',
    'occupation',
    'hasBp',
    'hasDiabetics',
  ];

  const isFormValid = () => {
  // Basic required fields
  for (const f of requiredFields) {
    if (!form[f]) return false;
    if (validateField(f, form[f])) return false;
  }

  /* -------- HEMOGLOBIN -------- */
  if (form.hbTestDate && showHB) {
    if (!form.hemoglobin) return false;
    if (validateField('hemoglobin', form.hemoglobin)) return false;
  }

  /* -------- BLOOD PRESSURE -------- */
  if (form.hasBp === 'Yes') {
    if (!form.bpTestDate) return false;

    if (showBP) {
      if (!form.bp) return false;
      if (validateField('bp', form.bp)) return false;
    }
  }

  /* -------- DIABETES -------- */
  if (form.hasDiabetics === 'Yes') {
    if (!form.diabeticTestDate) return false;

    if (showDiabetic) {
      if (!form.diabetic) return false;
      if (validateField('diabetic', form.diabetic)) return false;
    }
  }

  /* -------- DISEASE SELECTION -------- */
  if (Object.keys(getDiseaseErrors()).length > 0) return false;

  return true;
};

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dErrors = getDiseaseErrors();
    setDiseaseErrors(dErrors);

    if (!isFormValid()) {
      window.alert('Form has errors. Please fix them.');
      return;
    }

    const payload = { ...form, diseases: {} };
    Object.keys(selectedCategories).forEach(k => {
      if (selectedCategories[k]) {
        payload.diseases[k] =
          Object.keys(specifics[k] || {}).filter(s => specifics[k][s]);
      }
    });

    try {
      const patientId = patientToEdit?._id || localStorage.getItem("patientId");
      const isUpdate = isEditMode && patientId;
      const endpoint = isUpdate
        ? apiUrl(`/api/patients/patient/${patientId}`)
        : apiUrl("/api/patients");

      let res = await fetch(endpoint, {
        method: isUpdate ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (isUpdate && res.status === 404 && payload.phone) {
        const fallbackEndpoint = apiUrl(
          `/api/patients/patient-by-phone/${encodeURIComponent(payload.phone)}`
        );
        res = await fetch(fallbackEndpoint, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      const raw = await res.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = { message: `Non-JSON response (${res.status}) from ${endpoint}` };
      }

      if (!res.ok) {
        alert(data.message || `Failed to save patient details (${res.status})`);
        return;
      }

      let updatedPatient = data.patient || payload;

      if (prescriptionFile && (updatedPatient?._id || patientId)) {
        const targetId = updatedPatient?._id || patientId;
        const formData = new FormData();
        formData.append("image", prescriptionFile);
        const uploadRes = await fetch(
          apiUrl(`/api/patients/patient/${targetId}/prescription-image`),
          {
            method: "POST",
            body: formData,
          }
        );
        const uploadData = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) {
          alert(uploadData.message || "Failed to upload prescription image");
          return;
        }
        updatedPatient = uploadData.patient || updatedPatient;
      }

      if (!fromDoctor && updatedPatient?._id) {
        localStorage.setItem("patientId", updatedPatient._id);
        localStorage.setItem("patientData", JSON.stringify(updatedPatient));
      }

      alert(isUpdate ? "Details updated successfully!" : "Form submitted successfully!");
      if (fromDoctor) {
        navigate("/doctor/patient-details", {
          state: { patient: updatedPatient, phone: payload.phone }
        });
      } else {
        navigate("/patientdetails");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to submit form");
    }  
  };

  const submitEnabled = isFormValid();

  /* ---------------- UI ---------------- */

  return (
    <div className="container">
      <h1 className="title">
        {isEditMode ? "Edit Patient Information" : "Patient Information Form"}
      </h1>

      <form onSubmit={handleSubmit} noValidate>
        <table className="formTable">
          <tbody>

            <tr>
              <td className="labelCell">
                <label htmlFor="reportImage">Medical Report Image (Auto-fill)</label>
              </td>
              <td className="inputCell">
                <input
                  id="reportImage"
                  name="reportImage"
                  type="file"
                  accept="image/*"
                  onChange={handleReportUpload}
                />
                {reportProcessing && <p className="form-hint">Extracting data from report...</p>}
                {reportError && <p className="form-error">{reportError}</p>}
                {reportExtracted && (
                  <p className="form-hint">
                    Detected: BP {reportExtracted.bp || "—"}, Hb {reportExtracted.hemoglobin || "—"}, Glucose {reportExtracted.glucose || "—"}, Date {reportExtracted.reportDate || "—"}
                  </p>
                )}
                {reportPreview && (
                  <div className="prescription-preview">
                    <img src={reportPreview} alt="Medical report preview" />
                  </div>
                )}
              </td>
            </tr>

            <InputField label="Name*" name="name" value={form.name} onChange={handleInputChange} error={touched.name && errors.name} />
            <InputField label="Date of Birth*" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleInputChange} error={touched.dateOfBirth && errors.dateOfBirth}/>
            <InputField label="Age" name="age" type="number" value={form.age} readOnly />

            <SelectField label="Gender*" name="gender" options={genderOptions} value={form.gender} onChange={handleInputChange} error={touched.gender && errors.gender} />
            <SelectField label="Blood Group*" name="bloodGroup" options={bloodGroupOptions} value={form.bloodGroup} onChange={handleInputChange} error={touched.bloodGroup && errors.bloodGroup} />

            <PhoneField label="Mobile Number*" value={form.phone} disabled={true}  className="readonly-phone"/>
            <PhoneField label="Alternate Mobile Number" value={form.alternatePhone} onChange={handleAlternatePhoneChange} error={touched.alternatePhone && errors.alternatePhone} />

            <InputField label="Address*" name="address" value={form.address} onChange={handleInputChange} error={touched.address && errors.address} />
            <InputField label="Height (cm)" name="height" type="number" value={form.height} onChange={handleInputChange} error={touched.height && errors.height} />
            <InputField label="Weight (kg)" name="weight" type="number" value={form.weight} onChange={handleInputChange} error={touched.weight && errors.weight} />

            <SelectField label="Marital Status*" name="maritalStatus" options={maritalStatusOptions} value={form.maritalStatus} onChange={handleInputChange} error={touched.maritalStatus && errors.maritalStatus} />
            <InputField label="Occupation*" name="occupation" value={form.occupation} onChange={handleInputChange} error={touched.occupation && errors.occupation} />

            <InputField label="Date of Last Hemoglobin Test*" name="hbTestDate" type="date" value={form.hbTestDate} onChange={handleInputChange} error={touched.hbTestDate && errors.hbTestDate}/>
            {showHB && <InputField label="Hemoglobin (g/dL)*" name="hemoglobin" value={form.hemoglobin} onChange={handleInputChange} error={touched.hemoglobin && errors.hemoglobin} />}

            <SelectField label="Do you have Blood Pressure?*" name="hasBp" options={yesNoOptions} value={form.hasBp} onChange={handleInputChange} error={touched.hasBp && errors.hasBp} />
            {form.hasBp === 'Yes' && <InputField label="BP Test Date*" name="bpTestDate" type="date" value={form.bpTestDate} onChange={handleInputChange} />}
            {form.hasBp === 'Yes' && showBP && <InputField label="BP (120/80)*" name="bp" value={form.bp} onChange={handleInputChange} error={touched.bp && errors.bp} />}

            <SelectField label="Do you have Diabetes?*" name="hasDiabetics" options={yesNoOptions} value={form.hasDiabetics} onChange={handleInputChange} error={touched.hasDiabetics && errors.hasDiabetics} />
            {form.hasDiabetics === 'Yes' && <InputField label="Diabetic Test Date*" name="diabeticTestDate" type="date" value={form.diabeticTestDate} onChange={handleInputChange} />}
            {form.hasDiabetics === 'Yes' && showDiabetic && <InputField label="Diabetic Levels*" name="diabetic" value={form.diabetic} onChange={handleInputChange} error={touched.diabetic && errors.diabetic} />}

            <DiseaseGroup
              categories={diseaseLabels}
              diseaseData={diseases}
              value={{ selectedCategories, specifics }}
              onToggleCategory={handleToggleCategory}
              onToggleSpecific={handleToggleSpecific}
              errors={diseaseErrors}
            />

            <SelectField label="Alcoholic" name="alcoholic" options={yesNoOptions} value={form.alcoholic} onChange={handleInputChange} />
            <SelectField label="Smoker" name="smoker" options={yesNoOptions} value={form.smoker} onChange={handleInputChange} />

            {(fromDoctor || isEditMode) && (
              <tr>
                <td className="labelCell">
                  <label htmlFor="prescriptionImage">Prescription Image</label>
                </td>
                <td className="inputCell">
                  <input
                    id="prescriptionImage"
                    name="prescriptionImage"
                    type="file"
                    accept="image/*"
                    onChange={handlePrescriptionFileChange}
                  />
                  {prescriptionPreview && (
                    <div className="prescription-preview">
                      <img src={prescriptionPreview} alt="Prescription preview" />
                    </div>
                  )}
                </td>
              </tr>
            )}

          </tbody>
        </table>

        <div className="submitRow">
          <button
            type="submit"
            disabled={!submitEnabled}
            className={submitEnabled ? 'submitBtn enabled' : 'submitBtn disabled'}
          >
            Submit
          </button>
        </div>

      </form>
    </div>
  );
}
