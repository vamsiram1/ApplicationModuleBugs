/**
 * Safely converts value to string and trims it
 * @param {any} value - Value to convert and trim
 * @returns {string} - Trimmed string or empty string
 */
function safeTrim(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

/**
 * Validates language information
 * 1st Language and 2nd Language are mandatory
 * @param {Object} formData - Form data containing language information
 * @returns {Object} - Object with validation errors { fieldName: errorMessage }
 */
export function validateLanguageInfo(formData) {
  const errors = {};

  // 1st Language is required
  const firstLanguage = safeTrim(formData.firstLanguage);
  if (!firstLanguage) {
    errors.firstLanguage = "1st Language is required";
  }

  // 2nd Language is required
  const secondLanguage = safeTrim(formData.secondLanguage);
  if (!secondLanguage) {
    errors.secondLanguage = "2nd Language is required";
  }

  return errors;
}
