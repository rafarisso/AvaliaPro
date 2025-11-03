import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getSupabase } from "@/services/supabaseClient";
import { getMyProfile } from "@/services/profile";
import { listMyAssessments } from "@/services/assessments";
import { listMyLessonPlans } from "@/services/lessonPlans";
import { listMySlideDecks } from "@/services/slides";

type SchoolInfo = {
  name: string;
  city?: string | null;
  state?: string | null;
  shift?: string | null;
};

export default function Dashboard() {
  const { user, profile: authProfile } = useAuth();
  const supabase = useMemo(() => getSupabase(), []);

  const [profile, setProfile] = useState<any>(authProfile);
  const [grades, setGrades] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [schools, setSchools] = useState<SchoolInfo[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [decks, setDecks] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        const prof = await getMyProfile();
        setProfile(prof);
        if (Array.isArray(prof?.teaching_grade_levels)) {
          setGrades(prof.teaching_grade_levels as string[]);
        }
      } catch (error) {
        console.warn("[Dashboard] falha ao carregar perfil:", error);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        const [assess, lesson, slide] = await Promise.all([
          listMyAssessments(user.id),
          listMyLessonPlans(user.id),
          listMySlideDecks(user.id),
        ]);
        setAssessments(assess);
        setPlans(lesson);
        setDecks(slide);
      } catch (error) {
        console.warn("[Dashboard] falha ao carregar listas recentes:", error);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        const { data: subjRows } = await supabase
          .from("teacher_subjects")
          .select("subjects(name)")
          .eq("profile_id", user.id);
        const names = (subjRows ?? [])
          .map((row: any) => row.subjects?.name)
          .filter(Boolean) as string[];
        setSubjects(Array.from(new Set(names)));
      } catch (error) {
        console.warn("[Dashboard] falha ao carregar disciplinas:", error);
      }
    })();
  }, [supabase, user]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        const { data: schoolRows } = await supabase
          .from("teacher_schools")
          .select("shift, schools(name, city, state)")
          .eq("profile_id", user.id);
        const formatted =
          schoolRows?.map((row: any) => ({
            name: row.schools?.name ?? "",
            city: row.schools?.city,
            state: row.schools?.state,
            shift: row.shift,
          })) ?? [];
        setSchools(formatted.filter((s) => s.name));
      } catch (error) {
        console.warn("[Dashboard] falha ao carregar escolas:", error);
      }
    })();
  }, [supabase, user]);

  const displayName = profile?.full_name || authProfile?.full_name || user?.email || "professor(a)";

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900">Olá, {displayName} 👋</h1>
          <p className="text-sm text-gray-600">Atalhos personalizados para suas turmas e disciplinas.</p>
        </header>

        <section className="mb-8 space-y-3">
          {grades.length ? (
            <div className="flex flex-wrap gap-2">
              {grades.map((grade) => (
                <span key={grade} className="chip bg-blue-50 text-blue-700">
                  {grade}
                </span>
              ))}
            </div>
          ) : null}
          {subjects.length ? (
            <div className="flex flex-wrap gap-2">
              {subjects.map((subject) => (
                <span key={subject} className="chip bg-emerald-50 text-emerald-700">
                  {subject}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Link to="/avaliacoes/nova" className="card hover:shadow-lg transition">
            <div className="text-lg font-semibold text-gray-900">Criar avaliação</div>
            <p className="text-sm text-gray-600">Monte provas alinhadas à BNCC em minutos.</p>
          </Link>
          <Link to="/planos/nova" className="card hover:shadow-lg transition">
            <div className="text-lg font-semibold text-gray-900">Plano de aula</div>
            <p className="text-sm text-gray-600">Organize objetivos, materiais e sequência didática.</p>
          </Link>
          <Link to="/slides/novo" className="card hover:shadow-lg transition">
            <div className="text-lg font-semibold text-gray-900">Gerar slides</div>
            <p className="text-sm text-gray-600">Apresente conteúdos com bullets e prompts visuais.</p>
          </Link>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900">Avaliações recentes</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {assessments.slice(0, 3).map((item: any) => (
                <li key={item.id}>{item.title}</li>
              ))}
              {!assessments.length ? <li className="text-gray-500">Nenhuma avaliação salva ainda.</li> : null}
            </ul>
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900">Planos recentes</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {plans.slice(0, 3).map((item: any) => (
                <li key={item.id}>{item.title}</li>
              ))}
              {!plans.length ? <li className="text-gray-500">Nenhum plano salvo ainda.</li> : null}
            </ul>
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900">Slides recentes</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {decks.slice(0, 3).map((item: any) => (
                <li key={item.id}>{item.title}</li>
              ))}
              {!decks.length ? <li className="text-gray-500">Nenhum deck salvo ainda.</li> : null}
            </ul>
          </div>
        </section>

        <section className="mt-8 card">
          <h2 className="text-xl font-semibold text-gray-900">Minhas escolas</h2>
          {schools.length ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {schools.map((school, index) => (
                <div key={`${school.name}-${index}`} className="rounded-xl border border-gray-100 p-4">
                  <p className="font-semibold text-gray-900">{school.name}</p>
                  <p className="text-sm text-gray-600">
                    {[school.city, school.state].filter(Boolean).join(" / ")} • {school.shift ?? "manhã"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-600">
              Adicione suas escolas no onboarding para organizar os turnos e turmas.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
