import React from 'react';

export default function InputField({ label, name, type = 'text', value, onChange, error, placeholder, readOnly = false, disabled = false }) {
  return (
    <tr>
      <td className="labelCell"><label htmlFor={name}>{label}</label></td>
      <td className="inputCell">
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          disabled={disabled}
          className={error ? 'input errorInput' : 'input'}
        />
        {error && <div className="errorText">{error}</div>}
      </td>
    </tr>
  );
}
