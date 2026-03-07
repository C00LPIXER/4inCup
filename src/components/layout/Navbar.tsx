import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Trophy,
  Users,
  Calendar,
  BarChart3,
  Shield,
  Home,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const publicNav: NavItem[] = [
  { label: "Home", href: "/", icon: <Home className="h-4 w-4" /> },
  { label: "Teams", href: "/teams", icon: <Shield className="h-4 w-4" /> },
  { label: "Fixtures", href: "/fixtures", icon: <Calendar className="h-4 w-4" /> },
  { label: "Standings", href: "/standings", icon: <BarChart3 className="h-4 w-4" /> },
  { label: "Players", href: "/players", icon: <Users className="h-4 w-4" /> },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: <Home className="h-4 w-4" /> },
  { label: "Players", href: "/admin/players", icon: <Users className="h-4 w-4" /> },
  { label: "Teams", href: "/admin/teams", icon: <Shield className="h-4 w-4" /> },
  { label: "Matches", href: "/admin/matches", icon: <Calendar className="h-4 w-4" /> },
  { label: "Standings", href: "/admin/standings", icon: <BarChart3 className="h-4 w-4" /> },
];

interface NavbarProps {
  isAdmin?: boolean;
  championshipId?: string;
}

export function Navbar({ isAdmin = false }: NavbarProps) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = isAdmin ? adminNav : publicNav;

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            to={isAdmin ? "/admin" : "/"}
            className="flex items-center gap-2"
          >
            <Trophy className="h-7 w-7 text-primary" />
            <div className="flex flex-col">
              <span className="font-heading text-lg font-bold leading-tight text-foreground">
                4inCup
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                {isAdmin ? "ADMIN PANEL" : "CRICKET TOURNAMENT"}
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>

          {/* Admin/Public toggle */}
          <div className="hidden md:flex items-center gap-2">
            <Link to={isAdmin ? "/" : "/admin"}>
              <Button variant="outline" size="sm">
                {isAdmin ? "View Public Site" : "Admin Panel"}
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4 animate-fade-in">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    location.pathname === item.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
              <Link
                to={isAdmin ? "/" : "/admin"}
                onClick={() => setMobileOpen(false)}
                className="mt-2"
              >
                <Button variant="outline" size="sm" className="w-full">
                  {isAdmin ? "View Public Site" : "Admin Panel"}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
