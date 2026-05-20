import Card from "./Card";

export default function StatCard({ icon, label, value, helper, tone = "teal" }) {
  const tones = {
    teal: "bg-teal-50 text-teal-600",
    indigo: "bg-indigo-50 text-indigo-600",
    orange: "bg-orange-50 text-orange-600",
    green: "bg-emerald-50 text-emerald-600",
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-full ${tones[tone]}`}
        >
          {icon}
        </div>

        <div>
          <p className="text-sm font600 text-[#66708a]">{label}</p>
          <h3 className="mt-1 text-3xl font800 tracking-tight text-[#0b1533]">
            {value}
          </h3>
          {helper ? (
            <p className="mt-2 text-xs font600 text-[#66708a]">{helper}</p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}