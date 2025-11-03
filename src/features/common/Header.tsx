import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Logo from "./icons/Logo";

export default function FeatureHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2">
          <Logo className="h-8 w-auto" />
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium text-gray-600">
          <Link to="/avaliacoes/nova" className="hidden rounded-full px-3 py-1 text-gray-600 hover:bg-gray-100 md:block">
            Avaliacoes
          </Link>
          <Link to="/planos/nova" className="hidden rounded-full px-3 py-1 text-gray-600 hover:bg-gray-100 md:block">
            Planos
          </Link>
          <Link to="/slides/novo" className="hidden rounded-full px-3 py-1 text-gray-600 hover:bg-gray-100 md:block">
            Slides
          </Link>
          {user ? (
            <button
              type="button"
              onClick={logout}
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
            >
              Sair
            </button>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
            >
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
