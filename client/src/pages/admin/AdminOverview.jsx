import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
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

const riskColors = {
  low: "#16a085",
  medium: "#f3b33d",
  high: "#f9735b",
  block: "#ef4444",
};

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/overview")
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false));
  }, []);

  const riskDistribution = useMemo(
    () =>
      Object.entries(data?.graphs?.riskDistribution || {}).map(([name, value]) => ({
        name: name.toUpperCase(),
        value,
        color: riskColors[name],
      })),
    [data],
  );

  if (loading) return <LoadingState label="Loading admin overview" />;

  const totals = data?.totals || {};

  return (
    <div>
      <PageHeader
        eyebrow="Admin route"
        title="Admin Fraud Operations"
        description="Monitor global fraud pressure, risk distribution, user exposure, and recent blocked events."
      />

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Transactions" value={totals.totalTransactions || 0} />
        <MetricCard label="Fraud" value={totals.totalFraud || 0} tone="text-coral" />
        <MetricCard label="Approved" value={totals.approved || 0} tone="text-mint" />
        <MetricCard label="OTP" value={totals.otp || 0} tone="text-amber" />
        <MetricCard label="Blocked" value={totals.blocked || 0} tone="text-red-500" />
        <MetricCard label="Avg Risk" value={percent(totals.avgRisk)} tone="text-steel" />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="panel rounded-lg p-4">
          <h2 className="mb-4 text-lg font-semibold">Recent Risk Trend</h2>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart
              data={(data?.graphs?.recentRiskTrend || []).map((row, index) => ({
                ...row,
                index: index + 1,
                label: formatDate(row.time),
              }))}
            >
              <defs>
                <linearGradient id="adminRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#54748b" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#54748b" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
              <XAxis dataKey="index" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 1]} tickFormatter={(value) => `${Math.round(value * 100)}%`} />
              <Tooltip
                formatter={(value, name) => [percent(value), name]}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.label || ""}
              />
              <Area type="monotone" dataKey="risk" stroke="#54748b" fill="url(#adminRisk)" strokeWidth={2} />
              <Area type="monotone" dataKey="ml" stroke="#16a085" fill="transparent" strokeWidth={1.5} />
              <Area type="monotone" dataKey="rule" stroke="#f9735b" fill="transparent" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="panel rounded-lg p-4">
          <h2 className="mb-4 text-lg font-semibold">Risk Distribution</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={riskDistribution} dataKey="value" nameKey="name" innerRadius={54} outerRadius={90} paddingAngle={4}>
                {riskDistribution.map((row) => (
                  <Cell key={row.name} fill={row.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {riskDistribution.map((row) => (
              <div key={row.name} className="flex items-center justify-between rounded-md bg-slate-50 p-2 dark:bg-slate-900">
                <span>{row.name}</span>
                <span className="font-semibold">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <div className="panel rounded-lg p-4">
          <h2 className="mb-4 text-lg font-semibold">Fraud by Hour</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data?.graphs?.fraudByHour || []}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
              <XAxis dataKey="hour" tickFormatter={(hour) => `${hour}:00`} />
              <YAxis />
              <Tooltip labelFormatter={(hour) => `${hour}:00`} />
              <Bar dataKey="total" name="Total" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="fraud" name="Fraud" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel rounded-lg p-4">
          <h2 className="mb-4 text-lg font-semibold">Fraud Hotspots</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={(data?.graphs?.fraudByCity || []).slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
              <XAxis dataKey="city" />
              <YAxis />
              <Tooltip formatter={(value, name) => [name === "totalAmount" ? formatMoney(value) : value, name]} />
              <Bar dataKey="fraud" fill="#f9735b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="panel rounded-lg p-4">
          <h2 className="mb-4 text-lg font-semibold">Top Risk Users</h2>
          <div className="space-y-3">
            {(data?.topRiskUsers || []).map((row) => (
              <div key={row.user?.id} className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{getUserName(row.user)}</p>
                    <p className="text-xs text-slate-500">{row.user?.email}</p>
                  </div>
                  <span className="text-sm font-semibold text-coral">{percent(row.avgRisk)}</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-500">
                  <span>{row.totalTransactions} txns</span>
                  <span>{row.fraud} fraud</span>
                  <span>{formatMoney(row.totalAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel rounded-lg">
          <div className="border-b border-slate-200 p-4 dark:border-slate-800">
            <h2 className="text-lg font-semibold">Recent Frauds</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Merchant</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">City</th>
                  <th className="p-3">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                {(data?.recentFrauds || []).map((tx) => (
                  <tr key={tx.id}>
                    <td className="p-3">{getUserName(tx.user)}</td>
                    <td className="p-3">{tx.merchant || "-"}</td>
                    <td className="p-3">{formatMoney(tx.amount)}</td>
                    <td className="p-3">{tx.city || "Unknown"}</td>
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
    </div>
  );
}
