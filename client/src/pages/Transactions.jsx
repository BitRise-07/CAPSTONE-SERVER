import { useEffect, useMemo, useState } from "react";
import {
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
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import PageHeader from "../components/PageHeader";
import RiskBadge from "../components/RiskBadge";
import api from "../services/api";
import { formatDate, formatMoney, percent } from "../utils/format";

const decisionColors = {
  allow: "#16a085",
  otp: "#f3b33d",
  block: "#ef4444",
};

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [query, setQuery] = useState("");
  const [decision, setDecision] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/transaction/get-transactions")
      .then(({ data }) => setTransactions(data.transactions || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = query.toLowerCase();
    return transactions.filter((tx) => {
      const matchesDecision = decision === "all" || tx.decision === decision;
      const haystack = [
        tx.merchant,
        tx.category,
        tx.channel,
        tx.deviceId,
        tx.location?.city,
        tx.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesDecision && haystack.includes(term);
    });
  }, [transactions, query, decision]);

  const decisionMix = ["allow", "otp", "block"].map((name) => ({
    name: name.toUpperCase(),
    value: transactions.filter((tx) => tx.decision === name).length,
    color: decisionColors[name],
  }));

  const cityRisk = Object.values(
    transactions.reduce((acc, tx) => {
      const city = tx.location?.city || "Unknown";
      if (!acc[city]) acc[city] = { city, total: 0, avgRisk: 0, blocked: 0 };
      acc[city].total += 1;
      acc[city].avgRisk += tx.scores?.risk || 0;
      if (tx.decision === "block") acc[city].blocked += 1;
      return acc;
    }, {}),
  )
    .map((row) => ({
      ...row,
      avgRisk: row.total ? Number((row.avgRisk / row.total).toFixed(3)) : 0,
    }))
    .sort((a, b) => b.avgRisk - a.avgRisk)
    .slice(0, 8);

  if (loading) return <LoadingState label="Loading transactions" />;

  return (
    <div>
      <PageHeader
        eyebrow="User route"
        title="Transaction History"
        description="Review every transaction decision, including approved, blocked, and OTP-pending activity. Only approved transactions are used by the server as behavior-learning history."
      />

      <div className="mb-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="panel rounded-lg p-4">
          <h2 className="mb-4 text-lg font-semibold">Decision Mix</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={decisionMix}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={86}
                paddingAngle={4}
              >
                {decisionMix.map((row) => (
                  <Cell key={row.name} fill={row.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            {decisionMix.map((row) => (
              <div key={row.name} className="rounded-md bg-slate-50 p-3 dark:bg-slate-900">
                <p className="text-xs text-slate-500">{row.name}</p>
                <p className="mt-1 text-xl font-bold">{row.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="panel rounded-lg p-4">
          <h2 className="mb-4 text-lg font-semibold">Risk by City</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cityRisk}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
              <XAxis dataKey="city" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(value) => `${Math.round(value * 100)}%`} />
              <Tooltip formatter={(value, name) => [name === "avgRisk" ? percent(value) : value, name]} />
              <Bar dataKey="avgRisk" name="Avg risk" fill="#54748b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel rounded-lg">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold">Ledger</h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="field sm:w-72"
              placeholder="Search merchant, city, device"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select
              className="field sm:w-40"
              value={decision}
              onChange={(event) => setDecision(event.target.value)}
            >
              <option value="all">All decisions</option>
              <option value="allow">Allow</option>
              <option value="otp">OTP</option>
              <option value="block">Block</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No transactions found" description="Try changing filters or create a transaction from the simulator." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">Merchant</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Channel</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Decision</th>
                  <th className="p-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                {filtered.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/70">
                    <td className="p-3">{formatDate(tx.createdAt)}</td>
                    <td className="p-3 font-medium">{tx.merchant || "-"}</td>
                    <td className="p-3">{formatMoney(tx.amount)}</td>
                    <td className="p-3 capitalize">{tx.channel}</td>
                    <td className="p-3">{tx.location?.city || "Unknown"}</td>
                    <td className="p-3 capitalize">{String(tx.status || "-").replace("_", " ")}</td>
                    <td className="p-3">
                      <RiskBadge decision={tx.decision} risk={tx.scores?.risk} />
                    </td>
                    <td className="max-w-xs p-3 text-slate-500">
                      {tx.explanation?.reason || tx.explanation?.message || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
