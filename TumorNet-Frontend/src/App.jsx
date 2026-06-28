import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Dashboard, { ProtectedLayout, ProtectedPlaceholder } from "./pages/Dashboard";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UploadPage from "./pages/UploadPage";
import Profile from "./pages/Profile";
import ReportsPage from "./pages/ReportsPage";

export default function App(){
  return <BrowserRouter><ToastProvider><AuthProvider><Routes>
    <Route path="/" element={<Landing/>}/><Route path="/login" element={<Login/>}/><Route path="/register" element={<Register/>}/>
    <Route element={<ProtectedRoute/>}><Route element={<ProtectedLayout/>}>
      <Route path="/dashboard" element={<Dashboard/>}/>
      <Route path="/upload" element={<UploadPage/>}/>
      <Route path="/prediction" element={<ProtectedPlaceholder title="Prediction Result" description="Protected prediction results will appear here."/>}/>
      <Route path="/reports" element={<ReportsPage/>}/>
      <Route path="/profile" element={<Profile/>}/>
      <Route path="/settings" element={<ProtectedPlaceholder title="Settings" description="Your protected account settings will appear here."/>}/>
    </Route></Route>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></AuthProvider></ToastProvider></BrowserRouter>;
}
