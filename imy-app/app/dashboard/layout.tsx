import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
const C = { cream: "#FAF5EC", ink: "#2C2520", inkSoft: "#5A4F45", terra: "#A87C5F", line: "#E4D9C4" };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/signin?next=/dashboard");
  return (
    <div style={{ minHeight: "100vh", background: C.cream, color: C.ink, fontFamily: "'Besley',Georgia,serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Besley:ital,wght@0,400;0,600;0,700;1,500&family=Sometype+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <header style={{ borderBottom: `1px solid ${C.line}`, background: "rgba(250,245,236,.92)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "14px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <a href="/dashboard" style={{ fontSize: 18, fontWeight: 600, color: C.ink, textDecoration: "none" }}>I <em style={{ color: C.terra }}>Miss</em> You Memorial</a>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 13, color: C.inkSoft }}>
            <span style={{ fontFamily: "'Sometype Mono',monospace" }}>{user.email}</span>
            <form action="/auth/signout" method="post">
              <button type="submit" style={{ background: "none", border: `1px solid ${C.line}`, borderRadius: 20, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit", color: C.ink }}>Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "30px 22px 70px" }}>{children}</main>
    </div>
  );
}
