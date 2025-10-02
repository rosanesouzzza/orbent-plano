// src/App.tsx
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import DashboardPage from "@/pages/DashboardPage";
import ReportsPage from "@/pages/ReportsPage";

export default function App() {
  return (
    <BrowserRouter>
      <nav className="navbar">
        <div><b>Orbent Action Plan</b></div>
        <div>
          <Link to="/">Home</Link>
          <Link to="/dashboard" style={{ marginLeft: 12 }}>Dashboard</Link>
          <Link to="/reports" style={{ marginLeft: 12 }}>Reports</Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
