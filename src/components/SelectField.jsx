import React from 'react';

export default function SelectField({ label, name, options, value, onChange, error }) {
  return (
    <tr>
      <td className="labelCell"><label htmlFor={name}>{label}</label></td>
      <td className="inputCell">
        <select id={name} name={name} value={value} onChange={onChange} className={error ? 'select errorInput' : 'select'}>
          <option value="">Select</option>
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        {error && <div className="errorText">{error}</div>}
      </td>
    </tr>
  );
}
