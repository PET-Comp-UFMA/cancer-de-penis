import type { NextApiResponse } from 'next';
export function authError(res: NextApiResponse, error: unknown) {
  const code = error instanceof Error ? error.message : '';
  const errors: Record<string, [number, string]> = {
    UNAUTHENTICATED: [401, 'Sua sessão expirou. Entre novamente.'],
    INVALID_CREDENTIALS: [401, 'Usuário ou senha inválidos.'],
    FORBIDDEN: [403, 'Acesso não autorizado. Atualize a página e tente novamente.'],
    PASSWORD_CHANGE_REQUIRED: [403, 'Troque a senha temporária para continuar.'],
    INVALID_REQUEST: [400, 'Confira os campos informados.'],
    FORM_INVALID_DEFINITION: [400, 'A definição do formulário é inválida.'],
    FORM_PUBLISHED_CANNOT_EDIT: [409, 'Retire o formulário da publicação antes de editá-lo.'],
    FORM_REVISION_CONFLICT: [409, 'O formulário foi alterado. Recarregue antes de salvar.'],
    FORM_NOT_FOUND: [404, 'Formulário não encontrado.'],
    FORM_NOT_PUBLISHED: [404, 'Formulário não publicado.'],
    FORM_NOT_READY: [409, 'Complete o formulário antes de publicá-lo.'],
    FORM_PUBLISHED_CANNOT_DELETE: [409, 'Retire o formulário da publicação antes de excluí-lo.'],
    INVALID_PASSWORD: [400, 'Use uma senha diferente da atual, com 12 a 128 caracteres.'],
    INVALID_CURRENT_PASSWORD: [400, 'A senha atual está incorreta. Confira e tente novamente.'],
    RATE_LIMITED: [429, 'Muitas tentativas. Aguarde 15 minutos e tente novamente.'],
  };
  const publicCode = Object.prototype.hasOwnProperty.call(errors, code) ? code : 'INTERNAL_ERROR';
  const [status, message] = errors[publicCode] || [503, 'Serviço temporariamente indisponível. Tente novamente.'];
  if (status === 429) res.setHeader('Retry-After', '900');
  return res.status(status).json({ error: message, code: publicCode });
}
export function methodNotAllowed(res: NextApiResponse, method: string) {
  res.setHeader('Allow', method);
  return res.status(405).json({ error: 'Método não permitido.' });
}
