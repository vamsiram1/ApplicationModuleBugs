import React from 'react'
import PaymentPopup from '../../../../widgets/PaymentPopup/whole-payment-popup/PaymentPopup.jsx';
 
const CollegePaymentPopup = ({ onClose, formData, academicFormData, detailsObject, applicationDetailsData, onSuccess }) => {
  return (
    <PaymentPopup
      onClose={onClose}
      title="Complete Application Confirmation"
      type="college"
      collegeFormData={formData}
      collegeAcademicFormData={academicFormData}
      detailsObject={detailsObject}
      applicationDetailsData={applicationDetailsData}
      isConfirmation={true}
      onSuccess={onSuccess}
    />
  );
}
 
export default CollegePaymentPopup