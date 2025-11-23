import { getSupabase } from "./supabaseClient"

export async function isBillingEnabled(): Promise<boolean> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "billing_enabled")
    .maybeSingle()
  if (error) {
    console.warn("[flags] billing flag ausente ou indisponivel", error)
    return false
  }
  return data?.value?.value === true
}
