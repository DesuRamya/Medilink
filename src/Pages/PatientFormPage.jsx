import React, { useState } from 'react';
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

const genderOptions = ['Male', 'Female', 'Prefer not to say'];
const bloodGroupOptions = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];
const maritalStatusOptions = ['Single','Married','Divorced','Widowed'];
const yesNoOptions = ['Yes','No'];

export default function PatientFormPage() {
  const location = useLocation();
  const phoneFromRegistration = location.state?.phone;
  const patientToEdit = location.state?.patient || null;
  const isEditMode = Boolean(location.state?.isEdit && patientToEdit);
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
    setTouched(prev => ({ ...prev, alternatePhone: true }));
    setForm(prev => prev.alternatePhone === value ? prev : { ...prev, alternatePhone: value });
    setErrors(prev => ({
      ...prev,
      alternatePhone: validators.alternatePhone(value, form)
    }));
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
        ? `http://localhost:5050/api/patients/patient/${patientId}`
        : "http://localhost:5050/api/patients";

      let res = await fetch(endpoint, {
        method: isUpdate ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (isUpdate && res.status === 404 && payload.phone) {
        const fallbackEndpoint = `http://localhost:5050/api/patients/patient-by-phone/${encodeURIComponent(payload.phone)}`;
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

      if (data.patient?._id) {
        localStorage.setItem("patientId", data.patient._id);
        localStorage.setItem("patientData", JSON.stringify(data.patient));
      }

      alert(isUpdate ? "Details updated successfully!" : "Form submitted successfully!");
      navigate("/patientdetails");
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
