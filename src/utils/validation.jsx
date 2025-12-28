import { parsePhoneNumberFromString } from 'libphonenumber-js';

export const validators = {
  name: (v) => {
    if (!v) return 'This field is required';
    if (!/^[A-Za-z ]+$/.test(v)) return 'Only alphabetic characters allowed';
    if (v.trim().length > 20) return 'Max 20 characters';
    return '';
  },

  dateOfBirth: (v) => {
  if (!v) return 'This field is required';

  const dob = new Date(v);
  const today = new Date();

  if (dob > today) return 'Date of Birth cannot be in the future';

  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;

  if (age > 120) return 'Age cannot exceed 120 years';

  return '';
},


  gender: (v) => (!v ? 'This field is required' : ''),

  bloodGroup: (v) => (!v ? 'This field is required' : ''),

  phone: (v) => {
  if (!v) return "This field is required";

  const phone = parsePhoneNumberFromString(v);
  if (!phone || !phone.isValid()) return "Invalid phone number";

  return "";
},

alternatePhone: (v, form) => {
  if (!v) return ""; 

  const phone = parsePhoneNumberFromString(v);
  if (!phone || !phone.isValid()) return "Invalid alternate phone number";

  if (v === form.phone) return "Alternate number must NOT match mobile";

  return "";
},


  address: (v) => {
    if (!v) return 'This field is required';
    if (v.trim().length > 75) return 'Max 75 characters';
    return '';
  },

  height: (v) => {
    if (v === '' || v === null) return '';
    const n = Number(v);
    if (isNaN(n)) return 'Enter valid number';
    if (n <= 0 || n > 300) return 'Height must be between 1 and 300';
    return '';
  },

  weight: (v) => {
    if (v === '' || v === null) return '';
    const n = Number(v);
    if (isNaN(n)) return 'Enter valid number';
    if (n <= 0 || n > 300) return 'Weight must be between 1 and 300';
    return '';
  },

  maritalStatus: (v) => (!v ? 'This field is required' : ''),

  occupation: (v) => {
    if (!v) return 'This field is required';
    if (!/^[A-Za-z ]+$/.test(v)) return 'Only alphabetic characters allowed';
    if (v.trim().length > 20) return 'Max 20 characters';
    return '';
  },

  hemoglobin: (value, form) => {
  // if (!isRecent(form.hbTestDate, 6)) return "";
  if (!value) return "This field is required";

  const hb = Number(value);

  const age = Number(form.age);
  const gender = form.gender;
  if (!/^\d+(\.\d{1,2})?$/.test(value)) {
    return "Enter a valid number (e.g. 13.5)";
  }

  let min = 0, max = 0;

  if(gender == "" || age == "") {
    return "Select gender or age to validate hemoglobin";
  }
    // CHILDREN (<15 years)
  if (age < 15) {
    min = 11;
    max = 15.5;
  }
  // ADULT MEN
  else if (gender === "Male") {
    min = 14;
    max = 18;
  }
  // ADULT WOMEN
  else if (gender === "Female") {
    min = 12;
    max = 16;
  }
  
  return (hb <= 0) ? 'Invalid Hb Value' : '';
},

hasBp: (v) => (!v ? 'This field is required' : ''),

hasDiabetics: (v) => (!v ? 'This field is required' : ''),

    bp: (v) => {
      // if (!v) return 'This field is required';
    if (!/^[0-9]{2,3}\/[0-9]{2,3}$/.test(v)) return 'BP must be like 120/80';
    return '';
    },

  diabetic: (v) => {
    // if (v === '' || v === null) return 'This field is required';
    const n = Number(v);
    if (isNaN(n)) return 'Enter valid number';
    if (n < 0 || n > 450) return 'Max diabetic value is 450';
    return '';
  },

};
