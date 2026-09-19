import type { NextApiResponse } from 'next';
export function authError(res: NextApiResponse, error: unknown) {
  const code = error instanceof Error ? error.message : '';
  const errors: Record<string, [number, string]> = {
    UNAUTHENTICATED: [401, 'Sua sessão expirou. Entre novamente.'],
    INVALID_CREDENTIALS: [401, 'Usuário ou senha inválidos.'],
    FORBIDDEN: [403, 'Acesso não autorizado. Atualize a página e tente novamente.'],
    PASSWORD_CHANGE_REQUIRED: [403, 'Troque a senha temporária para continuar.'],
    INVALID_REQUEST: [400, 'Confira os campos informados.'],
    FORM_NOT_FOUND: [404, 'Formulário não encontrado.'],
    FORM_NOT_READY: [409, 'Complete o formulário antes de publicá-lo.'],
    FORM_PUBLISHED_CANNOT_DELETE: [409, 'Retire o formulário da publicação antes de excluí-lo.'],
    INVALID_PASSWORD: [400, 'Use uma senha diferente da atual, com 12 a 128 caracteres.'],
    INVALID_CURRENT_PASSWORD: [400, 'A senha atual está incorreta. Confira e tente novamente.'],
    RATE_LIMITED: [429, 'Muitas tentativas. Aguarde 15 minutos e tente novamente.'],
  };
  const [status, message] = errors[code] || [503, 'Serviço temporariamente indisponível. Tente novamente.'];
  if (status === 429) res.setHeader('Retry-After', '900');
  return res.status(status).json({ error: message });
}
export function methodNotAllowed(res: NextApiResponse, method: string) {
  res.setHeader('Allow', method);
  return res.status(405).json({ error: 'Método não permitido.' });
}
