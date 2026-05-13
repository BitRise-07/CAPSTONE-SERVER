import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { formatDate, formatMoney, getUserName } from "../utils/format";

const emptyAddress = {
  current: "",
  permanent: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
};

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const profile = user?.profile || {};
    setForm({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      image: user?.image || "",
      dob: profile.dob ? profile.dob.slice(0, 10) : "",
      gender: profile.gender || "",
      address: { ...emptyAddress, ...(profile.address || {}) },
    });
  }, [user]);

  if (!form) return <LoadingState label="Loading profile" />;

  function setAddress(field, value) {
    setForm((current) => ({
      ...current,
      address: { ...current.address, [field]: value },
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await api.post("/profile/editprofile", form);
      await refreshUser();
      setMessage("Profile updated successfully");
    } catch (error) {
      setMessage(error.response?.data?.message || "Profile update failed");
    } finally {
      setSaving(false);
    }
  }

  const behavior = user?.behavior || {};

  return (
    <div>
      <PageHeader
        eyebrow="Profile route"
        title="Profile & Behavior Baseline"
        description="Manage personal details and inspect the behavior profile that the fraud engine uses for comparison. Pending OTP and blocked transactions are excluded from this baseline."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={submit} className="panel rounded-lg p-5">
          <h2 className="mb-5 text-lg font-semibold">Profile Details</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              First name
              <input
                className="field mt-1"
                value={form.firstName}
                onChange={(event) => setForm({ ...form, firstName: event.target.value })}
              />
            </label>
            <label className="text-sm">
              Last name
              <input
                className="field mt-1"
                value={form.lastName}
                onChange={(event) => setForm({ ...form, lastName: event.target.value })}
              />
            </label>
            <label className="text-sm">
              Date of birth
              <input
                className="field mt-1"
                type="date"
                value={form.dob}
                onChange={(event) => setForm({ ...form, dob: event.target.value })}
              />
            </label>
            <label className="text-sm">
              Gender
              <select
                className="field mt-1"
                value={form.gender}
                onChange={(event) => setForm({ ...form, gender: event.target.value })}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="text-sm md:col-span-2">
              Image URL
              <input
                className="field mt-1"
                value={form.image}
                onChange={(event) => setForm({ ...form, image: event.target.value })}
              />
            </label>
            <label className="text-sm md:col-span-2">
              Current address
              <input
                className="field mt-1"
                value={form.address.current}
                onChange={(event) => setAddress("current", event.target.value)}
              />
            </label>
            <label className="text-sm">
              City
              <input
                className="field mt-1"
                value={form.address.city}
                onChange={(event) => setAddress("city", event.target.value)}
              />
            </label>
            <label className="text-sm">
              State
              <input
                className="field mt-1"
                value={form.address.state}
                onChange={(event) => setAddress("state", event.target.value)}
              />
            </label>
            <label className="text-sm">
              Country
              <input
                className="field mt-1"
                value={form.address.country}
                onChange={(event) => setAddress("country", event.target.value)}
              />
            </label>
            <label className="text-sm">
              Pincode
              <input
                className="field mt-1"
                value={form.address.pincode}
                onChange={(event) => setAddress("pincode", event.target.value)}
              />
            </label>
          </div>

          {message && <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">{message}</p>}

          <button className="btn btn-primary mt-5" disabled={saving}>
            <Save size={16} /> Save profile
          </button>
        </form>

        <div className="space-y-6">
          <div className="panel rounded-lg p-5">
            <div className="flex items-center gap-4">
              {user?.image && (
                <img
                  alt={getUserName(user)}
                  src={user.image}
                  className="h-16 w-16 rounded-lg border border-slate-200 bg-white object-cover dark:border-slate-800"
                />
              )}
              <div>
                <p className="text-xl font-bold">{getUserName(user)}</p>
                <p className="text-sm text-slate-500">{user?.email}</p>
                <p className="mt-1 text-xs uppercase text-slate-500">{user?.accountType}</p>
              </div>
            </div>
          </div>

          <div className="panel rounded-lg p-5">
            <h2 className="mb-4 text-lg font-semibold">Behavior Learning</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-md bg-slate-50 p-4 dark:bg-slate-900">
                <p className="text-xs text-slate-500">Approved baseline count</p>
                <p className="mt-1 text-2xl font-bold">{behavior.transactionCount || 0}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-4 dark:bg-slate-900">
                <p className="text-xs text-slate-500">Average amount</p>
                <p className="mt-1 text-2xl font-bold">{formatMoney(behavior.avgAmount)}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-4 dark:bg-slate-900">
                <p className="text-xs text-slate-500">Maximum approved amount</p>
                <p className="mt-1 text-2xl font-bold">{formatMoney(behavior.maxAmount)}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-4 dark:bg-slate-900">
                <p className="text-xs text-slate-500">Last approved transaction</p>
                <p className="mt-1 text-2xl font-bold">{formatDate(behavior.lastTransactionAt)}</p>
              </div>
            </div>
          </div>

          <div className="panel rounded-lg p-5">
            <h2 className="mb-4 text-lg font-semibold">Known Patterns</h2>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-semibold">Devices</p>
                <div className="flex flex-wrap gap-2">
                  {(behavior.commonDevices || []).length ? (
                    behavior.commonDevices.map((device) => (
                      <span key={device} className="rounded border border-slate-200 px-2 py-1 text-xs dark:border-slate-700">
                        {device}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">No approved device history yet</span>
                  )}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold">Locations</p>
                <div className="flex flex-wrap gap-2">
                  {(behavior.commonLocations || []).length ? (
                    behavior.commonLocations.map((city) => (
                      <span key={city} className="rounded border border-slate-200 px-2 py-1 text-xs dark:border-slate-700">
                        {city}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">No approved location history yet</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
