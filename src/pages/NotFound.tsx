import { Link } from "react-router-dom";
import logoUrl from "../logo.svg";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      <img src={logoUrl} alt="Fest Kerala" className="w-12 h-12 mb-5 object-contain" />
      <h1
        className="text-white font-extrabold mb-2"
        style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.2rem, 6vw, 3.5rem)" }}
      >
        404
      </h1>
      <p
        className="text-sm mb-6"
        style={{ color: "#888", fontFamily: "var(--font-mono)" }}
      >
        This page doesn't exist on Fest Kerala.
      </p>
      <Link
        to="/"
        className="btn-glow"
        style={{ padding: "10px 20px", borderRadius: 12, fontSize: 14, textDecoration: "none" }}
      >
        Back to Home
      </Link>
    </div>
  );
}