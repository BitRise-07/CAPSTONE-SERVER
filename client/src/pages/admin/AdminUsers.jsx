import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
import PageHeader from "../../components/PageHeader";
import api from "../../services/api";
import { formatDate, formatMoney, getUserName, percent } from "../../utils/format";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/users", {
        params: { search, limit: 50 },
      });
      setUsers(data.users || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Admin route"
        title="Users"
        description="Inspect user behavior baselines, fraud counts, and transaction exposure."
        actions={
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              load();
            }}
          >
            <input
              className="field w-64"
              placeholder="Search users"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button className="btn btn-primary">
              <Search size={16} /> Search
            </button>
          </form>
        }
      />

      {loading ? (
        <LoadingState label="Loading users" />
      ) : users.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <div className="panel overflow-hidden rounded-lg">
          <table className="w-full min-w-[940px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Transactions</th>
                <th className="p-3">Total amount</th>
                <th className="p-3">Fraud</th>
                <th className="p-3">Avg risk</th>
                <th className="p-3">Last txn</th>
                <th className="p-3">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/70">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {user.image && <img alt="" src={user.image} className="h-9 w-9 rounded-md border border-slate-200 dark:border-slate-800" />}
                      <div>
                        <p className="font-semibold">{getUserName(user)}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{user.totalTransactions}</td>
                  <td className="p-3">{formatMoney(user.totalAmount)}</td>
                  <td className="p-3 text-coral">{user.fraud}</td>
                  <td className="p-3">{percent(user.avgRisk)}</td>
                  <td className="p-3">{formatDate(user.lastTransactionAt)}</td>
                  <td className="p-3">{user.isBlocked ? "Blocked" : "Active"}</td>
                  <td className="p-3">
                    <Link className="btn btn-muted" to={`/admin/users/${user.id}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
