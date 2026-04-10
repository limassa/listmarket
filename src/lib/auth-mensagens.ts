/** Traduz e contextualiza erros comuns do Supabase Auth para o utilizador. */
export function mensagemErroAutenticacao(mensagemOriginal: string): string {
  const raw = mensagemOriginal.trim();
  const m = raw.toLowerCase();

  if (
    m.includes("invalid login credentials") ||
    m.includes("invalid credentials")
  ) {
    return "E-mail ou senha incorretos. Se costuma entrar só com o Google, use «Continuar com Google» ou «Esqueci a senha» para criar uma senha neste e-mail.";
  }

  if (m.includes("email not confirmed")) {
    return "Confirme o e-mail antes de entrar com senha (abra a mensagem que enviamos ao criar a conta) ou use o link mágico.";
  }

  if (
    m.includes("user already registered") ||
    m.includes("already been registered")
  ) {
    return "Já existe conta com este e-mail. Use «Entrar» ou «Esqueci a senha».";
  }

  return raw;
}
