import { useEffect, useState } from "react";
import GraphView from "../components/GraphView";
import RiskBadge from "../components/RiskBadge";
import api from "../services/api";

export default function Analysis() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [txs, analytics] = await Promise.all([
          api.get("/transaction/get-transactions"),
          api.get("/analytics/get-analytics"),
        ]);

        setTransactions(txs.data.transactions || []);
        setSummary(analytics.data || {});
      } catch (error) {
        console.log("Analysis Error:", error);
      }
    }

    loadData();
  }, []);

  const matrix = summary?.model?.confusionMatrix || [
    [0, 0],
    [0, 0],
  ];
  const metrics = summary?.model?.metrics || {};

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <GraphView transactions={transactions} />
        <div className="panel rounded-lg p-4">
          <h2 className="mb-4 text-lg font-semibold">Model Evaluation</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(metrics).map(([key, value]) => (
              <div
                key={key}
                className="rounded-md border border-slate-200 p-3 dark:border-slate-800"
              >
                <p className="text-xs uppercase text-slate-500">{key}</p>
                <p className="mt-1 text-2xl font-bold">
                  {typeof value === "number" ? value.toFixed(3) : value}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold">Confusion Matrix</p>
            <div className="grid grid-cols-2 gap-2 text-center text-sm">
              <div className="rounded bg-emerald-100 p-4 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                TN {matrix[0][0]}
              </div>
              <div className="rounded bg-amber-100 p-4 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                FP {matrix[0][1]}
              </div>
              <div className="rounded bg-red-100 p-4 text-red-800 dark:bg-red-500/15 dark:text-red-300">
                FN {matrix[1][0]}
              </div>
              <div className="rounded bg-mint/15 p-4 text-mint">
                TP {matrix[1][1]}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="panel overflow-hidden rounded-lg">
        <div className="border-b border-slate-200 p-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold">Explainability Ledger</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">Merchant</th>
                <th className="p-3">Decision</th>
                <th className="p-3">Main reason</th>
                <th className="p-3">Top features</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-slate-500">
                    No transactions yet
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx._id}>
                    <td className="p-3">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>

                    <td className="p-3">{tx.merchant || "-"}</td>

                    <td className="p-3">
                      <RiskBadge
                        decision={tx.decision}
                        risk={tx.scores?.risk}
                      />
                    </td>

                    <td className="p-3 text-slate-500">
                      {tx.explanation?.message ||
                        tx.explanation?.reason ||
                        "No reason"}
                    </td>

                    <td className="p-3">
                      {tx.explanation?.rules?.length
                        ? tx.explanation.rules
                            .slice(0, 3)
                            .map((r) => r.name)
                            .join(", ")
                        : "-"}
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
