import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { CalendarDays, Lock, Mail, ShieldCheck, Users, Sparkles } from "lucide-react";
import FormInput from "../components/ui/FormInput";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { loginUser } from "../api/authApi.js";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const redirectTo = location.state?.from?.pathname || "/";

  const [form, setForm] = useState({
    usernameOrEmail: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      const data = await loginUser(form);

      if (!data?.success) {
        throw new Error(data?.message || "Login failed");
      }

      const token = data?.jwt;

      if (!token) {
        throw new Error("JWT not found in login response");
      }

      login(token, {
        userId: data.userId,
        username: data.username,
        role: data.role,
      });

      // navigate("/events");
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-white">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 px-8 py-8 lg:grid-cols-2 lg:gap-16">
        <section className="relative flex flex-col justify-between py-8">
          <Link to="/" className="text-4xl font800 tracking-tight">
            <span className="text-[#0ea5a4]">go</span>
            <span className="text-[#0b1533]">Evently</span>
          </Link>

          <div className="max-w-xl">
            <h1 className="text-6xl font800 leading-[1.05] tracking-[-0.055em] text-[#0b1533]">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-[#0ea5a4] via-[#2563eb] to-[#4f46e5] bg-clip-text text-transparent">
                goEvently
              </span>
            </h1>
            <p className="mt-7 text-xl font500 leading-9 text-[#66708a]">
              Discover events worth showing up for. Book securely, connect with
              people, and create unforgettable experiences.
            </p>

            <div className="mt-12 space-y-8">
              <Feature
                icon={<CalendarDays />}
                title="Curated Experiences"
                text="Find handpicked events across music, tech, art, business and more."
              />
              <Feature
                icon={<ShieldCheck />}
                title="Secure & Reliable"
                text="JWT-based authentication with protected backend access."
              />
              <Feature
                icon={<Users />}
                title="Connect & Engage"
                text="Book events, receive updates, and manage your event journey."
              />
            </div>
          </div>

          <p className="text-sm font600 text-[#8b95aa]">
            © 2026 goEvently. All rights reserved.
          </p>
        </section>

        <section className="flex items-center justify-center py-8">
          <Card className="w-full max-w-xl p-10">
            <div className="mb-9 grid grid-cols-2 border-b border-[#e6eaf2]">
              <button className="border-b-4 border-[#0ea5a4] pb-5 text-sm font800 text-[#0ea5a4]">
                Login
              </button>
              <Link
                to="/register"
                className="pb-5 text-center text-sm font800 text-[#66708a]"
              >
                Create account
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <FormInput
                label="Username or Email"
                name="usernameOrEmail"
                value={form.usernameOrEmail}
                onChange={handleChange}
                placeholder="you@example.com or username"
                icon={<Mail size={20} />}
                required
              />

              <FormInput
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                icon={<Lock size={20} />}
                required
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 text-sm font700 text-[#4b587c]">
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                  Remember me
                </label>
                <button type="button" className="text-sm font800 text-indigo-600">
                  Forgot password?
                </button>
              </div>

              {error ? (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font700 text-red-600">
                  {error}
                </div>
              ) : null}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              <div className="relative py-2 text-center">
                <span className="bg-white px-4 text-sm font600 text-[#8b95aa]">
                  or continue with
                </span>
                <div className="absolute left-0 right-0 top-1/2 -z-10 h-px bg-[#e6eaf2]" />
              </div>

              <button
                type="button"
                className="w-full rounded-2xl border border-[#e6eaf2] bg-white px-5 py-3.5 text-sm font800 text-[#0b1533] transition hover:bg-slate-50"
              >
                Continue with Google
              </button>

              <div className="mt-8 flex gap-4 rounded-3xl bg-slate-50 p-5">
                <div className="rounded-full bg-indigo-50 p-4 text-indigo-600">
                  <Sparkles />
                </div>
                <div>
                  <p className="font800 text-[#0b1533]">Backend-heavy demo</p>
                  <p className="mt-1 text-sm font500 leading-6 text-[#66708a]">
                    Secure access with JWT authentication and role-based
                    routing.
                  </p>
                </div>
              </div>
            </form>
          </Card>
        </section>
      </div>
    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div className="flex gap-5">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-[#0ea5a4]">
        {icon}
      </div>
      <div>
        <h3 className="font800 text-[#0b1533]">{title}</h3>
        <p className="mt-1 max-w-sm text-sm font500 leading-6 text-[#66708a]">
          {text}
        </p>
      </div>
    </div>
  );
}