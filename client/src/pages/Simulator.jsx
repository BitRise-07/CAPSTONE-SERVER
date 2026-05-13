import { CheckCircle2, KeyRound, Send, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PageHeader from "../components/PageHeader";
import RiskBadge from "../components/RiskBadge";
import api from "../services/api";
import { formatMoney, percent } from "../utils/format";

const defaults = {
  amount: 1250,
  merchant: "Nova Electronics",
  category: "electronics",
  channel: "mobile",
  accountId: "savings-001",
  deviceId: "ios-device-01",
  location: { latitude: 19.076, longitude: 72.8777 },
};

export default function Simulator() {
  const [form, setForm] = useState(defaults);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [otpModal, setOtpModal] = useState(null);
  const [otp, setOtp] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);

  const scoreBars = useMemo(() => {
    if (!result?.scores) return [];
    return Object.entries(result.scores)
      .filter(([key]) => key !== "graph")
      .map(([name, value]) => ({
        name: name.toUpperCase(),
        value: Number(value || 0),
      }));
  }, [result]);

  function setLocation(field, value) {
    setForm({
      ...form,
      location: {
        ...form.location,
        [field]: Number(value),
      },
    });
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setOtpMessage("");
    try {
      const { data } = await api.post("/transaction/create-transaction", form);
      setResult(data.transaction);
      if (data.otpRequired || data.transaction?.decision === "otp") {
        setOtpModal(data.transaction);
      }
    } finally {
      setLoading(false);
    }
  }

  async function sendTransactionOtp() {
    if (!otpModal?._id) return;
    setOtpSending(true);
    setOtpMessage("");
    try {
      const { data } = await api.post(`/transaction/${otpModal._id}/send-otp`);
      setOtpMessage(
        data.otp
          ? `OTP sent. Dev OTP: ${data.otp}`
          : data.message || "OTP sent successfully",
      );
    } catch (error) {
      setOtpMessage(error.response?.data?.message || "Could not send OTP");
    } finally {
      setOtpSending(false);
    }
  }

  async function verifyTransactionOtp(event) {
    event.preventDefault();
    if (!otpModal?._id) return;
    setOtpVerifying(true);
    setOtpMessage("");
    try {
      const { data } = await api.post(`/transaction/${otpModal._id}/verify-otp`, {
        otp,
      });
      setResult(data.transaction);
      setOtp("");
      setOtpModal(null);
      setOtpMessage("");
    } catch (error) {
      setOtpMessage(error.response?.data?.message || "OTP verification failed");
    } finally {
      setOtpVerifying(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Transaction route"
        title="Transaction Simulator"
        description="Create realistic transactions and see how rules, anomaly scoring, ML probability, OTP, and blocking decisions combine."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form onSubmit={submit} className="panel rounded-lg p-5">
          <h2 className="mb-5 text-lg font-semibold">New Transaction</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              Amount
              <input
                className="field mt-1"
                type="number"
                min="1"
                value={form.amount}
                onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })}
              />
            </label>

            <label className="text-sm">
              Merchant
              <input
                className="field mt-1"
                value={form.merchant}
                onChange={(event) => setForm({ ...form, merchant: event.target.value })}
              />
            </label>

            <label className="text-sm">
              Category
              <select
                className="field mt-1"
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
              >
                <option value="electronics">Electronics</option>
                <option value="grocery">Grocery</option>
                <option value="travel">Travel</option>
                <option value="fuel">Fuel</option>
                <option value="general">General</option>
              </select>
            </label>

            <label className="text-sm">
              Channel
              <select
                className="field mt-1"
                value={form.channel}
                onChange={(event) => setForm({ ...form, channel: event.target.value })}
              >
                <option value="card">Card</option>
                <option value="web">Web</option>
                <option value="mobile">Mobile</option>
                <option value="atm">ATM</option>
              </select>
            </label>

            <label className="text-sm md:col-span-2">
              Account ID
              <input
                className="field mt-1"
                value={form.accountId}
                onChange={(event) => setForm({ ...form, accountId: event.target.value })}
              />
            </label>

            <label className="text-sm md:col-span-2">
              Device ID
              <input
                className="field mt-1"
                value={form.deviceId}
                onChange={(event) => setForm({ ...form, deviceId: event.target.value })}
              />
            </label>

            <label className="text-sm">
              Latitude
              <input
                className="field mt-1"
                type="number"
                step="0.0001"
                value={form.location.latitude}
                onChange={(event) => setLocation("latitude", event.target.value)}
              />
            </label>

            <label className="text-sm">
              Longitude
              <input
                className="field mt-1"
                type="number"
                step="0.0001"
                value={form.location.longitude}
                onChange={(event) => setLocation("longitude", event.target.value)}
              />
            </label>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              className="btn btn-muted"
              onClick={() => setForm({ ...defaults, amount: 950, deviceId: "ios-device-01" })}
            >
              Normal
            </button>
            <button
              type="button"
              className="btn btn-muted"
              onClick={() => setForm({ ...defaults, amount: 42000, deviceId: "new-laptop-77" })}
            >
              OTP risk
            </button>
            <button
              type="button"
              className="btn btn-muted"
              onClick={() =>
                setForm({
                  ...defaults,
                  amount: 98000,
                  merchant: "Overseas Transfer",
                  channel: "web",
                  deviceId: "unknown-device-91",
                  location: { latitude: 28.6139, longitude: 77.209 },
                })
              }
            >
              High risk
            </button>
          </div>

          <button className="btn btn-primary mt-5 w-full" disabled={loading}>
            <Send size={16} /> Evaluate Transaction
          </button>
        </form>

        <div className="panel rounded-lg p-5">
          <h2 className="mb-5 text-lg font-semibold">Decision Engine</h2>

          {result ? (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-slate-500">Final status</p>
                  <p className="mt-1 text-2xl font-bold capitalize">
                    {String(result.status || "-").replace("_", " ")}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatMoney(result.amount)} at {result.merchant || "Unknown merchant"}
                  </p>
                </div>
                <RiskBadge decision={result.decision} risk={result.scores?.risk} />
              </div>

              {result.decision === "otp" && result.status === "pending_otp" && (
                <button className="btn btn-primary" onClick={() => setOtpModal(result)}>
                  <KeyRound size={16} /> Verify OTP
                </button>
              )}

              {scoreBars.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-semibold">Score Breakdown</p>
                    <span className="text-sm text-slate-500">
                      Risk {percent(result.scores?.risk)}
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={scoreBars}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 1]} tickFormatter={(value) => `${Math.round(value * 100)}%`} />
                      <Tooltip formatter={(value) => percent(value)} />
                      <Bar dataKey="value" fill="#16a085" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {result.adaptivePolicy && (
                <div className="rounded-lg border border-slate-200 p-4 text-sm dark:border-slate-800">
                  <p className="mb-3 font-semibold">Adaptive Policy</p>
                  <div className="grid gap-3 md:grid-cols-3">
                    <span>OTP threshold {percent(result.adaptivePolicy.otpThreshold)}</span>
                    <span>Block threshold {percent(result.adaptivePolicy.blockThreshold)}</span>
                    <span>Profile confidence {percent(result.adaptivePolicy.profileConfidence)}</span>
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2 font-semibold">Why this happened</p>
                <p className="text-sm text-slate-500">
                  {result.explanation?.message || result.explanation?.reason || "No explanation returned."}
                </p>
                <div className="mt-4 space-y-2">
                  {(result.explanation?.rules || []).map((item) => (
                    <div key={`${item.name}-${item.reason}`} className="rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-900">
                      <div className="flex justify-between gap-3">
                        <span className="font-semibold capitalize">{item.name}</span>
                        <span className="text-coral">{item.level}</span>
                      </div>
                      <p className="mt-1 text-slate-500">{item.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid h-[420px] place-items-center rounded-lg bg-slate-50 text-sm text-slate-500 dark:bg-slate-900">
              Awaiting transaction
            </div>
          )}
        </div>
      </div>

      {otpModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4">
          <form onSubmit={verifyTransactionOtp} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">OTP Verification</p>
                <p className="mt-1 text-sm text-slate-500">
                  This transaction will update behavior history only after OTP approval.
                </p>
              </div>
              <button type="button" className="btn btn-muted px-2" onClick={() => setOtpModal(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="mb-4 rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-900">
              <div className="flex justify-between">
                <span>{otpModal.merchant}</span>
                <span className="font-semibold">{formatMoney(otpModal.amount)}</span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-muted w-full"
              onClick={sendTransactionOtp}
              disabled={otpSending}
            >
              <KeyRound size={16} /> Send OTP
            </button>

            <label className="mt-4 block text-sm">
              Enter OTP
              <input
                className="field mt-1"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="6 digit code"
              />
            </label>

            {otpMessage && <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">{otpMessage}</p>}

            <button className="btn btn-primary mt-4 w-full" disabled={otpVerifying || otp.length < 4}>
              <CheckCircle2 size={16} /> Verify and approve
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
