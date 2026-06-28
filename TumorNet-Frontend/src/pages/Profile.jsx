import { useEffect, useState } from "react";
import { Mail, Pencil, Save, ShieldCheck, UserRound, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { currentUser, updateCurrentUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    full_name: currentUser?.full_name || "",
    username: currentUser?.username || "",
    email: currentUser?.email || "",
  });

  useEffect(() => {
    if (!currentUser?.id) return;

    fetch(`http://127.0.0.1:5050/api/users/${currentUser.id}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success && data.user) {
          updateCurrentUser(data.user);
          setForm({
            full_name: data.user.full_name || "",
            username: data.user.username || "",
            email: data.user.email || "",
          });
        }
      })
      .catch(() => {});
  }, [currentUser?.id]);

  const initials = form.full_name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const reset = () => {
    setForm({
      full_name: currentUser?.full_name || "",
      username: currentUser?.username || "",
      email: currentUser?.email || "",
    });
    setEditing(false);
    setError("");
    setMessage("");
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`http://127.0.0.1:5050/api/users/${currentUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update profile");
      }

      updateCurrentUser(data.user);
      setForm(data.user);
      setEditing(false);
      setMessage("Profile updated successfully.");
    } catch (profileError) {
      setError(profileError.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <section className="profile-hero">
        <div className="profile-avatar">{initials || "TN"}</div>
        <div>
          <small>ACCOUNT PROFILE</small>
          <h1>{form.full_name || "TumorNet User"}</h1>
          <p>Your saved registration details are used across TumorNet reports and workspace actions.</p>
        </div>
      </section>

      <section className="profile-card">
        <header>
          <div>
            <h2>Personal Details</h2>
            <p>Information collected during account creation.</p>
          </div>
          {!editing && <button className="profile-edit" onClick={() => setEditing(true)}><Pencil />Edit Details</button>}
        </header>

        <form onSubmit={save}>
          <div className="profile-grid">
            <label>
              <span><UserRound />Full Name</span>
              <input
                value={form.full_name}
                disabled={!editing}
                onChange={(event) => setForm((prev) => ({ ...prev, full_name: event.target.value }))}
              />
            </label>
            <label>
              <span><ShieldCheck />Username</span>
              <input
                value={form.username}
                disabled={!editing}
                onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
              />
            </label>
            <label>
              <span><Mail />Email Address</span>
              <input
                type="email"
                value={form.email}
                disabled={!editing}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              />
            </label>
          </div>

          {editing && (
            <div className="profile-actions">
              <button type="submit" className="profile-save" disabled={saving}><Save />{saving ? "Saving..." : "Save Changes"}</button>
              <button type="button" className="profile-cancel" onClick={reset}><X />Cancel</button>
            </div>
          )}
        </form>

        {message && <p className="profile-message">{message}</p>}
        {error && <p className="profile-error">{error}</p>}
      </section>
    </div>
  );
}
