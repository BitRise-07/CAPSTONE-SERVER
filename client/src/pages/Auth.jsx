import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const heroImage =
  "https://res.cloudinary.com/demo/image/fetch/f_auto,q_auto,w_1200/https://images.unsplash.com/photo-1563986768494-4dee2763ff3f";

export default function Auth() {
  const { user, login, register, sendOTP, loading } = useAuth();

  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });

  if (user) return <Navigate to="/" replace />;

  async function handleSendOTP() {
    try {
      await sendOTP(form.email);
      alert("OTP sent successfully");
    } catch (err) {
      setError(err.response?.data?.message || "OTP failed");
    }
  }

  async function submit(event) {
    event.preventDefault();
    setError("");

    try {
      if (mode === "login") {
        await login({
          email: form.email,
          password: form.password,
        });
      } else {
        await register(form);
        alert("Signup successful. Please login.");
        setMode("login");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed");
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 px-4 text-slate-900 dark:bg-[#101417] dark:text-white">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950 md:grid-cols-[1.1fr_0.9fr]">
        
        {/* LEFT SIDE (UNCHANGED) */}
        <div
          className="relative min-h-[480px] bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative flex h-full flex-col justify-between p-8 text-white">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-green-500">
                <ShieldCheck />
              </div>
              <span className="text-xl font-bold">Fraud F</span>
            </div>

            <div>
              <h1 className="max-w-md text-4xl font-bold leading-tight">
                Real-time banking fraud intelligence
              </h1>
              <p className="mt-4 max-w-md text-sm text-slate-200">
                ML scoring, behavioral analytics, graph signals, and explainable
                decisions in one monitoring console.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE FORM */}
        <form onSubmit={submit} className="p-6 md:p-8">
          
          {/* TOGGLE */}
          <div className="mb-6 grid grid-cols-2 rounded-md bg-slate-100 p-1 dark:bg-slate-900">
            <button
              type="button"
              className={`rounded px-3 py-2 text-sm font-semibold ${
                mode === "login"
                  ? "bg-white shadow dark:bg-slate-800"
                  : ""
              }`}
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={`rounded px-3 py-2 text-sm font-semibold ${
                mode === "register"
                  ? "bg-white shadow dark:bg-slate-800"
                  : ""
              }`}
              onClick={() => setMode("register")}
            >
              Register
            </button>
          </div>

          {/* REGISTER FIELDS */}
          {mode === "register" && (
            <>
              <label className="mb-4 block text-sm">
                First Name
                <input
                  className="field mt-1"
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                />
              </label>

              <label className="mb-4 block text-sm">
                Last Name
                <input
                  className="field mt-1"
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({ ...form, lastName: e.target.value })
                  }
                />
              </label>
            </>
          )}

          {/* EMAIL */}
          <label className="mb-4 block text-sm">
            Email
            <input
              className="field mt-1"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />
          </label>

          {/* PASSWORD */}
          <label className="mb-4 block text-sm">
            Password
            <input
              className="field mt-1"
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />
          </label>

          {/* REGISTER EXTRA */}
          {mode === "register" && (
            <>
              <label className="mb-4 block text-sm">
                Confirm Password
                <input
                  className="field mt-1"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      confirmPassword: e.target.value,
                    })
                  }
                />
              </label>

              <label className="mb-4 block text-sm">
                OTP
                <div className="flex gap-2 mt-1">
                  <input
                    className="field flex-1"
                    value={form.otp}
                    onChange={(e) =>
                      setForm({ ...form, otp: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    className="btn btn-secondary"
                  >
                    Send
                  </button>
                </div>
              </label>
            </>
          )}

          {/* ERROR */}
          {error && (
            <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </p>
          )}

          {/* SUBMIT */}
          <button className="btn btn-primary w-full" disabled={loading}>
            {mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}