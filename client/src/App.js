import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Overview from "./components/Overview";
import SignIn from "./components/SignIn";
import Form from "./components/Form";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/overview" element={<Overview />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/form" element={<Form />} />
          <Route path="/" element={<Navigate replace to="/overview" />} />
          <Route path="*" element={<Navigate to="/overview" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
