import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getUnreadNotifications } from "../api/notificationApi";

function normalizeRole(role) {
  return String(role || "")
    .replace("ROLE_", "")
    .trim()
    .toUpperCase();
}

function isRouteActive(pathname, to) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

function getStoredUnderline() {
  try {
    const stored = sessionStorage.getItem("goevently_nav_underline");
    if (!stored) return { left: 0, width: 0, opacity: 0 };
    return JSON.parse(stored);
  } catch {
    return { left: 0, width: 0, opacity: 0 };
  }
}

function unwrapNotificationList(response) {
  const data = response?.data ?? response;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.content)) return data.data.content;

  return [];
}

function getUserId(user) {
  return user?.userId || user?.id || null;
}

function NotificationBadge({ count }) {
  if (!count || Number(count) <= 0) return null;

  return (
    <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0ea5a4] px-1.5 text-[10px] font800 leading-none text-white shadow-sm shadow-teal-500/20">
      {Number(count) > 9 ? "9+" : count}
    </span>
  );
}

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [underlineStyle, setUnderlineStyle] = useState(getStoredUnderline);
  const [notificationCount, setNotificationCount] = useState(0);

  const navRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { isAuthenticated, logout, user } = useAuth();

  const role = normalizeRole(user?.role);
  const canAccessOrganizer = role === "ADMIN" || role === "ORGANIZER";

  useEffect(() => {
    async function loadNotificationCount() {
      const userId = getUserId(user);

      if (!isAuthenticated || !userId) {
        setNotificationCount(0);
        return;
      }

      try {
        const response = await getUnreadNotifications(userId, 0, 50);
        const notificationList = unwrapNotificationList(response);

        setNotificationCount(notificationList.length);
      } catch (err) {
        console.warn("Could not load notification count:", err);
        setNotificationCount(0);
      }
    }

    loadNotificationCount();

    const intervalId = setInterval(loadNotificationCount, 30000);

    return () => clearInterval(intervalId);
  }, [user, isAuthenticated]);

  const navItems = [
    {
      to: "/events",
      label: "Explore",
      icon: <Search size={18} />,
      show: true,
      badge: 0,
    },
    {
      to: "/bookings",
      label: "My Bookings",
      icon: <CalendarCheck size={18} />,
      show: isAuthenticated,
      badge: 0,
    },
    {
      to: "/notifications",
      label: "Notifications",
      icon: <Bell size={18} />,
      show: isAuthenticated,
      badge: notificationCount,
    },
    {
      to: "/organizer",
      label: "Organizer",
      icon: <LayoutDashboard size={18} />,
      show: isAuthenticated && canAccessOrganizer,
      badge: 0,
    },
  ];

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const activeLink = nav.querySelector("[data-active='true']");

    if (!activeLink) {
      setUnderlineStyle((prev) => ({
        ...prev,
        opacity: 0,
      }));
      return;
    }

    const navRect = nav.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();

    const nextStyle = {
      left: linkRect.left - navRect.left + 12,
      width: linkRect.width - 24,
      opacity: 1,
    };

    requestAnimationFrame(() => {
      setUnderlineStyle(nextStyle);

      try {
        sessionStorage.setItem(
          "goevently_nav_underline",
          JSON.stringify(nextStyle)
        );
      } catch {
        // ignore storage error
      }
    });
  }, [
    location.pathname,
    isAuthenticated,
    canAccessOrganizer,
    notificationCount,
  ]);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMobileMenu();
    setNotificationCount(0);

    try {
      sessionStorage.removeItem("goevently_nav_underline");
    } catch {
      // ignore storage error
    }

    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#e6eaf2] bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8">
        <Link
          to="/"
          className="text-3xl font800 tracking-tight"
          onClick={closeMobileMenu}
        >
          <span className="text-[#0ea5a4]">go</span>
          <span className="text-[#0b1533]">Evently</span>
        </Link>

        <nav ref={navRef} className="relative hidden items-center gap-2 md:flex">
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const active = isRouteActive(location.pathname, item.to);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  data-active={active ? "true" : "false"}
                  className={`relative flex items-center gap-2 px-4 py-6 text-sm font700 transition-colors duration-300 ${
                    active
                      ? "text-[#0ea5a4]"
                      : "text-[#4b587c] hover:text-[#0b1533]"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  <NotificationBadge count={item.badge} />
                </NavLink>
              );
            })}

          <span
            className="pointer-events-none absolute bottom-0 h-1 rounded-full bg-[#0ea5a4] transition-[left,width,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              left: `${underlineStyle.left}px`,
              width: `${underlineStyle.width}px`,
              opacity: underlineStyle.opacity,
            }}
          />
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {!isAuthenticated ? (
            <>
              <NavLink
                to="/login"
                className="rounded-xl px-4 py-2 text-sm font700 text-[#4b587c] transition hover:bg-slate-100"
              >
                Login
              </NavLink>

              <NavLink
                to="/register"
                className="rounded-xl px-4 py-2 text-sm font700 text-white gev-gradient shadow-lg shadow-indigo-500/20"
              >
                Register
              </NavLink>
            </>
          ) : (
            <>
              <div className="hidden items-center gap-3 sm:flex">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-[#0ea5a4]">
                  <UserRound size={20} />
                </div>

                <div>
                  <p className="max-w-32 truncate text-sm font800 text-[#0b1533]">
                    {user?.username || user?.name || user?.email || "User"}
                  </p>
                  <p className="text-xs font600 uppercase text-[#66708a]">
                    {role || "USER"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-[#e6eaf2] bg-white px-4 py-2 text-sm font700 text-[#4b587c] transition hover:bg-slate-50"
              >
                Logout
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e6eaf2] bg-white text-[#0b1533] md:hidden"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileMenuOpen ? (
        <div className="border-t border-[#e6eaf2] bg-white px-5 py-5 md:hidden">
          <nav className="flex flex-col gap-2">
            <MobileNavItem
              to="/events"
              onClick={closeMobileMenu}
              icon={<Search size={18} />}
            >
              Explore
            </MobileNavItem>

            {isAuthenticated ? (
              <>
                <MobileNavItem
                  to="/bookings"
                  onClick={closeMobileMenu}
                  icon={<CalendarCheck size={18} />}
                >
                  My Bookings
                </MobileNavItem>

                <MobileNavItem
                  to="/notifications"
                  onClick={closeMobileMenu}
                  icon={<Bell size={18} />}
                  badge={notificationCount}
                >
                  Notifications
                </MobileNavItem>

                {canAccessOrganizer ? (
                  <MobileNavItem
                    to="/organizer"
                    onClick={closeMobileMenu}
                    icon={<LayoutDashboard size={18} />}
                  >
                    Organizer
                  </MobileNavItem>
                ) : null}
              </>
            ) : null}
          </nav>

          <div className="mt-5 border-t border-[#e6eaf2] pt-5">
            {!isAuthenticated ? (
              <div className="grid gap-3">
                <Link to="/login" onClick={closeMobileMenu}>
                  <button
                    type="button"
                    className="w-full rounded-xl border border-[#e6eaf2] bg-white px-4 py-3 text-sm font700 text-[#4b587c] transition hover:bg-slate-50"
                  >
                    Login
                  </button>
                </Link>

                <Link to="/register" onClick={closeMobileMenu}>
                  <button
                    type="button"
                    className="w-full rounded-xl px-4 py-3 text-sm font700 text-white gev-gradient shadow-lg shadow-indigo-500/20"
                  >
                    Register
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-[#0ea5a4]">
                    <UserRound size={20} />
                  </div>

                  <div>
                    <p className="max-w-40 truncate text-sm font800 text-[#0b1533]">
                      {user?.username || user?.name || user?.email || "User"}
                    </p>
                    <p className="text-xs font600 uppercase text-[#66708a]">
                      {role || "USER"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#e6eaf2] bg-white px-4 py-3 text-sm font700 text-[#4b587c] transition hover:bg-slate-50"
                >
                  <LogOut size={17} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}

function MobileNavItem({ to, children, icon, onClick, badge = 0 }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font800 transition ${
          isActive
            ? "bg-teal-50 text-[#0ea5a4]"
            : "text-[#66708a] hover:bg-slate-100 hover:text-[#0b1533]"
        }`
      }
    >
      <div className="flex items-center gap-3">
        {icon}
        {children}
      </div>

      <NotificationBadge count={badge} />
    </NavLink>
  );
}