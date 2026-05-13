import { Filter } from "lucide-react";
import { useEffect, useState } from "react";
import LoadingState from "../../components/LoadingState";
import PageHeader from "../../components/PageHeader";
import RiskBadge from "../../components/RiskBadge";
import api from "../../services/api";
import { formatDate, formatMoney, getUserName } from "../../utils/format";

export default function AdminTransactions() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    decision: "",
    status: "",
    minAmount: "",
    maxAmount: "",
  });

  async function load() {
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== ""),
      );
      const { data } = await api.get("/transaction/get-all-transactions", {
        params: { ...params, limit: 50 },
      });
      setRows(data.transactions || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function setFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  return (
    <div>
      <PageHeader
        eyebrow="Admin route"
        title="All Transactions"
        description="Filter global transaction decisions across users, merchants, amount bands, status, and risk outcomes."
      />

      <form
        className="panel mb-6 grid gap-3 rounded-lg p-4 md:grid-cols-6"
        onSubmit={(event) => {
          event.preventDefault();
          load();
        }}
      >
        <input
          className="field md:col-span-2"
          placeholder="Search user, merchant, city"
          value={filters.search}
          onChange={(event) => setFilter("search", event.target.value)}
        />
        <select className="field" value={filters.decision} onChange={(event) => setFilter("decision", event.target.value)}>
          <option value="">All decisions</option>
          <option value="allow">Allow</option>
          <option value="otp">OTP</option>
          <option value="block">Block</option>
        </select>
        <select className="field" value={filters.status} onChange={(event) => setFilter("status", event.target.value)}>
          <option value="">All statuses</option>
          <option value="approved">Approved</option>
          <option value="pending_otp">Pending OTP</option>
          <option value="blocked">Blocked</option>
        </select>
        <input
          className="field"
          type="number"
          placeholder="Min amount"
          value={filters.minAmount}
          onChange={(event) => setFilter("minAmount", event.target.value)}
        />
        <input
          className="field"
          type="number"
          placeholder="Max amount"
          value={filters.maxAmount}
          onChange={(event) => setFilter("maxAmount", event.target.value)}
        />
        <button className="btn btn-primary md:col-span-6">
          <Filter size={16} /> Apply filters
        </button>
      </form>

      {loading ? (
        <LoadingState label="Loading transactions" />
      ) : (
        <div className="panel overflow-hidden rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">User</th>
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
                {rows.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/70">
                    <td className="p-3">{formatDate(tx.time)}</td>
                    <td className="p-3">
                      <p className="font-semibold">{getUserName(tx.user)}</p>
                      <p className="text-xs text-slate-500">{tx.user?.email}</p>
                    </td>
                    <td className="p-3">{tx.merchant || "-"}</td>
                    <td className="p-3">{formatMoney(tx.amount)}</td>
                    <td className="p-3 capitalize">{tx.channel}</td>
                    <td className="p-3">{tx.location?.city || "Unknown"}</td>
                    <td className="p-3 capitalize">{String(tx.statusLabel || tx.status || "-").replace("_", " ")}</td>
                    <td className="p-3">
                      <RiskBadge decision={tx.decision} risk={tx.scores?.risk} />
                    </td>
                    <td className="max-w-xs p-3 text-slate-500">{tx.reason || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
