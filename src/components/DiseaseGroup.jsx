import React from "react";

export default function DiseaseGroup({
  categories,
  diseaseData,
  value,
  onToggleCategory,
  onToggleSpecific,
  errors
}) {
  return (
    <tr>
      <td className="labelCell">
        <label>Diseases*</label>
      </td>

      <td className="inputCell diseaseTd">
        <div className="diseaseContainer">

          {Object.keys(categories).map((catKey) => {
            const diseases = diseaseData[catKey] || [];

            const mid = Math.ceil(diseases.length / 2);
            const left = diseases.slice(0, mid);
            const right = diseases.slice(mid);

            return (
              <div key={catKey} className="diseaseGroup">

                {/* ===== Category (LEFT aligned) ===== */}
                <div className="categoryHeader">
                  <input
                    type="checkbox"
                    checked={!!value.selectedCategories[catKey]}
                    onChange={() => onToggleCategory(catKey)}
                  />
                  <span>{categories[catKey]}</span>
                </div>

                {/* ===== Specific diseases (2-column table) ===== */}
                {value.selectedCategories[catKey] && diseases.length > 0 && (
                  <table className="diseaseTable">
                    <tbody>
                      {left.map((disease, index) => (
                        <tr key={disease}>
                          {/* LEFT COLUMN */}
                          <td className="diseaseCell">
                            <label className="diseaseItem">
                              <input
                                type="checkbox"
                                checked={
                                  !!(
                                    value.specifics[catKey] &&
                                    value.specifics[catKey][disease]
                                  )
                                }
                                onChange={() =>
                                  onToggleSpecific(catKey, disease)
                                }
                              />
                              <span>{disease}</span>
                            </label>
                          </td>

                          {/* RIGHT COLUMN */}
                          <td className="diseaseCell">
                            {right[index] && (
                              <label className="diseaseItem">
                                <input
                                  type="checkbox"
                                  checked={
                                    !!(
                                      value.specifics[catKey] &&
                                      value.specifics[catKey][right[index]]
                                    )
                                  }
                                  onChange={() =>
                                    onToggleSpecific(catKey, right[index])
                                  }
                                />
                                <span>{right[index]}</span>
                              </label>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* ===== Error ===== */}
                {errors && errors[catKey] && (
                  <div className="errorText">{errors[catKey]}</div>
                )}
              </div>
            );
          })}

        </div>
      </td>
    </tr>
  );
}
