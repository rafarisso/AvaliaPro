import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import PrototypeBanner from "../components/PrototypeBanner";
import { BILLING_ENABLED, SHOW_PROTOTYPE_BANNER } from "../flags";
import { auditEvent, useAuth } from "@/hooks/useAuth";
import { getSupabase } from "@/services/supabaseClient";
import { listMyAssessments } from "@/services/assessments";
import { listMyLessonPlans } from "@/services/lessonPlans";
import { listMySlideDecks } from "@/services/slides";

type RecentEvent = {
  id: string;
  event: string;
  created_at: string;
  meta?: Record<string, unknown> | null;
};

export default function Dashboard() {
  const { user, profile, logout } = useAuth();
  const supabase = useMemo(() => getSupabase(), []);

  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [lastCreation, setLastCreation] = useState<{ label: string; href: string } | null>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [decks, setDecks] = useState<any[]>([]);

  useEffect(() => {
    void auditEvent("dashboard_view");
  }, []);

  useEffect(() => {
    if (!user) return;

    const loadEvents = async () => {
      const { data, error } = await supabase
        .from("user_events")
        .select("id,event,created_at,meta")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(12);

      if (error) {
        console.warn("[Dashboard] erro ao buscar eventos:", error);
        return;
      }

      const events = (data as RecentEvent[]) ?? [];
      setRecentEvents(events);

      const last = events.find((evt) =>
        [
          "assessment_created",
          "rubric_created",
          "slides_template_saved",
          "lesson_plan_template_saved",
          "adapted_assessment_template_saved",
        ].includes(evt.event)
      );

      if (!last) {
        setLastCreation(null);
        return;
      }

      const mapping: Record<string, { label: string; href: string }> = {
        assessment_created: { label: "Avaliacao", href: "/avaliacoes/nova" },
        rubric_created: { label: "Rubrica", href: "/create/rubric" },
        slides_template_saved: { label: "Slides", href: "/slides/novo" },
        lesson_plan_template_saved: { label: "Plano de aula", href: "/planos/nova" },
        adapted_assessment_template_saved: { label: "Avaliacao adaptada", href: "/create/assessment/adapted" },
      };

      setLastCreation(mapping[last.event]);
    };

    void loadEvents();
  }, [supabase, user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [myAssessments, myPlans, myDecks] = await Promise.all([
          listMyAssessments(user.id),
          listMyLessonPlans(user.id),
          listMySlideDecks(user.id),
        ]);
        setAssessments(myAssessments);
        setPlans(myPlans);
        setDecks(myDecks);
      } catch (error) {
        console.warn("[Dashboard] erro ao carregar listas recentes:", error);
      }
    })();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      {SHOW_PROTOTYPE_BANNER ? <PrototypeBanner /> : null}
      <Header />

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <header className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">AvaliaPro</p>
            <h1 className="text-3xl font-semibold text-gray-900">Bem-vindo ao painel</h1>
            <p className="text-sm text-gray-600">
              Crie avaliacoes, planos e slides com IA. Tudo fica salvo no Supabase para acompanhar depois.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 text-sm text-gray-600">
            <span>
              Usuario logado: <strong>{user?.email ?? "visitante@avaliapro.com"}</strong>
            </span>
            {profile?.full_name ? <span>Nome: {profile.full_name}</span> : null}
            {user ? (
              <button
                onClick={logout}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Sair
              </button>
            ) : null}
          </div>
        </header>

        {BILLING_ENABLED ? (
          <section className="rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-6 text-sm text-blue-700 shadow-inner">
            Stripe desativado neste ambiente. Quando ativarmos cobranca, os planos aparecem aqui.
          </section>
        ) : (
          <section className="rounded-2xl border border-blue-100 bg-white p-6 text-sm text-blue-700 shadow">
            Modo completo liberado para testes. Use os fluxos e compartilhe feedback com o time.
          </section>
        )}

        {lastCreation ? (
          <section className="rounded-2xl border bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900">Continue de onde parou</h2>
            <p className="mt-2 text-sm text-gray-600">
              Retome o ultimo conteudo criado para finalizar ajustes ou compartilhar.
            </p>
            <Link
              to={lastCreation.href}
              className="mt-4 inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Abrir {lastCreation.label}
            </Link>
          </section>
        ) : null}

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Atalhos rapidos</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link to="/avaliacoes/nova" className="block rounded-lg bg-white p-5 text-sm font-semibold text-gray-800 shadow transition hover:shadow-lg">
              Criar avaliacao
            </Link>
            <Link to="/planos/nova" className="block rounded-lg bg-white p-5 text-sm font-semibold text-gray-800 shadow transition hover:shadow-lg">
              Plano de aula
            </Link>
            <Link to="/slides/novo" className="block rounded-lg bg-white p-5 text-sm font-semibold text-gray-800 shadow transition hover:shadow-lg">
              Gerar slides
            </Link>
            <Link
              to="/create/assessment/adapted"
              className="block rounded-lg bg-white p-5 text-sm font-semibold text-gray-800 shadow transition hover:shadow-lg"
            >
              Avaliacao adaptada
            </Link>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          <CardList title="Minhas avaliacoes" emptyMessage="Sem avaliacoes recentes" items={assessments} />
          <CardList title="Planos de aula" emptyMessage="Sem planos recentes" items={plans} />
          <CardList title="Slides" emptyMessage="Sem decks recentes" items={decks} />
        </div>

        <section className="grid gap-4 md:grid-cols-[2fr,1fr]">
          <div className="rounded-2xl bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">Atividades recentes</h3>
            {recentEvents.length ? (
              <ul className="mt-4 space-y-3 text-sm text-gray-700">
                {recentEvents.slice(0, 6).map((event) => (
                  <li key={event.id} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{formatEventName(event.event)}</p>
                      {event.meta?.titulo ? (
                        <p className="text-xs text-gray-500">{String(event.meta.titulo)}</p>
                      ) : null}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(event.created_at).toLocaleString("pt-BR")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-gray-500">
                Gere ou salve conteudos para acompanhar o historico por aqui.
              </p>
            )}
          </div>
          <div className="rounded-2xl bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-900">Proximos passos</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>- Conectar IA para sugestoes de questoes adaptadas.</li>
              <li>- Importar planilhas de notas para cruzar com avaliacoes.</li>
              <li>- Exportar relatorios em PDF com personalizacao.</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}

function CardList({
  title,
  emptyMessage,
  items,
}: {
  title: string;
  emptyMessage: string;
  items: { id: string; title: string }[];
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {items.length ? (
        <ul className="mt-3 space-y-2 text-sm text-gray-700">
          {items.slice(0, 3).map((item) => (
            <li key={item.id} className="truncate">
              {item.title}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-gray-500">{emptyMessage}</p>
      )}
    </div>
  );
}

function formatEventName(event: string) {
  const mapping: Record<string, string> = {
    assessment_structured_generated: "Avaliacao estruturada gerada",
    assessment_created: "Avaliacao salva",
    rubric_generated: "Rubrica gerada",
    rubric_created: "Rubrica salva",
    slides_outline_generated: "Slides gerados",
    slides_template_saved: "Slides salvos",
    lesson_plan_ai_generated: "Plano de aula gerado",
    lesson_plan_template_saved: "Plano de aula salvo",
    adapted_assessment_ai_generated: "Avaliacao adaptada gerada",
    adapted_assessment_template_saved: "Avaliacao adaptada salva",
    tutor_answered: "Tutor IA respondido",
    students_imported: "Alunos importados",
  };
  return mapping[event] ?? event;
}
