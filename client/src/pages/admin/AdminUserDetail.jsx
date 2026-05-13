import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import LoadingState from "../../components/LoadingState";
import MetricCard from "../../components/MetricCard";
import PageHeader from "../../components/PageHeader";
import RiskBadge from "../../components/RiskBadge";
import api from "../../services/api";
import { formatDate, formatMoney, getUserName, percent } from "../../utils/format";

export default function AdminUserDetail() {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/admin/users/${userId}`)
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <LoadingState label="Loading user detail" />;

  const user = data?.user;
  const summary = data?.summary || {};
  const behavior = user?.behavior || {};

  return (
    <div>
      <PageHeader
        eyebrow="Admin route"
        title={getUserName(user)}
        description={user?.email}
      />

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Transactions" value={summary.totalTransactions || 0} />
        <MetricCard label="Fraud" value={summary.fraud || 0} tone="text-coral" />
        <MetricCard label="OTP" value={summary.otp || 0} tone="text-amber" />
        <MetricCard label="Legit" value={summary.legit || 0} tone="text-mint" />
        <MetricCard label="Avg Risk" value={percent(summary.avgRisk)} tone="text-steel" />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="panel rounded-lg p-4">
          <h2 className="mb-4 text-lg font-semibold">User Risk Timeline</h2>
          <ResponsiveContainer width="100%" height={310}>
            <AreaChart
              data={(data?.graphs?.riskTrend || []).map((row, index) => ({
                ...row,
                index: index + 1,
                label: formatDate(row.time),
              }))}
            >
              <defs>
                <linearGradient id="userRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a085" stopOpacity={0.42} />
                  <stop offset="95%" stopColor="#16a085" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
              <XAxis dataKey="index" />
              <YAxis domain={[0, 1]} tickFormatter={(value) => `${Math.round(value * 100)}%`} />
              <Tooltip formatter={(value, name) => [percent(value), name]} labelFormatter={(_, payload) => payload?.[0]?.payload?.label || ""} />
              <Area dataKey="risk" stroke="#16a085" fill="url(#userRisk)" strokeWidth={2} />
              <Area dataKey="rule" stroke="#f9735b" fill="transparent" strokeWidth={1.5} />
              <Area dataKey="anomaly" stroke="#54748b" fill="transparent" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="panel rounded-lg p-4">
          <h2 className="mb-4 text-lg font-semibold">City Breakdown</h2>
          <ResponsiveContainer width="100%" height={310}>
            <BarChart data={data?.graphs?.cityBreakdown || []}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
              <XAxis dataKey="city" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="fraud" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <div className="panel rounded-lg p-5">
          <h2 className="mb-4 text-lg font-semibold">Behavior Baseline</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-900">
              <p className="text-xs text-slate-500">Approved count</p>
              <p className="mt-1 text-xl font-bold">{behavior.transactionCount || 0}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-900">
              <p className="text-xs text-slate-500">Avg amount</p>
              <p className="mt-1 text-xl font-bold">{formatMoney(behavior.avgAmount)}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-900">
              <p className="text-xs text-slate-500">Known devices</p>
              <p className="mt-1 text-xl font-bold">{behavior.commonDevices?.length || 0}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-900">
              <p className="text-xs text-slate-500">Known locations</p>
              <p className="mt-1 text-xl font-bold">{behavior.commonLocations?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="panel rounded-lg p-5">
          <h2 className="mb-4 text-lg font-semibold">Fraud Reasons</h2>
          <div className="space-y-2">
            {(data?.fraudReasons || []).length ? (
              data.fraudReasons.map((row) => (
                <div key={row.reason} className="flex items-center justify-between rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-900">
                  <span>{row.reason}</span>
                  <span className="font-semibold">{row.count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No fraud reasons recorded.</p>
            )}
          </div>
        </div>
      </div>

      <div className="panel overflow-hidden rounded-lg">
        <div className="border-b border-slate-200 p-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold">Last 200 Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">Merchant</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Device</th>
                <th className="p-3">City</th>
                <th className="p-3">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
              {(data?.transactions || []).map((tx) => (
                <tr key={tx._id}>
                  <td className="p-3">{formatDate(tx.createdAt)}</td>
                  <td className="p-3">{tx.merchant || "-"}</td>
                  <td className="p-3">{formatMoney(tx.amount)}</td>
                  <td className="p-3">{tx.deviceId}</td>
                  <td className="p-3">{tx.location?.city || "Unknown"}</td>
                  <td className="p-3">
                    <RiskBadge decision={tx.decision} risk={tx.scores?.risk} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
