import { ShieldCheck, UserRound } from "lucide-react";
import Card from "./ui/Card";
import Badge from "./ui/Badge";

function getCurrentUsername(user) {
  return user?.username || user?.name || user?.email || "";
}

function canEditEvent(event, user) {
  const currentUsername = getCurrentUsername(user);

  return (
    event?.organizerUsername &&
    currentUsername &&
    String(event.organizerUsername).toLowerCase() ===
      String(currentUsername).toLowerCase()
  );
}


export default function OrganizerInfoCard({
  organizerUsername,
  currentUsername,
  compact = false,
}) {
  const isCurrentOrganizer =
    organizerUsername &&
    currentUsername &&
    String(organizerUsername).toLowerCase() ===
      String(currentUsername).toLowerCase();

  return (
    <Card className={compact ? "p-5" : "p-6"}>
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-[#0ea5a4]">
          <UserRound size={26} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font800 text-[#0b1533]">
              Event Organizer
            </h3>

            {isCurrentOrganizer ? (
              <Badge color="green">You</Badge>
            ) : null}
          </div>

          <p className="mt-2 break-words text-sm font800 text-[#0b1533]">
            {organizerUsername || "Organizer unavailable"}
          </p>

          <p className="mt-2 text-sm font600 leading-6 text-[#66708a]">
            {isCurrentOrganizer
              ? "You created this event, so you can manage and update it."
              : "Only the organizer who created this event can edit it."}
          </p>

          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-xs font800 text-[#66708a]">
            <ShieldCheck size={16} className="text-[#0ea5a4]" />
            Organizer-based access control
          </div>
        </div>
      </div>
    </Card>
  );
}