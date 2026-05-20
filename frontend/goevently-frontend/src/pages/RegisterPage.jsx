import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Mail, UserRound, ShieldCheck } from "lucide-react";
import FormInput from "../components/ui/FormInput";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { registerUser } from "../api/authApi.js";
import CustomSelect from "../components/ui/CustomSelect";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "USER",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setLoading(true);
      const data = await registerUser(form);

      if (data?.success === false) {
        throw new Error(data?.message || "Registration failed");
      }

      setSuccess("Account created successfully. Redirecting to login...");
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Registration failed");
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
              Create your{" "}
              <span className="bg-gradient-to-r from-[#0ea5a4] via-[#2563eb] to-[#4f46e5] bg-clip-text text-transparent">
                event journey
              </span>
            </h1>
            <p className="mt-7 text-xl font500 leading-9 text-[#66708a]">
              Join goEvently to explore events, reserve tickets, complete
              payments, and manage bookings from one clean dashboard.
            </p>

            <div className="mt-12 rounded-3xl border border-[#e6eaf2] bg-gradient-to-br from-teal-50 to-indigo-50 p-7">
              <div className="flex gap-4">
                <div className="rounded-2xl bg-white p-4 text-[#0ea5a4]">
                  <ShieldCheck />
                </div>
                <div>
                  <h3 className="font800 text-[#0b1533]">
                    Secure backend flow
                  </h3>
                  <p className="mt-2 text-sm font500 leading-6 text-[#66708a]">
                    Your account is connected to a JWT-authenticated
                    microservices backend with protected routes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm font600 text-[#8b95aa]">
            © 2026 goEvently. All rights reserved.
          </p>
        </section>

        <section className="flex items-center justify-center py-8">
          <Card className="w-full max-w-xl p-10">
            <div className="mb-9 grid grid-cols-2 border-b border-[#e6eaf2]">
              <Link
                to="/login"
                className="pb-5 text-center text-sm font800 text-[#66708a]"
              >
                Login
              </Link>
              <button className="border-b-4 border-[#0ea5a4] pb-5 text-sm font800 text-[#0ea5a4]">
                Create account
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <FormInput
                label="Username"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Choose username"
                icon={<UserRound size={20} />}
                required
              />

              <FormInput
                label="Email address"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                icon={<Mail size={20} />}
                required
              />

              <FormInput
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                icon={<Lock size={20} />}
                required
              />

              <CustomSelect
                label="Role"
                value={form.role}
                options={["USER", "ADMIN"]}
                onChange={(role) =>
                  setForm((prev) => ({
                    ...prev,
                    role,
                  }))
                }
              />

              {error ? (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font700 text-red-600">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font700 text-emerald-600">
                  {success}
                </div>
              ) : null}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </Card>
        </section>
      </div>
    </div>
  );
}