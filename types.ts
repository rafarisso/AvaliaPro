
import { User as SupabaseUser } from '@supabase/supabase-js';

// Helper for JSON columns
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Estrutura do usuário alinhada com a tabela 'usuarios' e metadados do auth
export type User = SupabaseUser & {
  nome?: string;
  materias?: string[];
  escola_id?: string; // uuid
  subscription_status?: 'premium' | 'free' | 'trialing';
  trial_ends_at?: string; // ISO 8601 date string
};

// --- Tipos baseados no esquema SQL real ---

// FIX: Changed all database entity interfaces to type aliases to fix Supabase type inference.
export type Escola = {
  id: string; // uuid
  nome: string;
  logotipo_url?: string | null;
  cidade?: string | null;
  uf?: string | null;
  criado_em: string;
};

// FIX: Changed all database entity interfaces to type aliases to fix Supabase type inference.
export type Usuario = {
  id: string; // uuid, foreign key to auth.users
  nome: string;
  email: string;
  materias?: string[] | null;
  escola_id?: string | null; // uuid
  assinatura_status?: string;
  criado_em: string;
};

// FIX: Changed all database entity interfaces to type aliases to fix Supabase type inference.
export type Turma = {
  id: string; // uuid
  nome: string;
  serie?: string | null;
  escola_id: string | null; // uuid
  criado_por?: string | null; // uuid
  criado_em: string;
};

// FIX: Changed all database entity interfaces to type aliases to fix Supabase type inference.
export type Aluno = {
  id: string; // uuid
  nome: string;
  turma_id: string | null; // uuid
  escola_id: string | null; // uuid
  criado_em: string;
};

// FIX: Changed all database entity interfaces to type aliases to fix Supabase type inference.
export type Avaliacao = {
  id: string; // uuid
  titulo: string | null;
  disciplina: string | null;
  serie: string | null;
  tema: string | null;
  total_questoes: number | null;
  objetivas: number | null;
  dissertativas: number | null;
  valor_questao: number | null;
  frase_incentivo: string | null;
  assinatura_professor: string | null;
  escola_id: string | null; // uuid
  criado_por: string | null; // uuid
  arquivo_docx: string | null;
  arquivo_pdf: string | null;
  arquivo_gabarito: string | null;
  criado_em: string;
};

// FIX: Changed all database entity interfaces to type aliases to fix Supabase type inference.
export type Questao = {
  id: string; // uuid
  avaliacao_id: string | null; // uuid
  tipo: 'objetiva' | 'dissertativa' | null;
  enunciado: string | null;
  alternativas: Json | null;
  resposta_correta: string | null;
  valor: number | null;
  escola_id: string | null; // uuid
};

// FIX: Changed all database entity interfaces to type aliases to fix Supabase type inference.
export type Relatorio = {
  id: string; // uuid
  aluno_id: string | null; // uuid
  avaliacao_id: string | null; // uuid
  texto: string | null;
  escola_id: string | null; // uuid
  criado_por: string | null; // uuid
  criado_em: string;
};

// FIX: Changed all database entity interfaces to type aliases to fix Supabase type inference.
export type Plano = {
  id: string; // uuid
  disciplina: string | null;
  tema: string | null;
  objetivos: string | null;
  metodologia: string | null;
  recursos: string | null;
  avaliacao: string | null;
  arquivo_pdf: string | null;
  escola_id: string | null; // uuid
  criado_por: string | null; // uuid
  criado_em: string;
};

// FIX: Changed all database entity interfaces to type aliases to fix Supabase type inference.
export type Apresentacao = {
  id: string; // uuid
  disciplina: string | null;
  tema: string | null;
  quantidade_slides: number | null;
  nivel: string | null;
  arquivo_pptx: string | null;
  arquivo_pdf: string | null;
  escola_id: string | null; // uuid
  criado_por: string | null; // uuid
  criado_em: string;
};

// FIX: Changed all database entity interfaces to type aliases to fix Supabase type inference.
export type Subscription = {
  id: string; // uuid
  usuario_id: string | null; // uuid
  plano: string | null;
  ativo: boolean | null;
  stripe_customer_id: string | null;
  stripe_session_id: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  criado_em: string;
};


// --- Tipos utilitários para a aplicação ---

// FIX: Converted interface to type for consistency.
export type Slide = {
    title: string;
    bullets: string[];
    teacherTip: string;
};

// FIX: Converted interface to type for consistency.
export type FileContent = {
  name: string;
  mimeType: string;
  data: string; // base64 encoded string
};

// FIX: Reverted the 'Database' definition from an interface back to a type alias.
// This resolves a deep type inference issue with the Supabase client where table
// schemas were not being correctly identified, leading to 'never' types for all
// database operations (select, insert, update).
export type Database = {
  public: {
    Tables: {
      alunos: {
        // FIX: Using type aliases for Row definitions to fix Supabase type inference issues.
        Row: Aluno;
        Insert: {
          id?: string;
          nome: string;
          turma_id: string | null;
          escola_id: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          turma_id?: string | null;
          escola_id?: string | null;
          criado_em?: string;
        };
        // FIX: Added Relationships property to ensure proper Supabase type inference.
        Relationships: [];
      };
      apresentacoes: {
        // FIX: Using type aliases for Row definitions to fix Supabase type inference issues.
        Row: Apresentacao;
        Insert: {
          id?: string;
          disciplina: string | null;
          tema: string | null;
          quantidade_slides: number | null;
          nivel: string | null;
          arquivo_pptx: string | null;
          arquivo_pdf: string | null;
          escola_id: string | null;
          criado_por: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          disciplina?: string | null;
          tema?: string | null;
          quantidade_slides?: number | null;
          nivel?: string | null;
          arquivo_pptx?: string | null;
          arquivo_pdf?: string | null;
          escola_id?: string | null;
          criado_por?: string | null;
          criado_em?: string;
        };
        // FIX: Added Relationships property to ensure proper Supabase type inference.
        Relationships: [];
      };
      avaliacoes: {
        // FIX: Using type aliases for Row definitions to fix Supabase type inference issues.
        Row: Avaliacao;
        Insert: {
          id?: string;
          titulo: string | null;
          disciplina: string | null;
          serie: string | null;
          tema: string | null;
          total_questoes: number | null;
          objetivas: number | null;
          dissertativas: number | null;
          valor_questao: number | null;
          frase_incentivo: string | null;
          assinatura_professor: string | null;
          escola_id: string | null;
          criado_por: string | null;
          arquivo_docx: string | null;
          arquivo_pdf: string | null;
          arquivo_gabarito: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          titulo?: string | null;
          disciplina?: string | null;
          serie?: string | null;
          tema?: string | null;
          total_questoes?: number | null;
          objetivas?: number | null;
          dissertativas?: number | null;
          valor_questao?: number | null;
          frase_incentivo?: string | null;
          assinatura_professor?: string | null;
          escola_id?: string | null;
          criado_por?: string | null;
          arquivo_docx?: string | null;
          arquivo_pdf?: string | null;
          arquivo_gabarito?: string | null;
          criado_em?: string;
        };
        // FIX: Added Relationships property to ensure proper Supabase type inference.
        Relationships: [];
      };
      escolas: {
        // FIX: Using type aliases for Row definitions to fix Supabase type inference issues.
        Row: Escola;
        Insert: {
          id?: string;
          nome: string;
          logotipo_url?: string | null;
          cidade?: string | null;
          uf?: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          logotipo_url?: string | null;
          cidade?: string | null;
          uf?: string | null;
          criado_em?: string;
        };
        // FIX: Added Relationships property to ensure proper Supabase type inference.
        Relationships: [];
      };
      planos: {
        // FIX: Using type aliases for Row definitions to fix Supabase type inference issues.
        Row: Plano;
        Insert: {
          id?: string;
          disciplina: string | null;
          tema: string | null;
          objetivos: string | null;
          metodologia: string | null;
          recursos: string | null;
          avaliacao: string | null;
          arquivo_pdf: string | null;
          escola_id: string | null;
          criado_por: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          disciplina?: string | null;
          tema?: string | null;
          objetivos?: string | null;
          metodologia?: string | null;
          recursos?: string | null;
          avaliacao?: string | null;
          arquivo_pdf?: string | null;
          escola_id?: string | null;
          criado_por?: string | null;
          criado_em?: string;
        };
        // FIX: Added Relationships property to ensure proper Supabase type inference.
        Relationships: [];
      };
      questoes: {
        // FIX: Using type aliases for Row definitions to fix Supabase type inference issues.
        Row: Questao;
        Insert: {
          id?: string;
          avaliacao_id: string | null;
          tipo?: 'objetiva' | 'dissertativa' | null;
          enunciado: string | null;
          alternativas: Json | null;
          resposta_correta: string | null;
          valor: number | null;
          escola_id: string | null;
        };
        Update: {
          id?: string;
          avaliacao_id?: string | null;
          tipo?: 'objetiva' | 'dissertativa' | null;
          enunciado?: string | null;
          alternativas?: Json | null;
          resposta_correta?: string | null;
          valor?: number | null;
          escola_id?: string | null;
        };
        // FIX: Added Relationships property to ensure proper Supabase type inference.
        Relationships: [];
      };
      relatorios: {
        // FIX: Using type aliases for Row definitions to fix Supabase type inference issues.
        Row: Relatorio;
        Insert: {
          id?: string;
          aluno_id: string | null;
          avaliacao_id: string | null;
          texto: string | null;
          escola_id: string | null;
          criado_por: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          aluno_id?: string | null;
          avaliacao_id?: string | null;
          texto?: string | null;
          escola_id?: string | null;
          criado_por?: string | null;
          criado_em?: string;
        };
        // FIX: Added Relationships property to ensure proper Supabase type inference.
        Relationships: [];
      };
      subscriptions: {
        // FIX: Using type aliases for Row definitions to fix Supabase type inference issues.
        Row: Subscription;
        Insert: {
          id?: string;
          usuario_id: string | null;
          plano: string | null;
          ativo: boolean | null;
          stripe_customer_id: string | null;
          stripe_session_id: string | null;
          data_inicio: string | null;
          data_fim: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          usuario_id?: string | null;
          plano?: string | null;
          ativo?: boolean | null;
          stripe_customer_id?: string | null;
          stripe_session_id?: string | null;
          data_inicio?: string | null;
          data_fim?: string | null;
          criado_em?: string;
        };
        // FIX: Added Relationships property to ensure proper Supabase type inference.
        Relationships: [];
      };
      turmas: {
        // FIX: Using type aliases for Row definitions to fix Supabase type inference issues.
        Row: Turma;
        Insert: {
          id?: string;
          nome: string;
          serie?: string | null;
          escola_id: string | null;
          criado_por?: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          serie?: string | null;
          escola_id?: string | null;
          criado_por?: string | null;
          criado_em?: string;
        };
        // FIX: Added Relationships property to ensure proper Supabase type inference.
        Relationships: [];
      };
      usuarios: {
        // FIX: Using type aliases for Row definitions to fix Supabase type inference issues.
        Row: Usuario;
        Insert: {
          id: string;
          nome: string;
          email: string;
          materias?: string[] | null;
          escola_id?: string | null;
          assinatura_status?: string;
          criado_em?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          email?: string;
          materias?: string[] | null;
          escola_id?: string | null;
          assinatura_status?: string;
          criado_em?: string;
        };
        // FIX: Added Relationships property to ensure proper Supabase type inference.
        Relationships: [];
      };
    };
    Views: {
      [key: string]: never
    };
    Functions: {
      [key: string]: never
    };
    Enums: {
      [key: string]: never
    };
    CompositeTypes: {
      [key: string]: never
    };
  };
};