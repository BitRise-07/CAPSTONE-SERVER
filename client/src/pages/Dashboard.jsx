import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceDot,
} from "recharts";
import MetricCard from "../components/MetricCard";
import RiskBadge from "../components/RiskBadge";
import api from "../services/api";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);

  async function load() {
  try {
    const [analytics, txs] = await Promise.all([
      api.get("/analytics/get-analytics"),
      api.get("/transaction/get-transactions"),
    ]);

    setSummary(analytics.data || {});
    setTransactions(txs.data.transactions || []);
  } catch (error) {
    console.log("Dashboard Error:", error);
  }
}
  console.log("summary", summary);
  console.log("transaction", transactions);


  useEffect(() => {
    load();
  }, []);

  const totals = summary?.totals || {};
  const mix = [
    { name: "Legit", value: totals.legit || 0, color: "#16a085" },
    { name: "Fraud", value: totals.fraud || 0, color: "#f9735b" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Transactions" value={totals.total || 0} />
        <MetricCard label="Fraud" value={totals.fraud || 0} tone="text-coral" />
        <MetricCard
          label="OTP Checks"
          value={totals.otp || 0}
          tone="text-amber"
        />
        <MetricCard
          label="Blocked"
          value={totals.blocked || 0}
          tone="text-red-500"
        />
        <MetricCard
          label="Avg Risk"
          value={`${Math.round((totals.avgRisk || 0) * 100)}%`}
          tone="text-mint"
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
  {/* ================= RISK TREND ================= */}
  <div className="panel rounded-xl p-5">
    <div className="mb-5 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold">Risk Trend</h2>
        <p className="text-sm text-slate-500">
          Transaction risk activity over time
        </p>
      </div>

      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
          <span>Allow</span>
        </div>

        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
          <span>OTP/Review</span>
        </div>

        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-red-500"></div>
          <span>Blocked</span>
        </div>
      </div>
    </div>

    <ResponsiveContainer width="100%" height={340}>
      <AreaChart
        data={(summary?.riskTrend || []).map((item, index) => ({
          ...item,
          index: index + 1,
          formattedTime: new Date(item.time).toLocaleString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            day: "2-digit",
            month: "short",
          }),
        }))}
        margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
      >
        <defs>
          <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#16a085" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#16a085" stopOpacity={0.05} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="4 4"
          strokeOpacity={0.15}
        />

        {/* X AXIS */}
        <XAxis
          dataKey="formattedTime"
          tick={{ fontSize: 11 }}
          angle={-15}
          textAnchor="end"
          interval={0}
          height={60}
        />

        {/* Y AXIS */}
        <YAxis
          domain={[0, 1]}
          tick={{ fontSize: 11 }}
          tickFormatter={(value) => `${Math.round(value * 100)}%`}
        />

        {/* TOOLTIP */}
        <Tooltip
          contentStyle={{
            backgroundColor: "#0f172a",
            border: "1px solid #334155",
            borderRadius: "10px",
            color: "#fff",
          }}
          formatter={(value, name, props) => [
            `${Math.round(value * 100)}%`,
            "Risk",
          ]}
          labelFormatter={(label, payload) => {
            const item = payload?.[0]?.payload;

            return `
Transaction #${item?.index}

${item?.formattedTime}

Decision: ${item?.decision?.toUpperCase() || "UNKNOWN"}

Amount: ₹${item?.amount || 0}
            `;
          }}
        />

        {/* RISK AREA */}
        <Area
          type="monotone"
          dataKey="risk"
          stroke="#14b8a6"
          fill="url(#riskGradient)"
          strokeWidth={2.5}
          activeDot={{
            r: 7,
            stroke: "#fff",
            strokeWidth: 2,
          }}
        />

        {/* ALLOW DOTS */}
        {(summary?.riskTrend || [])
          .filter((d) => d.decision === "allow")
          .map((entry, index) => (
            <ReferenceDot
              key={`allow-${index}`}
              x={new Date(entry.time).toLocaleString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                day: "2-digit",
                month: "short",
              })}
              y={entry.risk}
              r={5}
              fill="#22c55e"
              stroke="#fff"
            />
          ))}

        {/* OTP / REVIEW DOTS */}
        {(summary?.riskTrend || [])
          .filter(
            (d) =>
              d.decision === "otp" ||
              d.decision === "review"
          )
          .map((entry, index) => (
            <ReferenceDot
              key={`otp-${index}`}
              x={new Date(entry.time).toLocaleString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                day: "2-digit",
                month: "short",
              })}
              y={entry.risk}
              r={5}
              fill="#facc15"
              stroke="#fff"
            />
          ))}

        {/* BLOCKED DOTS */}
        {(summary?.riskTrend || [])
          .filter((d) => d.decision === "block")
          .map((entry, index) => (
            <ReferenceDot
              key={`block-${index}`}
              x={new Date(entry.time).toLocaleString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                day: "2-digit",
                month: "short",
              })}
              y={entry.risk}
              r={7}
              fill="#ef4444"
              stroke="#fff"
              strokeWidth={2}
            />
          ))}
      </AreaChart>
    </ResponsiveContainer>

    {/* TRANSACTION SUMMARY */}
    <div className="mt-5 grid gap-3 md:grid-cols-3">
      {(summary?.riskTrend || []).slice(-6).map((tx, index) => (
        <div
          key={index}
          className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              Txn #{index + 1}
            </p>

            <span
              className={`rounded px-2 py-1 text-xs font-semibold ${
                tx.decision === "block"
                  ? "bg-red-500/20 text-red-400"
                  : tx.decision === "otp" ||
                    tx.decision === "review"
                  ? "bg-yellow-500/20 text-yellow-300"
                  : "bg-green-500/20 text-green-400"
              }`}
            >
              {tx.decision?.toUpperCase()}
            </span>
          </div>

          <div className="mt-2 space-y-1 text-xs text-slate-500">
            <p>
              Risk: {Math.round((tx.risk || 0) * 100)}%
            </p>

            <p>
              Amount: ₹{tx.amount || 0}
            </p>

            <p>
              {new Date(tx.time).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>

  {/* ================= FRAUD MIX ================= */}
  <div className="panel rounded-xl p-5">
    <h2 className="mb-4 text-lg font-semibold">
      Fraud Mix
    </h2>

    <ResponsiveContainer width="100%" height={340}>
      <PieChart>
        <Pie
          data={mix}
          dataKey="value"
          nameKey="name"
          innerRadius={65}
          outerRadius={110}
          paddingAngle={3}
        >
          {mix.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>

        <Tooltip
          contentStyle={{
            backgroundColor: "#0f172a",
            border: "1px solid #334155",
            borderRadius: "10px",
            color: "#fff",
          }}
        />
      </PieChart>
    </ResponsiveContainer>

    {/* MIX LEGEND */}
    <div className="mt-5 space-y-3">
      {mix.map((item) => (
        <div
          key={item.name}
          className="flex items-center justify-between rounded-md border border-slate-200 p-3 dark:border-slate-700"
        >
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: item.color }}
            ></div>

            <span className="text-sm font-medium">
              {item.name}
            </span>
          </div>

          <span className="text-sm text-slate-500">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  </div>
</div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="panel rounded-lg p-4">
          <h2 className="mb-4 text-lg font-semibold">Model ROC</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={summary?.model?.rocCurve || []}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="fpr" />
              <YAxis dataKey="tpr" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="tpr"
                stroke="#54748b"
                strokeWidth={2}
                dot
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="panel rounded-lg p-4">
          <h2 className="mb-4 text-lg font-semibold">Fraud by City</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={summary?.fraudByCity || []}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="city" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="legit" stackId="a" fill="#16a085" />
              <Bar dataKey="fraud" stackId="a" fill="#f9735b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="panel overflow-hidden rounded-lg">
        <div className="border-b border-slate-200 p-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold">Recent Decisions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="p-3">Merchant</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Device</th>
                <th className="p-3">Location</th>
                <th className="p-3">Decision</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-4 text-center">
                    No transactions
                  </td>
                </tr>
              ) : (
                transactions.slice(0, 8).map((tx) => (
                  <tr key={tx._id}>
                    <td className="p-3">{tx.merchant || "-"}</td>

                    <td className="p-3">
                      ₹{tx.amount ? tx.amount.toLocaleString() : 0}
                    </td>

                    <td className="p-3">{tx.deviceId || "unknown"}</td>

                    <td className="p-3">{tx.location?.city || "Unknown"}</td>

                    <td className="p-3">
                      <RiskBadge
                        decision={tx.decision}
                        risk={tx.scores?.risk}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
