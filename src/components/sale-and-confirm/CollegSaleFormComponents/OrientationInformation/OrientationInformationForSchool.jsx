import React, { useMemo, useEffect, useState } from "react";
import { useFormikContext } from "formik";
import styles from "./OrientationInformation.module.css";
 
import {
  orientationInfoFieldsForSchool,
  orientationInfoFieldsLayoutForSchool
} from "./orientationFieldsForSchool";
 
import { renderField } from "../../../../utils/renderField";

// API Hooks
import {
  useGetClassesByCampus,
  useGetOrientationByClass,
  useGetStudentTypeByClass,
  useGetSchoolOrientationFee,
} from "../../../../queries/saleApis/clgSaleApis";

import { formatFee } from "../../../../utils/feeFormat";

// Helper functions
const asArray = (v) => (Array.isArray(v) ? v : []);

const classLabel = (c) => c?.className || c?.name || c?.label || "";
const classId = (c) => c?.classId || c?.id || null;

const orientationLabel = (o) => o?.name || o?.label || "";
const orientationId = (o) => o?.id || null;

const studentTypeLabel = (s) => s?.name || s?.label || "";
const studentTypeId = (s) => s?.id || null;
 
const OrientationInformationForSchool = ({ 
  initialAcademicYear,
  initialAcademicYearId,
  initialCampusName,
  initialCampusId,
  initialCityName,
  initialCityId
}) => {
  const { values, setFieldValue } = useFormikContext();

  // Initialize selectedCampusId from props or Formik values
  const [selectedCampusId, setSelectedCampusId] = useState(() => {
    const campusId = initialCampusId || values.campusId || values.branchId;
    return campusId ? Number(campusId) : null;
  });
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedOrientationId, setSelectedOrientationId] = useState(null);

  // Use effective campus ID to ensure API calls work even if state updates are delayed
  const effectiveCampusId = selectedCampusId || initialCampusId || values.campusId || values.branchId;

  // API calls - use effectiveCampusId to ensure consistent API calls
  const { data: classesRaw } = useGetClassesByCampus(effectiveCampusId ? Number(effectiveCampusId) : null);
  const { data: orientationRaw } = useGetOrientationByClass(
    selectedClassId,
    effectiveCampusId ? Number(effectiveCampusId) : null
  );
  const { data: studentTypeRaw } = useGetStudentTypeByClass(
    effectiveCampusId ? Number(effectiveCampusId) : null,
    selectedClassId
  );
  // Get orientation fee details when orientation is selected (SCHOOL API)
  const { data: orientationFeeData } = useGetSchoolOrientationFee(
    selectedOrientationId
  );

  // Normalize API results
  const classes = useMemo(() => asArray(classesRaw), [classesRaw]);
  const orientations = useMemo(() => asArray(orientationRaw), [orientationRaw]);
  const studentTypes = useMemo(() => asArray(studentTypeRaw), [studentTypeRaw]);

  // Create name-to-ID maps for dropdowns
  const classNameToId = useMemo(() => {
    const m = new Map();
    classes.forEach((c) => {
      const label = classLabel(c);
      const id = classId(c);
      if (label && id) {
        m.set(label, id);
      }
    });
    return m;
  }, [classes]);

  const orientationNameToId = useMemo(() => {
    const m = new Map();
    orientations.forEach((o) => {
      const label = orientationLabel(o);
      const id = orientationId(o);
      if (label && id) {
        m.set(label, id);
      }
    });
    return m;
  }, [orientations]);

  const studentTypeNameToId = useMemo(() => {
    const m = new Map();
    studentTypes.forEach((s) => {
      const label = studentTypeLabel(s);
      const id = studentTypeId(s);
      if (label && id) {
        m.set(label, id);
      }
    });
    return m;
  }, [studentTypes]);

  // Initialize selectedCampusId when initialCampusId or values change
  useEffect(() => {
    const campusId = initialCampusId || values.campusId || values.branchId;
    if (campusId && Number(campusId) !== selectedCampusId) {
      const numCampusId = Number(campusId);
      setSelectedCampusId(numCampusId);
      console.log("🔄 OrientationInfo: Set selectedCampusId to", numCampusId);
    }
  }, [initialCampusId, values.campusId, values.branchId, selectedCampusId]);

  // Initialize orientationCity and orientationCityId from props or Formik values
  useEffect(() => {
    // Set orientationCity if initialCityName is provided and Formik value is empty
    if (initialCityName && !values.orientationCity) {
      setFieldValue("orientationCity", initialCityName);
      console.log("🔄 OrientationInfo: Set orientationCity from initialCityName:", initialCityName);
    }
    // Set orientationCityId if initialCityId is provided and Formik value is empty
    if (initialCityId && (!values.orientationCityId || values.orientationCityId === 0 || values.orientationCityId === null)) {
      setFieldValue("orientationCityId", initialCityId);
      console.log("🔄 OrientationInfo: Set orientationCityId from initialCityId:", initialCityId);
    }
  }, [initialCityName, initialCityId, values.orientationCity, values.orientationCityId, setFieldValue]);

  // Sync selectedClassId when classId or joiningClassId is set in Formik
  useEffect(() => {
    const classIdValue = values.classId || values.joiningClassId;
    if (classIdValue && Number(classIdValue) !== selectedClassId) {
      const numClassId = Number(classIdValue);
      setSelectedClassId(numClassId);
      console.log("🔄 OrientationInfo: Set selectedClassId to", numClassId);
    }
  }, [values.classId, values.joiningClassId, selectedClassId]);

  // Sync selectedOrientationId when orientationId is set in Formik
  useEffect(() => {
    const orientationIdValue = values.orientationId;
    if (orientationIdValue && Number(orientationIdValue) !== selectedOrientationId) {
      const numOrientationId = Number(orientationIdValue);
      setSelectedOrientationId(numOrientationId);
      console.log("🔄 OrientationInfo: Set selectedOrientationId to", numOrientationId);
    }
  }, [values.orientationId, selectedOrientationId]);

  // Auto-populate course fee when orientation is selected
  // SCHOOL ONLY: Extract only fee from API response
  // API: GET /api/application-confirmation/orientation-fee?orientationId={orientationId}
  // Response: Could be { fee }, { data: { fee } }, { data: fee }, or direct number/string
  useEffect(() => {
    if (orientationFeeData) {
      console.log(`📊 [SCHOOL] Raw API Response:`, orientationFeeData);
      console.log(`📊 [SCHOOL] Response type:`, typeof orientationFeeData);
      console.log(`📊 [SCHOOL] Response keys:`, Object.keys(orientationFeeData || {}));
      
      // Extract fee from different possible response structures
      let fee = null;
      
      // Check if response has nested data structure
      if (orientationFeeData.data) {
        // Check for orientationFee property in data (SCHOOL API structure)
        if (typeof orientationFeeData.data === 'object' && orientationFeeData.data.orientationFee !== undefined) {
          fee = orientationFeeData.data.orientationFee;
        }
        // Check for fee property in data
        else if (typeof orientationFeeData.data === 'object' && orientationFeeData.data.fee !== undefined) {
          fee = orientationFeeData.data.fee;
        } 
        // Check if data itself is the fee (number or string)
        else if (typeof orientationFeeData.data === 'number' || typeof orientationFeeData.data === 'string') {
          fee = orientationFeeData.data;
        }
      }
      // Check if response has direct orientationFee property
      else if (orientationFeeData.orientationFee !== undefined) {
        fee = orientationFeeData.orientationFee;
      }
      // Check if response has direct fee property
      else if (orientationFeeData.fee !== undefined) {
        fee = orientationFeeData.fee;
      }
      // Check if response is a direct number or string
      else if (typeof orientationFeeData === 'number' || typeof orientationFeeData === 'string') {
        fee = orientationFeeData;
      }
      
      console.log(`🔍 [SCHOOL] Extracted fee value:`, fee, `(type: ${typeof fee})`);
      
      // If fee was found, format and set it
      if (fee !== null && fee !== undefined && fee !== "") {
        // Convert to number if it's a string
        const feeNumber = typeof fee === 'string' ? parseFloat(fee) : fee;
        
        if (!isNaN(feeNumber)) {
          // Format the fee using the same formatter as college version
          const formattedFee = formatFee(feeNumber);
          console.log(`🔧 [SCHOOL] Setting orientationFee in Formik:`, formattedFee, `(from raw: ${fee})`);
          setFieldValue("orientationFee", formattedFee, false);
          console.log(`✅ [SCHOOL] Auto-populated course fee: ${formattedFee} for orientationId: ${selectedOrientationId}`);
        } else {
          console.warn(`⚠️ [SCHOOL] Fee value is not a valid number:`, fee);
        }
      } else {
        console.warn(`⚠️ [SCHOOL] Fee not found in API response. Full response:`, JSON.stringify(orientationFeeData, null, 2));
      }
    }
  }, [orientationFeeData, selectedOrientationId, setFieldValue]);

  // Debug: Log orientationFee value changes
  useEffect(() => {
    if (values.orientationFee) {
      console.log(`🔍 [SCHOOL] Current Formik orientationFee value:`, values.orientationFee);
    }
  }, [values.orientationFee]);

  // Ensure IDs are stored when they're set directly (from auto-population)
  // This ensures IDs from overviewData are properly stored in Formik
  useEffect(() => {
    // If classId or joiningClassId is set but selectedClassId is not, sync it
    const classIdValue = values.classId || values.joiningClassId;
    if (classIdValue && classIdValue !== 0 && classIdValue !== null && Number(classIdValue) !== selectedClassId) {
      setSelectedClassId(Number(classIdValue));
      // Ensure both classId and joiningClassId are set
      if (values.classId && !values.joiningClassId) {
        setFieldValue("joiningClassId", values.classId);
      }
      if (values.joiningClassId && !values.classId) {
        setFieldValue("classId", values.joiningClassId);
      }
      console.log("✅ OrientationInfo: Synced selectedClassId from Formik values:", classIdValue);
    }

    // If orientationId is set but selectedOrientationId is not, sync it
    if (values.orientationId && values.orientationId !== 0 && values.orientationId !== null && Number(values.orientationId) !== selectedOrientationId) {
      setSelectedOrientationId(Number(values.orientationId));
      console.log("✅ OrientationInfo: Synced selectedOrientationId from Formik values:", values.orientationId);
    }

    // Ensure campusId and branchId are both set when one is set
    if (values.campusId && values.campusId !== 0 && values.campusId !== null && !values.branchId) {
      setFieldValue("branchId", values.campusId);
      console.log("✅ OrientationInfo: Set branchId from campusId:", values.campusId);
    }
    if (values.branchId && values.branchId !== 0 && values.branchId !== null && !values.campusId) {
      setFieldValue("campusId", values.branchId);
      console.log("✅ OrientationInfo: Set campusId from branchId:", values.branchId);
    }
  }, [values.classId, values.joiningClassId, values.orientationId, values.campusId, values.branchId, selectedClassId, selectedOrientationId, setFieldValue]);

  // Create field map with dynamic options
  const fieldMap = useMemo(() => {
    const map = orientationInfoFieldsForSchool.reduce((acc, f) => {
      let field = { ...f };
      
      // Set dynamic options for dropdowns
      if (f.name === "joiningClass") {
        field.options = classes.map(classLabel);
      } else if (f.name === "orientationName") {
        field.options = orientations.map(orientationLabel);
      } else if (f.name === "studentType") {
        field.options = studentTypes.map(studentTypeLabel);
      }
      
      acc[f.name] = field;
      return acc;
    }, {});
    return map;
  }, [classes, orientations, studentTypes]);

  // Handle field changes and store IDs
  const handleFieldChange = (fieldName, value) => {
    setFieldValue(fieldName, value);

    // Store IDs when dropdowns are selected
    if (fieldName === "joiningClass" && classNameToId.has(value)) {
      const id = classNameToId.get(value);
      setSelectedClassId(id);
      setFieldValue("classId", id);
      setFieldValue("joiningClassId", id);
      console.log(`✅ Stored classId: ${id} and joiningClassId: ${id} for joiningClass: ${value}`);
      
      // Reset child fields
      setFieldValue("orientationName", "");
      setFieldValue("studentType", "");
      setFieldValue("orientationId", null);
      setFieldValue("studentTypeId", null);
      setFieldValue("orientationFee", ""); // Reset fee when class changes
      setSelectedOrientationId(null);
    } else if (fieldName === "orientationName" && orientationNameToId.has(value)) {
      const id = orientationNameToId.get(value);
      setSelectedOrientationId(id);
      setFieldValue("orientationId", id);
      // Reset fee when orientation changes (will be auto-populated by API)
      setFieldValue("orientationFee", "");
      console.log(`✅ Stored orientationId: ${id} for orientationName: ${value}`);
    } else if (fieldName === "studentType" && studentTypeNameToId.has(value)) {
      const id = studentTypeNameToId.get(value);
      setFieldValue("studentTypeId", id);
      console.log(`✅ Stored studentTypeId: ${id} for studentType: ${value}`);
    }
  };

  // Sync IDs when labels are present but IDs are missing (for auto-populated data)
  // This runs after API data is loaded to ensure IDs are synced
  useEffect(() => {
    // Only sync if we have API data loaded
    if (classes.length === 0 && orientations.length === 0 && studentTypes.length === 0) {
      return; // Wait for API data to load
    }

    // Sync classId and joiningClassId from joiningClass label
    if (values.joiningClass && (!values.classId || values.classId === 0 || values.classId === null)) {
      // Try exact match first
      if (classNameToId.has(values.joiningClass)) {
        const id = classNameToId.get(values.joiningClass);
        setSelectedClassId(id);
        setFieldValue("classId", id);
        setFieldValue("joiningClassId", id);
        console.log(`🔄 Synced classId: ${id} for joiningClass: ${values.joiningClass}`);
      } else {
        // Try case-insensitive match
        const joiningClassUpper = String(values.joiningClass).toUpperCase().trim();
        for (const [key, id] of classNameToId.entries()) {
          if (String(key).toUpperCase().trim() === joiningClassUpper) {
            setSelectedClassId(id);
            setFieldValue("classId", id);
            setFieldValue("joiningClassId", id);
            console.log(`🔄 Synced classId (case-insensitive): ${id} for joiningClass: ${values.joiningClass}`);
            break;
          }
        }
      }
    }
    
    // Sync orientationId from orientationName label
    if (values.orientationName && (!values.orientationId || values.orientationId === 0 || values.orientationId === null)) {
      // Try exact match first
      if (orientationNameToId.has(values.orientationName)) {
        const id = orientationNameToId.get(values.orientationName);
        setSelectedOrientationId(id);
        setFieldValue("orientationId", id);
        console.log(`🔄 Synced orientationId: ${id} for orientationName: ${values.orientationName}`);
      } else {
        // Try case-insensitive match
        const orientationNameUpper = String(values.orientationName).toUpperCase().trim();
        for (const [key, id] of orientationNameToId.entries()) {
          if (String(key).toUpperCase().trim() === orientationNameUpper) {
            setSelectedOrientationId(id);
            setFieldValue("orientationId", id);
            console.log(`🔄 Synced orientationId (case-insensitive): ${id} for orientationName: ${values.orientationName}`);
            break;
          }
        }
      }
    }
    
    // Sync studentTypeId from studentType label
    if (values.studentType && (!values.studentTypeId || values.studentTypeId === 0 || values.studentTypeId === null)) {
      // Try exact match first
      if (studentTypeNameToId.has(values.studentType)) {
        const id = studentTypeNameToId.get(values.studentType);
        setFieldValue("studentTypeId", id);
        console.log(`🔄 Synced studentTypeId: ${id} for studentType: ${values.studentType}`);
      } else {
        // Try case-insensitive match
        const studentTypeUpper = String(values.studentType).toUpperCase().trim();
        for (const [key, id] of studentTypeNameToId.entries()) {
          if (String(key).toUpperCase().trim() === studentTypeUpper) {
            setFieldValue("studentTypeId", id);
            console.log(`🔄 Synced studentTypeId (case-insensitive): ${id} for studentType: ${values.studentType}`);
            break;
          }
        }
      }
    }
  }, [
    values.joiningClass, 
    values.classId, 
    values.joiningClassId,
    values.orientationName, 
    values.orientationId, 
    values.studentType, 
    values.studentTypeId, 
    classNameToId, 
    orientationNameToId, 
    studentTypeNameToId, 
    setFieldValue,
    classes.length,
    orientations.length,
    studentTypes.length
  ]);

  return (
    <div className={styles.clgAppSaleOrientationWrapper}>
      <div className={styles.clgAppSaleOrientationInfoTop}>
        <p className={styles.clgAppSaleOrientationHeading}>
          Orientation Information
        </p>
        <div className={styles.clgAppSalePersonalInfoSeperationLine}></div>
      </div>
 
      <div className={styles.clgAppSaleOrientationInfoBottom}>
        {orientationInfoFieldsLayoutForSchool.map((row) => (
          <div key={row.id} className={styles.clgAppSalerow}>
            {row.fields.map((fname, idx) => (
              <div key={idx} className={styles.clgAppSaleFieldCell}>
                {fname !== "" && renderField(fname, fieldMap, {
                  value: values[fname] ?? "",
                  onChange: (e) => handleFieldChange(fname, e.target.value)
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
 
export default OrientationInformationForSchool;
 
