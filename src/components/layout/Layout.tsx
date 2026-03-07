import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()}{" "}
          <span className="font-semibold text-primary">4inDegree</span> —
          4inCup Cricket Tournament
        </p>
      </footer>
    </div>
  );
}

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar isAdmin />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
