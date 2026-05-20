import Navbar from "../components/Navbar";

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0b1533]">
      <Navbar />

      <main className="page-enter mx-auto max-w-7xl px-5 py-10 lg:px-8">
        {children}
      </main>
    </div>
  );
}