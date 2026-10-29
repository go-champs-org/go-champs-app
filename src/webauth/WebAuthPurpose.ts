export type WebAuthPurpose = 'signUp' | 'accountRecovery' | 'accountCredentials';

export const webAuthCopy: Record<
  WebAuthPurpose,
  { title: string; description: string; action: string }
> = {
  signUp: {
    title: 'Criar conta',
    description: 'O cadastro é feito no site da Go Champs para validar o captcha com segurança.',
    action: 'Abrir cadastro',
  },
  accountRecovery: {
    title: 'Recuperar conta',
    description: 'Recupere o acesso no site oficial. Depois volte ao app para entrar.',
    action: 'Abrir recuperação',
  },
  accountCredentials: {
    title: 'Alterar e-mail ou senha',
    description: 'Atualize suas credenciais no site. Depois volte e entre novamente se necessário.',
    action: 'Abrir alteração',
  },
};
