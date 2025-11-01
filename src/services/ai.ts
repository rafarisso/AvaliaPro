export type FileContent = { mimeType: string; data: string; name?: string };

async function post(path: string, body: unknown) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI error: ${res.status} - ${text}`);
  }
  return res.json();
}

export async function generateText(prompt: string, files: FileContent[] = [], system?: string) {
  const data = await post("/.netlify/functions/generate", { kind: "text", system, prompt, files });
  return (data as { text: string }).text;
}

export async function generateSlidesOutline(prompt: string, files: FileContent[] = [], system?: string) {
  const data = await post("/.netlify/functions/generate", {
    kind: "slides-outline",
    system,
    prompt,
    files,
  });
  return (data as { text: string }).text;
}

export async function aiGenerateStructured(
  kind: "assessment" | "rubric",
  prompt: string,
  files: FileContent[] = []
) {
  return post("/.netlify/functions/generate-structured", { kind, prompt, files });
}

export async function aiTutorQA(question: string, files: FileContent[] = []) {
  return post("/.netlify/functions/qa", { question, files });
}

export async function callAI(fn: "generate-structured" | "generate-lesson-plan" | "generate-slides", payload: any) {
  const res = await fetch(`/.netlify/functions/${fn}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`AI function error: ${res.status} ${msg}`);
  }
  return await res.json();
}
