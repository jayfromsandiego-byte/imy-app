// The Account room — who you are to us, and the two ways back in.
// A password is optional: the emailed link always works. Some families asked
// for a password they can hold; this is where they choose one.
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import SetPassword from "./SetPassword";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getUser();
  if (!user) redirect("/signin?next=/dashboard/account");

  return (
    <div className="stagger">
      <div className="panel-head">
        <div className="panel-title-row">
          <h1 className="panel-title">
            <span className="uline drawn">Your account</span>
          </h1>
        </div>
        <p className="panel-sub">The quiet details. Nothing here changes the tribute.</p>
      </div>

      <section style={{ marginTop: 28 }}>
        <h2 className="panel-title" style={{ fontSize: 20, marginBottom: 6 }}>Your email</h2>
        <p className="panel-sub" style={{ marginBottom: 6 }}>
          Sign-in links and the letters we send go to <b>{user.email}</b>.
        </p>
      </section>

      <div className="leaf-divider" aria-hidden="true">
        <span className="stem-line" />
        <svg viewBox="0 0 26 16">
          <path d="M13 8c-4-3-8-3-11 0 3 3 7 3 11 0z" fill="none" stroke="currentColor" strokeWidth="1.1" />
          <path d="M13 8c4-3 8-3 11 0-3 3-7 3-11 0z" fill="none" stroke="currentColor" strokeWidth="1.1" />
        </svg>
        <span className="stem-line" />
      </div>

      <section style={{ marginTop: 8 }}>
        <h2 className="panel-title" style={{ fontSize: 20, marginBottom: 6 }}>A password, if you'd like one</h2>
        <p className="panel-sub" style={{ marginBottom: 20 }}>
          The emailed link always works. A password simply adds a second way in — set it once,
          use it at sign-in whenever you prefer.
        </p>
        <SetPassword />
      </section>

      <div className="leaf-divider" aria-hidden="true">
        <span className="stem-line" />
        <svg viewBox="0 0 26 16">
          <path d="M13 8c-4-3-8-3-11 0 3 3 7 3 11 0z" fill="none" stroke="currentColor" strokeWidth="1.1" />
          <path d="M13 8c4-3 8-3 11 0-3 3-7 3-11 0z" fill="none" stroke="currentColor" strokeWidth="1.1" />
        </svg>
        <span className="stem-line" />
      </div>

      <section style={{ marginTop: 8 }}>
        <h2 className="panel-title" style={{ fontSize: 20, marginBottom: 6 }}>Leaving the desk</h2>
        <p className="panel-sub" style={{ marginBottom: 14 }}>Sign out on this device. Everything stays exactly where you left it.</p>
        <form action="/auth/signout" method="post">
          <button type="submit" className="btn quiet">Sign out</button>
        </form>
      </section>
    </div>
  );
}
