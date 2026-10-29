# Go Champs - Handoff de continuidade

Atualizado em: 2026-10-29

## Preparacao para App Store

- PRs #4 (automacao EAS) e #5 (fingerprint) mergeados. Main em `2bf0202` antes do PR de icones.
- Build iOS 1.0.0 (2) `271444d1-70d5-4611-9482-decc0f9639b9` concluido e enviado ao App Store Connect com sucesso pelo workflow 40950067924.
- Projeto EAS `wagnerassis/go-champs-app`, ID `07a87e62-c99e-4ceb-b2c4-0ff27a5544d5`. Sessao local e secret GitHub EXPO_TOKEN validados.
- Bundle `com.gochamps.app`, equipe `H859MRQ6UP`, App Store Connect `6822873868`. Certificado/provisioning ativos ate outubro/2027; chave APP_MANAGER associada ao EAS Submit.
- Main protegida por PR, Quality e Expo access. Merge -> CI aprovado -> build EAS do SHA testado -> auto-submit ao TestFlight. Publicacao publica ainda depende de revisao Apple.
- Override global de brace-expansion removido pelo PR #5; `check:fingerprint` no CI evita a falha da primeira tentativa. `.npmrc` resolve os peers do RN RC exigido pelo SDK atual.
- Icones novos gerados a partir de `assets/branding/source-logo.png`: iOS/legacy 1024 opaco, Android adaptativo + monocromatico transparentes e Google Play 512. Regenerar com `npm run icons:generate`. Area segura e canais verificados; lint passou.
- Trabalho atual: branch `feat/branded-app-icons`, publicar PR, aguardar CI, squash merge e acompanhar nova build iOS.
- Ultima matriz completa aprovada: 165 unitarios, 87 E2E, 28/28 jornadas nas tres plataformas; cobertura configurada acima de 90%.
- Nao fazer pushes documentais extras na main durante release: cada push aprovado inicia outro build. Detalhes em `docs/IOS_RELEASE.md`.

## Objetivo em andamento

Aplicar o novo design system mobile do Figma ao app Expo/React Native Web, preservar a experiência web e entregar um PWA com cobertura de testes unitários e E2E de pelo menos 90%.

Figma de referência: https://www.figma.com/design/ejLZZAUH3CLh1PNsvjs4jp/Home?node-id=628-10881

## Estado atual

- Branch: `main`.
- Há alterações locais ainda não commitadas neste ciclo; não descarte nem reverta arquivos modificados.
- **Expo SDK 58 (beta/`next`)**: `expo@^58.0.5`, React Native `0.88.0-rc.3`, React `19.3.0`. Rodando no simulador **iPhone 18 Pro** via Expo Go 58 + Metro (`EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0`).
- Navegação: `app/index.tsx` usa `NavigationIndependentTree` + `NavigationContainer` (necessário no SDK 58 com Expo Router + stack próprio).
- O app foi reorganizado em camadas `core`, `data`, `domain`, `viewmodels` e `views`.
- Serviços legados duplicados em `src/services` foram removidos após verificar que não possuíam importadores.
- As telas atuais usam componentes compartilhados e tokens do design system em `src/theme/theme.ts`.
- A home foi redesenhada, com hero reduzido, área segura para notch, cards de campeonatos e navegação inferior fixa.
- A escolha de fase deixou de ser uma tela dedicada: uma única fase navega direto e múltiplas fases usam modal.
- Telas de classificação, grupos, playoffs, partidas, perfil, organização e histórico foram alinhadas ao novo padrão visual.
- **Auth MVP nativo:** login `POST /v1/accounts/signin`; token persistido (`expo-secure-store` / `localStorage` na web) via `SecureAuthTokenStore`; `GoChampsApiClient` injeta `Authorization: Bearer <token>`; perfil de conta via `GET /v1/users/:username`; perfil de atleta via `athlete-profiles`; Meus jogos via `GET /v1/athlete-profiles/me/schedules`; logout local (API sem revoke).
- **WebAuth isolado** em `src/webauth/`: cadastro, recuperação e alteração de credenciais abrem `WebAuthFlowScreen` (WebView no native; browser externo na web). Substituível por fluxo nativo sem mudar o restante do app.
- **Detalhe do jogo:** `GameDetailScreen` com placar + súmula (`GET /v1/games/:id` + `GET /v1/player-stats-logs?where[game_id]=`). Navegação a partir de `GamesList` e `MyGamesScreen`.
- **Perfil:** conta read-only + CTA “Alterar e-mail ou senha” (WebAuth); criação e edição nativa do perfil de atleta (nome, redes, URL da foto).
- Plano/spec auth: `docs/superpowers/specs/2026-09-15-auth-mvp-design.md` e `docs/superpowers/plans/2026-09-15-auth-mvp.md`.
- A home inclui `MonthlyHighlights.tsx`. Sem ranking mensal agregado na API pública, o estado vazio permanece sem dados fictícios.
- `AppHeader`: marca à esquerda para visitante (login pelo ícone); centralizada após autenticação.

## PWA

- `app/+html.tsx` inclui metadados, manifest, `viewport-fit=cover` e registro do worker.
- `public/manifest.webmanifest`, `public/sw.js` e os ícones em `public/` compõem o shell instalável.
- O worker serve somente o fallback de navegação offline. Ele não interfere em APIs, imagens remotas ou bundles.
- Em automação (`navigator.webdriver`) o registro automático é desativado porque o WebKit não entrega as rotas mockadas quando uma página controlada pelo worker faz chamadas cross-origin. O teste PWA registra o worker explicitamente e confirma o estado `activated`.

## Testes e comandos

Use Node 22:

```sh
export PATH=/Users/aw-admin/.nvm/versions/node/v22.22.2/bin:$PATH
```

```sh
npm run check
npm run lint
npm run test:e2e
```

- `npm run check`: typecheck e Jest com cobertura.
- E2E: jornadas em `e2e/journeys.ts` (meta 90%) em Android Web, iOS WebKit e desktop.

## Ponto de retomada

1. Revisar o diff local por grupos funcionais antes de criar commits.
2. Push somente após o usuário solicitar.
3. Backlog auth: cadastro/recovery nativos (CAPTCHA), `PATCH /users` nativo, revoke/refresh JWT, `GET /me`, account-identity, Facebook auth.
4. Migração Expo SDK 57 em branch separada, se prioridade for alertas Metro.
5. Destaques mensais quando a API tiver ranking agregado publicável.

## Segurança conhecida

O `npm audit` reporta alertas high na cadeia Metro/Expo (`image-size`). Correção automática puxa Expo SDK 57. Não adicionar override de `image-size` 2.x.
