# Publicacao iOS

## Estado em 2026-10-29

- Branch padrao: `main`; sem protecao remota configurada.
- Existem alteracoes locais de produto e SDK ainda sem commit.
- Projeto EAS: `wagnerassis/go-champs-app`, ID `07a87e62-c99e-4ceb-b2c4-0ff27a5544d5`.
- A sessao EAS local pertence a `comerciallucar`, sem acesso ao projeto acima.
- Bundle ID confirmado: `com.gochamps.app`, configurado em `app.json`.
- Equipe Apple confirmada: `H859MRQ6UP`, assinatura ativa segundo o usuario. Configurada em `app.json` e no perfil de envio EAS.
- Apple ID numerico confirmado: `6822873868`, configurado em `submit.production.ios.ascAppId`.
- `eas.json` define build de simulador e producao assinada com incremento remoto.
- Secret de repositorio `EXPO_TOKEN` confirmado no GitHub. O job `Expo access` valida remotamente o acesso ao projeto sem revelar o token.
- CI valida PRs e pushes na main. `iOS Production Build` escuta o CI concluido com sucesso apenas em pushes de main e faz checkout do SHA aprovado antes de construir e enviar ao TestFlight. Disparo manual tambem disponivel em main.
- PR existente #3 usa Fastlane/macOS; este fluxo EAS e uma alternativa, nao misturar os workflows sem reconciliar a estrategia.

## Validacao da preparacao

- TypeScript e 165 testes unitarios passaram: 98.82% linhas, 98.51% statements, 100% funcoes e 90.79% branches no escopo configurado.
- Lint passou sem erros ou avisos. Datas de partidas sao derivadas; campos do perfil sao preenchidos ao iniciar edicao; cargas assincronas usam efeitos com descarte de respostas antigas e refresh explicito.
- E2E: 87/87 passaram, 28/28 jornadas em Android Web, iOS WebKit e desktop. Corrigidos seletores de perfil/agenda e configurado linking tipado do navegador interno para preservar o historico web.
- JSON e YAML dos novos arquivos foram parseados com sucesso. `git diff --check` passou.
- Alteracoes separadas em commits na branch `ci/eas-ios-main-release`. Validacao remota do token e CI em andamento na publicacao do PR. Nenhum merge/build de loja executado nesta preparacao.

## Dados e acessos necessarios

1. Acesso EAS ao projeto existente: login autorizado ou convite para a conta atual.
2. Acesso a equipe Apple `H859MRQ6UP` com permissao para gerenciar assinatura (assinatura ativa confirmada).
3. Registro do Bundle ID `com.gochamps.app` nessa equipe, a verificar durante configuracao da assinatura.
4. App Store Connect configurado com Apple ID `6822873868`; verificar acesso para envio.
5. Secret `EXPO_TOKEN` no environment `production` do GitHub, associado a usuario com acesso ao projeto. Nunca commitar tokens, certificados ou chaves.
6. Nome publico, icone final, URLs de suporte/privacidade, screenshots e respostas de privacidade para a ficha da loja.

## Sequencia

1. Validar o conjunto local, incluindo migracao de SDK e fluxos de conta.
2. Revisar e commitar alteracoes por grupos; abrir PR para main.
3. Apos o primeiro CI remoto, exigir o check `Quality` e revisao de PR na protecao da main.
4. Configurar Bundle ID e revisar nome, scheme, icone, suporte a iPad e declaracoes Apple de criptografia/privacidade.
5. Autenticar no EAS com acesso ao projeto e configurar assinatura sem iniciar build: `eas credentials:configure-build --platform ios --profile production`. Usar EAS CLI 27.1.0 (CLI local antigo 16.32.0 nao atende eas.json). O login Apple e 2FA devem ser feitos pelo usuario no terminal.
6. Gerar o primeiro build com `eas build --platform ios --profile production`.
7. Configurar `ascAppId` e enviar esse build explicitamente com `eas submit --platform ios --profile production --id <BUILD_ID>`.
8. Validar em TestFlight e completar a ficha antes de enviar para revisao Apple.
9. O build automatico ja esta conectado ao CI bem-sucedido da main. Antes de mergear, concluir assinatura e configurar a App Store Connect API Key via `eas credentials --platform ios` para permitir `--auto-submit` sem interacao.

EAS Submit entrega o binario ao App Store Connect/TestFlight. Publicacao para usuarios depende da revisao e liberacao no App Store Connect.

Referencias: https://docs.expo.dev/build/setup/ e https://docs.expo.dev/submit/ios/.
