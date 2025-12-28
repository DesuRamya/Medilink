import React from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

export default function PhoneField({
  label,
  value,
  onChange,
  error,
  disabled,
  className
}) {
  return (
    <tr>
      <td className="labelCell">{label}</td>
      <td className="inputCell">
        <div className={`phone-field-container ${className || ""}`}>
          <PhoneInput
            international
            defaultCountry="IN"
            value={value}
            onChange={onChange}
            disabled={disabled}
          />
          {error && <div className="errorText">{error}</div>}
        </div>
      </td>
    </tr>
  );
}
