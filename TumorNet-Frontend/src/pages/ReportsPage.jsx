import { useEffect, useState } from "react";
import { Eye, FileText, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

async function readJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("Reports service is not ready. Please restart the Flask backend and try again.");
  }
  return response.json();
}

export default function ReportsPage() {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadReports = async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`http://127.0.0.1:5050/api/users/${currentUser.id}/reports`);
      const data = await readJsonResponse(response);

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Unable to load reports");
      }

      setReports(data.reports || []);
    } catch (error) {
      setMessage(error.message || "Unable to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [currentUser?.id]);

  const viewReport = (report) => {
    if (!report.pdf_data) {
      setMessage("PDF data not available for this report.");
      return;
    }

    const reportWindow = window.open();
    if (reportWindow) {
      reportWindow.document.write(
        `<iframe src="${report.pdf_data}" title="${report.title}" style="border:0;width:100%;height:100vh;"></iframe>`
      );
      reportWindow.document.title = report.title;
      reportWindow.document.close();
    }
  };

  const deleteReport = async (report) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${report.title}"?`);
    if (!confirmed) return;

    try {
      const response = await fetch(
        `http://127.0.0.1:5050/api/users/${currentUser.id}/reports/${report.id}`,
        { method: "DELETE" }
      );
      const data = await readJsonResponse(response);

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Unable to delete report");
      }

      setReports((existingReports) => existingReports.filter((item) => item.id !== report.id));
      setMessage("Report deleted successfully.");
    } catch (error) {
      setMessage(error.message || "Unable to delete report");
    }
  };

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <span>Saved Medical Reports</span>
          <h1>Reports</h1>
          <p>All MRI analysis reports generated from your TumorNet account are listed here.</p>
        </div>
        <div className="reports-count">
          <FileText />
          <b>{reports.length}</b>
          <small>Total Reports</small>
        </div>
      </div>

      {message && <p className="reports-message">{message}</p>}

      <div className="reports-table-card">
        {loading ? (
          <div className="reports-empty">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="reports-empty">
            <FileText />
            <h2>No reports found</h2>
            <p>Download a report after MRI analysis and it will appear here.</p>
          </div>
        ) : (
          <table className="reports-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Detected Type</th>
                <th>Analysis Date</th>
                <th>View</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>
                    <b>{report.title}</b>
                    <small>Report ID: TN-{report.id}</small>
                  </td>
                  <td>{report.detected_type}</td>
                  <td>{report.analysis_date}</td>
                  <td>
                    <button className="report-view-btn" onClick={() => viewReport(report)}>
                      <Eye /> View
                    </button>
                  </td>
                  <td>
                    <button className="report-delete-btn" onClick={() => deleteReport(report)}>
                      <Trash2 /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
