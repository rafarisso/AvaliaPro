import { isBillingEnabled } from "../services/flags"

type AccessCheckResult = {
  allowed: boolean
  reason?: string
}

export async function checkAccess(user: any): Promise<AccessCheckResult> {
  if (!user) return { allowed: false, reason: "Usuário não autenticado." }

  const billing = await isBillingEnabled()
  if (!billing) return { allowed: true }

  if (user?.assinatura_status === "ativa") return { allowed: true }
  return { allowed: false, reason: "Plano indisponível." }
}
