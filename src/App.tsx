import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./Pages/LandingPage";
import LoginPage from "./Pages/LoginPage";
import PatientFormPage from "./Pages/PatientFormPage";
import OtpVerify from "./Pages/OtpVerify";
import WelcomePage from "./Pages/WelcomePage";
import ForgotPassword from "./Pages/ForgotPassword";
import DoctorRegister from "./Pages/DoctorRegister";
import SetPassword from "./Pages/SetPassword";



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
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register/password" element={<SetPassword />} />
      
      </Routes>
    </BrowserRouter>
  );
}

export default App;
