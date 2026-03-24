import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./Pages/LandingPage";
import LoginPage from "./Pages/LoginPage";
import PatientFormPage from "./Pages/PatientFormPage";
import OtpVerify from "./Pages/OtpVerify";
import WelcomePage from "./Pages/WelcomePage";
import ForgotPassword from "./Pages/ForgotPassword";
import DoctorRegister from "./Pages/DoctorRegister";
import SetPassword from "./Pages/SetPassword";
import ResetPassword from "./Pages/ResetPassword";
import PatientWelcomePage from "./Pages/PatientWelcomePage";
import PatientDetails from "./Pages/PatientDetails";
import DoctorWelcomePage from "./Pages/DoctorWelcomePage";
import DoctorPatientDetails from "./Pages/DoctorPatientDetails";
import PatientHealthRiskPage from "./Pages/PatientHealthRiskPage";
import ChatBot from "./components/ChatBot";
import AdminLogin from "./Pages/AdminLogin";
import AdminDashboard from "./Pages/AdminDashboard";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register/patient" element={<PatientFormPage />} />
        <Route path="/register/doctor" element={<DoctorRegister />} />
         <Route path="/OtpVerify" element={<OtpVerify />} />
         <Route path="/welcome" element={<WelcomePage />} />
         <Route path="/patient-welcome" element={<PatientWelcomePage />} />
          <Route path="/patientdetails" element={<PatientDetails />} />
          <Route path="/patient-health-risk" element={<PatientHealthRiskPage />} />
          <Route path="/doctor-welcome" element={<DoctorWelcomePage />} />
          <Route path="/doctor/patient-details" element={<DoctorPatientDetails />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register/password" element={<SetPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
      
      </Routes>
      <ChatBot />
    </BrowserRouter>
  );
}

export default App;
