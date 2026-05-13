import {
  Bell,
  BookOpen,
  ChartNoAxesCombined,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Moon,
  Radar,
  ReceiptText,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sun,
  User,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../services/api";
import { getUserName } from "../utils/format";

const socketUrl = new URL(API_URL).origin;

export default function Layout() {
  const { user, logout } = useAuth();
  const [dark, setDark] = useState(true);
  const [pulse, setPulse] = useState(null);
  const isAdmin = user?.accountType === "Admin";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    const socket = io(socketUrl);
    socket.on("transaction:new", (tx) => {
  setPulse(
    `${tx.decision?.toUpperCase()} | risk ${
      tx.scores?.risk
        ? (tx.scores.risk * 100).toFixed(0)
        : "N/A"
    }%`
  );

  setTimeout(() => setPulse(null), 3500);
});
    return () => socket.disconnect();
  }, []);

  const linkClass = ({ isActive }) =>
    `btn w-full justify-start ${isActive ? "bg-mint text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"}`;

  const mobileLinkClass = ({ isActive }) =>
    `btn shrink-0 ${isActive ? "bg-mint text-white" : "btn-muted"}`;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-[#101417] dark:text-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 lg:block">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-mint text-white">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-base font-bold">Fraud F</p>
            <p className="text-xs text-slate-500">AI banking risk ops</p>
          </div>
        </div>
        <nav className="space-y-2">
          <NavLink className={linkClass} to="/">
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>
          <NavLink className={linkClass} to="/simulate">
            <Send size={18} /> Simulator
          </NavLink>
          <NavLink className={linkClass} to="/transactions">
            <ReceiptText size={18} /> Transactions
          </NavLink>
          <NavLink className={linkClass} to="/analysis">
            <Radar size={18} /> Fraud Analysis
          </NavLink>
          <NavLink className={linkClass} to="/profile">
            <User size={18} /> Profile
          </NavLink>
          {isAdmin && (
            <>
              <div className="px-3 pt-5 text-xs font-semibold uppercase text-slate-500">
                Admin
              </div>
              <NavLink className={linkClass} to="/admin">
                <ShieldAlert size={18} /> Overview
              </NavLink>
              <NavLink className={linkClass} to="/admin/users">
                <Users size={18} /> Users
              </NavLink>
              <NavLink className={linkClass} to="/admin/transactions">
                <ListChecks size={18} /> All Transactions
              </NavLink>
              <NavLink className={linkClass} to="/admin/scoring">
                <BookOpen size={18} /> Scoring Guide
              </NavLink>
            </>
          )}
        </nav>
      </aside>
      <main className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Signed in as {user?.accountType}</p>
              <h1 className="text-xl font-semibold">{getUserName(user)}</h1>
            </div>
            <div className="flex items-center gap-2">
              {pulse && (
                <div className="hidden items-center gap-2 rounded-md border border-amber/40 bg-amber/10 px-3 py-2 text-sm text-amber md:flex">
                  <Bell size={16} /> {pulse}
                </div>
              )}
              <button className="btn btn-muted" onClick={() => setDark((value) => !value)} title="Toggle theme">
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button className="btn btn-muted" onClick={logout} title="Sign out">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>
        <div className="overflow-x-auto border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950 lg:hidden">
          <nav className="flex gap-2">
            <NavLink className={mobileLinkClass} to="/">
              <LayoutDashboard size={16} /> Dashboard
            </NavLink>
            <NavLink className={mobileLinkClass} to="/simulate">
              <Send size={16} /> Simulator
            </NavLink>
            <NavLink className={mobileLinkClass} to="/transactions">
              <ReceiptText size={16} /> Transactions
            </NavLink>
            <NavLink className={mobileLinkClass} to="/analysis">
              <Radar size={16} /> Analysis
            </NavLink>
            <NavLink className={mobileLinkClass} to="/profile">
              <User size={16} /> Profile
            </NavLink>
            {isAdmin && (
              <>
                <NavLink className={mobileLinkClass} to="/admin">
                  <ShieldAlert size={16} /> Admin
                </NavLink>
                <NavLink className={mobileLinkClass} to="/admin/users">
                  <Users size={16} /> Users
                </NavLink>
                <NavLink className={mobileLinkClass} to="/admin/transactions">
                  <ListChecks size={16} /> All Txns
                </NavLink>
                <NavLink className={mobileLinkClass} to="/admin/scoring">
                  <BookOpen size={16} /> Scoring
                </NavLink>
              </>
            )}
          </nav>
        </div>
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
