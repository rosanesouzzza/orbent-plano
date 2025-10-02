import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import DashboardPage from "@/pages/DashboardPage";
import ReportsPage from "@/pages/ReportsPage";
import "./index.css";

export default function App() {
  return (
    <BrowserRouter>
      <nav className="navbar">
        <div>Orbent Action Plan</div>
        <div>
          <NavLink to="/" style={{ marginRight: 12 }}>Home</NavLink>
          <NavLink to="/dashboard" style={{ marginRight: 12 }}>Dashboard</NavLink>
          <NavLink to="/reports">Reports</NavLink>
        </div>
      </nav>

      <div className="app-shell">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
