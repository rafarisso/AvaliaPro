import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Menu, X } from "lucide-react"

const LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/avaliacoes/nova", label: "Criar avaliação" },
  { to: "/turmas", label: "Turmas" },
  { to: "/aplicacoes", label: "Aplicar/corrigir" },
  { to: "/modelos", label: "Criar slides" },
]

export default function Header() {
  const isDev = Boolean(import.meta.env?.DEV)
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  const links = isDev ? [...LINKS, { to: "/health", label: "Health" }] : LINKS

  return (
    <header className="w-full border-b bg-white/70 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/dashboard" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <img src="/AvaliaPro_logo.svg" alt="AvaliaPro" className="h-7" />
        </Link>

        {/* Navegação desktop */}
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={
                pathname === l.to
                  ? "font-medium text-black"
                  : "text-gray-700 transition hover:text-black"
              }
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Botão mobile */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 md:hidden"
          aria-label="Abrir menu"
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Menu mobile */}
      {open && (
        <nav className="border-t bg-white md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-2">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={
                  "rounded-lg px-3 py-2 text-sm " +
                  (pathname === l.to
                    ? "bg-blue-50 font-medium text-blue-700"
                    : "text-gray-700 hover:bg-gray-50")
                }
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}
