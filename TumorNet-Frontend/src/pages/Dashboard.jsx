import API from "../services/api";
import { createElement, useEffect, useMemo, useState } from "react";
import { Activity, BrainCircuit, Clock, FileText, LayoutDashboard, LogOut, ScanLine, Upload, User } from "lucide-react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const links=[[LayoutDashboard,"Dashboard","/dashboard"],[Upload,"Upload MRI","/upload"],[FileText,"Reports","/reports"],[User,"Profile","/profile"]];
const chartColors=["#2563eb","#16a34a","#dc2626","#7c3aed","#f59e0b","#0891b2"];
export function ProtectedLayout(){
  const {currentUser,logout}=useAuth(),{notify}=useToast(),navigate=useNavigate();
  const { pathname } = useLocation();
  const pageTitle = pathname === "/upload" ? "Prediction Result" : `Welcome, ${currentUser?.full_name?.split(" ")[0]}`;
  const signOut=async()=>{await logout();notify("Logout successful");navigate("/")};
  return <div className="app-shell"><aside className="app-sidebar"><Link className="app-logo" to="/"><BrainCircuit/><b>TumorNet</b></Link><nav>{links.map(([Icon,label,to])=><NavLink key={to} to={to}>{createElement(Icon)}{label}</NavLink>)}</nav><button onClick={signOut}><LogOut/>Logout</button></aside><main className="app-main"><header><div>{pathname !== "/upload" && <small>TUMORNET WORKSPACE</small>}<h2>{pageTitle}</h2></div><Link className="user-pill" to="/profile"><span>{currentUser?.full_name?.split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase()}</span><div><b>{currentUser?.full_name}</b><small>{currentUser?.email}</small></div></Link></header><Outlet/></main></div>;
}
export default function Dashboard(){
  const { currentUser } = useAuth();
  const [reports, setReports] = useState([]);

  useEffect(() => {
    if (!currentUser?.id) return;
    fetch(`${API}/api/users/${currentUser.id}/reports`)
      .then((response) => response.ok ? response.json() : { reports: [] })
      .then((data) => setReports(data.reports || []))
      .catch(() => setReports([]));
  }, [currentUser?.id]);

  const summary = useMemo(() => {
    const tumorReports = reports.filter((report) => !/no tumor/i.test(report.detected_type || ""));
    const typeCounts = reports.reduce((counts, report) => {
      const type = report.detected_type || "Unknown";
      counts[type] = (counts[type] || 0) + 1;
      return counts;
    }, {});
    let start = 0;
    const typeRows = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
    const pieSegments = typeRows.map(([type, count], index) => {
      const end = start + (reports.length ? (count / reports.length) * 100 : 0);
      const segment = `${chartColors[index % chartColors.length]} ${start}% ${end}%`;
      start = end;
      return { type, count, color: chartColors[index % chartColors.length], segment };
    });
    return {
      tumorReports,
      normalReports: reports.length - tumorReports.length,
      typeRows,
      pieSegments,
      latest: reports[0],
    };
  }, [reports]);

  return <div className="dashboard-content">
    <section className="dashboard-hero">
      <div>
        <small>CLINICAL WORKSPACE</small>
        <h1>Welcome back, {currentUser?.full_name?.split(" ")[0] || "User"}</h1>
        <p>Track MRI analysis history, review detected tumor types, and continue new AI-assisted scans from one clean workspace.</p>
      </div>
      <Link className="dashboard-primary" to="/upload"><Upload/>New MRI Analysis</Link>
    </section>

    <div className="dashboard-stats">
      <article><FileText/><span>Total Reports</span><b>{reports.length}</b></article>
      <article><BrainCircuit/><span>Tumor Detected</span><b>{summary.tumorReports.length}</b></article>
      <article><Activity/><span>No Tumor</span><b>{summary.normalReports}</b></article>
      <article><Clock/><span>Latest Report</span><b>{summary.latest?.analysis_date || "No records"}</b></article>
    </div>

    <div className="dashboard-panels">
      <section className="dashboard-panel">
        <div className="panel-head"><h3>Detection Types</h3><Link to="/reports">View all</Link></div>
        {summary.typeRows.length ? summary.typeRows.map(([type, count]) => (
          <div className="type-row" key={type}>
            <span>{type}</span>
            <div><i style={{ width: `${Math.max(14, (count / reports.length) * 100)}%` }} /></div>
            <b>{count}</b>
          </div>
        )) : <p className="empty-dashboard">No reports yet. Upload an MRI scan to start building patient records.</p>}
      </section>

      <section className="dashboard-panel">
        <div className="panel-head"><h3>Detection Chart</h3><Link to="/reports">Reports</Link></div>
        {summary.pieSegments.length ? <div className="dashboard-chart">
          <div className="pie-chart" style={{ background: `conic-gradient(${summary.pieSegments.map((item) => item.segment).join(", ")})` }}><span>{reports.length}</span></div>
          <div className="chart-legend">
            {summary.pieSegments.map((item) => (
              <div key={item.type}><i style={{ background: item.color }} /><span>{item.type}</span><b>{item.count}</b></div>
            ))}
          </div>
        </div> : <p className="empty-dashboard">Detected type chart will appear after your first saved report.</p>}
      </section>
    </div>
  </div>;
}
export function ProtectedPlaceholder({title,description}){
  return <div className="placeholder"><ScanLine/><h1>{title}</h1><p>{description}</p></div>;
}
