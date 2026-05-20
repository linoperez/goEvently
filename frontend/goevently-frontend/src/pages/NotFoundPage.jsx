import AppLayout from "../layouts/AppLayout";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <AppLayout>
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-white">404</h1>
        <p className="mt-3 text-slate-400">The page you are looking for does not exist.</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200"
        >
          Back to home
        </Link>
      </div>
    </AppLayout>
  );
}