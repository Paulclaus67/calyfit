"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  CalendarDays,
  Dumbbell,
  UploadCloud,
} from "lucide-react";

type NavItem = {
  key: "today" | "planning" | "sessions" | "import";
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { key: "today", href: "/", label: "Aujourd'hui", icon: Home },
  { key: "planning", href: "/planning", label: "Planning", icon: CalendarDays },
  { key: "sessions", href: "/sessions", label: "Séances", icon: Dumbbell },
  { key: "import", href: "/import", label: "Import", icon: UploadCloud },
];

function isPathActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="
        fixed inset-x-0 bottom-0 z-30
        border-t border-slate-800/90
        bg-slate-950/90
        backdrop-blur-md
      "
      aria-label="Navigation principale"
    >
      <div className="mx-auto max-w-md px-3">
        {/* safe-area bottom */}
        <div className="pb-[calc(env(safe-area-inset-bottom,0px)+0.35rem)] pt-1.5">
          <div className="relative flex items-center justify-between gap-1 rounded-2xl bg-slate-900/70 px-2 py-1 shadow-[0_-6px_20px_rgba(0,0,0,0.7)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isPathActive(pathname, item.href);

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className="relative flex flex-1 items-center justify-center"
                >
                  {/* fond animé sous l’onglet actif */}
                  {active && (
                    <motion.div
                      layoutId="nav-active-pill"
                      className="
                        absolute inset-y-0 w-full
                        rounded-2xl
                        bg-slate-800
                      "
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                        mass: 0.8,
                      }}
                    />
                  )}

                  <div className="relative flex flex-col items-center justify-center py-1">
                    <Icon
                      className={
                        "h-5 w-5 " +
                        (active
                          ? "text-sky-300"
                          : "text-slate-400 group-hover:text-slate-200")
                      }
                    />
                    <span
                      className={
                        "mt-0.5 text-[10px] font-medium " +
                        (active ? "text-sky-100" : "text-slate-400")
                      }
                    >
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
