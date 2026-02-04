import "../_styles/theme.css";

type AppHeaderProps = {
  title: string;
  subtitle: string;
  email: string;
  isAdmin: boolean;
};

export default function AppHeader({ title, subtitle, email, isAdmin }: AppHeaderProps) {
  return (
    <header
      style={{
        padding: 18,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "grid", gap: 4 }}>
        <div style={{ fontWeight: 750, letterSpacing: "-0.02em" }}>{title}</div>
        <div style={{ fontSize: 12, opacity: 0.72 }}>{subtitle}</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <a className="cb-pill" href="/search">
          Search
        </a>
        <a className="cb-pill" href="/tasks">
          Tasks
        </a>
        <a className="cb-pill" href="/notes">
          Notes
        </a>
        <a className="cb-pill" href="/kanban">
          Boards
        </a>
        <a className="cb-pill" href="/activity">
          Activity
        </a>
        {isAdmin ? (
          <a className="cb-pill" href="/admin">
            Admin
          </a>
        ) : null}
        <span className="cb-pill">{email}</span>
        <form action="/auth/signout" method="post">
          <button className="cb-btn cb-btn-secondary" type="submit">
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
