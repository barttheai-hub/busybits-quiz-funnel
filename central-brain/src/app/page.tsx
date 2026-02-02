import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Central Brain</h1>
      <p>Source of truth + tasks (you vs me). MVP in progress.</p>
      <ul>
        <li>
          <Link href="/login">Login</Link>
        </li>
        <li>
          <Link href="/tasks">Tasks</Link>
        </li>
      </ul>
    </main>
  );
}
