/** Traduz e contextualiza erros comuns do Supabase Auth para o utilizador. */
export function mensagemErroAutenticacao(mensagemOriginal: string): string {
  const raw = mensagemOriginal.trim();
  const m = raw.toLowerCase();

  if (
    m.includes("invalid login credentials") ||
    m.includes("invalid credentials")
  ) {
    return "E-mail ou senha incorretos — ou a conta ainda não foi confirmada por e-mail (abra a mensagem «Confirmar registo»). Depois de confirmar, tente de novo. Quem usa só o Google pode entrar pelo Google ou usar «Esqueci a senha».";
  }

  if (m.includes("email not confirmed")) {
    return "Confirme o e-mail antes de entrar com senha (abra a mensagem que enviamos ao criar a conta) ou use o link mágico.";
  }

  if (
    m.includes("email address not authorized") ||
    m.includes("not authorized to receive")
  ) {
    return "Este e-mail não pode receber mensagens do servidor de e-mail de teste do Supabase. Soluções: (1) adicionar o e-mail à equipa da organização no painel Supabase, ou (2) configurar SMTP personalizado em Authentication → SMTP Settings — https://supabase.com/docs/guides/auth/auth-smtp";
  }

  if (
    m.includes("user already registered") ||
    m.includes("already been registered")
  ) {
    return "Já existe conta com este e-mail. Use «Entrar» ou «Esqueci a senha».";
  }

  return raw;
}
