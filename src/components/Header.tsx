import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const CREATE_LINKS = [
  { label: "Slides (IA)", to: "/create/slides" },
  { label: "Avaliacao", to: "/create/assessment" },
  { label: "Avaliacao adaptada", to: "/create/assessment/adapted" },
  { label: "Plano de aula", to: "/create/lesson-plan" },
  { label: "Rubrica", to: "/create/rubric" },
  { label: "Tutor IA", to: "/tutor" },
];

const MAIN_LINKS = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Minhas criacoes", to: "/my-creations" },
  { label: "Modelos", to: "/modelos" },
  { label: "Relatorios", to: "/relatorios" },
  { label: "Importar alunos", to: "/import/students" },
];

export default function Header() {
  const isDev = Boolean(import.meta.env?.DEV);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  const homeHref = user ? "/dashboard" : "/";

  const toggleMobile = () => setMobileOpen((open) => !open);
  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="w-full border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link to={homeHref} className="flex items-center gap-2">
            <img src="/AvaliaPro_logo.svg" alt="AvaliaPro" className="h-7" />
            <span className="hidden text-sm font-semibold text-gray-800 sm:inline">AvaliaPro</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-6 text-sm text-gray-700 md:flex">
          <Link to={homeHref} className="hover:text-black">
            Inicio
          </Link>
          {user ? (
            <>
              <details className="relative group">
                <summary className="flex cursor-pointer list-none items-center gap-1 hover:text-black [&::-webkit-details-marker]:hidden">
                  Criar
                  <span className="text-xs text-gray-500 transition group-open:rotate-180">⌄</span>
                </summary>
                <div className="absolute right-0 z-30 mt-2 w-56 rounded-xl border bg-white p-2 text-sm shadow-xl">
                  {CREATE_LINKS.map((item) => (
                    <Link key={item.to} to={item.to} className="block rounded-lg px-3 py-2 hover:bg-gray-100">
                      {item.label}
                    </Link>
                  ))}
                </div>
              </details>
              {MAIN_LINKS.map((item) => (
                <Link key={item.to} to={item.to} className="hover:text-black">
                  {item.label}
                </Link>
              ))}
              <button
                type="button"
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
                onClick={() => logout().catch(() => undefined)}
              >
                Sair
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
            >
              Entrar
            </Link>
          )}
          {isDev ? (
            <Link to="/health" className="text-gray-500 hover:text-black">
              Health
            </Link>
          ) : null}
        </nav>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-xl border border-gray-200 p-2 text-gray-700 md:hidden"
          aria-label="Abrir menu"
          onClick={toggleMobile}
        >
          <span className="h-0.5 w-5 bg-current" />
          <span className="mt-1.5 h-0.5 w-5 bg-current" />
          <span className="mt-1.5 h-0.5 w-5 bg-current" />
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-gray-200 bg-white md:hidden">
          <div className="space-y-4 px-6 py-5 text-sm text-gray-700">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">Navegacao</p>
              <div className="grid gap-2">
                <Link className="rounded-lg border border-gray-200 px-3 py-2" to={homeHref} onClick={closeMobile}>
                  Inicio
                </Link>
                {user
                  ? MAIN_LINKS.map((item) => (
                      <Link
                        key={item.to}
                        className="rounded-lg border border-gray-200 px-3 py-2"
                        to={item.to}
                        onClick={closeMobile}
                      >
                        {item.label}
                      </Link>
                    ))
                  : null}
              </div>
            </div>

            {user ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Criar</p>
                <div className="grid gap-2">
                  {CREATE_LINKS.map((item) => (
                    <Link
                      key={item.to}
                      className="rounded-lg border border-gray-200 px-3 py-2"
                      to={item.to}
                      onClick={closeMobile}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
                <button
                  type="button"
                  className="w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-center font-semibold text-blue-700"
                  onClick={() => {
                    closeMobile();
                    void logout();
                  }}
                >
                  Sair
                </button>
              </div>
            ) : (
              <Link
                className="block rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-center font-semibold text-blue-700"
                to="/login"
                onClick={closeMobile}
              >
                Entrar
              </Link>
            )}
            {isDev ? (
              <Link className="rounded-lg border border-gray-200 px-3 py-2 text-gray-500" to="/health" onClick={closeMobile}>
                Health
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
