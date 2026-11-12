# Go Champs - Handoff de continuidade

Atualizado em: 2026-11-12

## Landscape para avaliacao local

- Usuario pediu liberar landscape para avaliar o layout. `app.json` expo.orientation passou de portrait para default; configuracao web preservada. Nenhum redesenho das telas.
- Prebuild iOS regenerado preservando a correcao ExpoApplication 58.0.4. Build Release concluida e instalada no iPhone fisico; Info.plist do binario confirma portrait e landscape esquerdo/direito. Chave ficticia de analytics mantida para validacao, sem eventos no projeto real.
- Logs /tmp/gc-landscape-build.log e /tmp/gc-landscape-launch.log. Mudanca local, ainda sem commit/merge/build TestFlight. Layout em landscape depende da avaliacao visual no aparelho; nao declarar todas as telas adaptadas.

## Crash GC-12: correcao local em validacao

- Branch `fix/ios-analytics-native-registration`, sem commit/push. Crash reproduzido no iPhone fisico conectado via devicectl: RCTFatalException, Cannot find native module ExpoApplication, carregado pelo analytics em producao. Teste anterior no simulador nao exercitou esse caminho porque estava sem chave.
- expo-application 58.1.2 nao declara apple.modules e o ExpoModulesProvider gerado nao registrava ApplicationModule. Fix local: pin exato 58.0.4, lock atualizado; pod install agora gera import ExpoApplication e ApplicationModule.self. Adicionado teste de regressao sobre o config real instalado, sem mock do modulo.
- 88 suites / 618 testes, typecheck e lint aprovados. Usuario autorizou cadastro do iPhone na equipe H859MRQ6UP. Build Release com allowProvisioningDeviceRegistration concluiu, foi assinada e instalada no aparelho sem desinstalar o app.
- Chave ficticia gc12-native-validation-only confirmada no bundle compilado: analytics ativo, sem usar chave do projeto real. Duas aberturas no iPhone fisico mantiveram os processos 36095 e 36096 vivos apos 30 segundos; sem RCTFatalException/ExpoApplication ausente. Timeout dos comandos de console foi apenas encerramento da observacao, nao crash (processos confirmados depois via devicectl).
- Usuario confirmou: "Carregou e naveguei sem crash" nas telas solicitadas (Home, Perfil, Meus jogos e campeonato). Validacao local da correcao concluida; ingestao real no Amplitude continua pendente da build de producao.
- Logs /tmp/gc12-device-build.log, /tmp/gc12-device-launch.log e /tmp/gc12-device-launch-2.log. Binario local /tmp/go-champs-device-validation/Build/Products/Release-iphoneos/GoChamps.app. Nenhum processo local de build/acompanhamento permanece ativo; app aberto no iPhone.
- A instalacao local substituiu o binario TestFlight no aparelho. Correcao ainda sem commit/PR/merge nem nova build distribuida. Proximo passo: entregar o pin de dependencia e teste de regressao pelo CI/release; nao confundir teste local com correcao ja disponivel aos testadores. Pendencias documentais anteriores preservadas.

## GC-12 Analytics nativo (2026-11-12)

- Entregue em quatro commits na branch `feat/gc-12-native-analytics`: `4a044d3` base, `ee7e092` integracao, `28ac764` E2E/CI e `58e4908` documentacao (incluiu os registros locais do release anterior). PR #23 mergeado por squash, unico metodo permitido pelo repositorio: https://github.com/go-champs-org/go-champs-app/pull/23. Main `f215886245f50493298854051d8de11486c91cd7`; local atualizado com fast-forward.
- CI do PR 43244318420 aprovado. CI push main 43245597871 aprovado: 617 testes, 222 E2E e 73/73 jornadas em cada navegador. Quality e Expo access verdes, sem bypass.
- Builds disparadas automaticamente pelo merge, mesmo SHA `f215886`: iOS workflow https://github.com/go-champs-org/go-champs-app/actions/runs/43246952426 e Android https://github.com/go-champs-org/go-champs-app/actions/runs/43246952383.
- EAS iOS 1.0.0 (17), `24907508-2e49-413a-9f12-676371b99a11`, IN_QUEUE na ultima verificacao: https://expo.dev/accounts/wagnerassis/projects/go-champs-app/builds/24907508-2e49-413a-9f12-676371b99a11. Android 1.0.0 (3), `d3c1c69b-58aa-4cf7-90c2-9e8f580f5e86`, IN_QUEUE: https://expo.dev/accounts/wagnerassis/projects/go-champs-app/builds/d3c1c69b-58aa-4cf7-90c2-9e8f580f5e86. Ambos com auto-submit configurado para TestFlight/internal; conclusao e envio ainda nao confirmados. Nenhum build manual duplicado nem publicacao publica.
- Registros finais deste disparo ficam locais, sem novo commit/push na main para nao gerar builds duplicadas. Nenhum processo local de acompanhamento permanece ativo.
- Implementacao em `src/core/analytics`: contrato fechado de eventos, contexto nativo, SDK com enrichment de privacidade, identidade SHA-256 e fila nao bloqueante. Navegacao centralizada, tempo excluindo background, ambos os stickers, jogo ao vivo e save do perfil integrados.
- Amplitude 1.13.1 + AsyncStorage 2.2.0 (override restrito para evitar copia 1.x). `npm ci` e `npm ls` confirmaram uma unica copia 2.2.0. Lock regenerado sem atualizar versoes preexistentes de outras dependencias.
- Compartilhar usa react-native-share 12.3.1 para distinguir cancelamento de sucesso. Copia e Photos continuam usando Expo. Ler a limitacao de confirmacao do destino Android em `docs/NATIVE_ANALYTICS.md`.
- Chave fornecida cadastrada via EAS apenas em production como EXPO_PUBLIC_AMPLITUDE_API_KEY (sensitive). Nao esta no repositorio; nao puxar a chave para testes/simulador/web. Perfil EAS production ja apontava para o ambiente correto.
- Validacao final: instalacao limpa, typecheck, lint e 87 suites / 617 testes aprovados. Cobertura configurada: statements 99,73%, branches 97,89%, funcoes 100%, linhas 99,79%; modulo analytics 100% nas quatro metricas. SDK real executado pela factory de producao com transporte local e fetch bloqueado, inclusive janela de diagnosticos.
- E2E: 222 testes aprovados, 73/73 jornadas em Android Web, iOS WebKit e desktop, incluindo web com chave ficticia e zero requisicoes Amplitude. Nao confundir essa matriz web com E2E nativo em dispositivos.
- iOS Release e Android Debug arm64 compilaram com as novas dependencias; export Android Hermes final aprovado apos npm ci. Release iOS final instalado no iPhone 18 Pro, navegacao Inicio/Perfil/Meus jogos validada sem crash. Chaves real e ficticia ausentes do bundle do simulador; analytics desativado. App deixado aberto sem Metro.
- Amplitude confirmado pelo Chrome: organizacao `go-champs-org`, projeto `App`, descricao `Go Champs App`, ID `905259`, sem eventos na verificacao. MCP retorna Unknown tool, mas acesso pelo Chrome funciona; nao e pendencia de permissao do projeto. Nao gerar eventos falsos.
- Pendente para fechar a story: revisar privacy label antes do release publico; receber eventos reais do primeiro build; criar painel App - Uso e cohort pelo Chrome, conforme combinado com o usuario.
- Runbook e contrato: `docs/NATIVE_ANALYTICS.md`. Logs locais `/tmp/go-champs-gc12-check.log`, `/tmp/go-champs-gc12-lint.log`, `/tmp/go-champs-gc12-final-ios.log` e `/tmp/go-champs-gc12-android-export.log`. Proximos passos: consultar as builds/submissions acima, depois validar eventos reais e criar painel pelo Chrome. Nao disparar novamente os builds nem reexecutar release anterior.

## Automacao Android (2026-11-11)

- Adicionado `android.package = com.gochamps.app`; perfil EAS production explicita AAB e assinatura remota (incremento remoto ja estava habilitado).
- Novo workflow `.github/workflows/android-production.yml` segue o padrao iOS: aguarda CI de push aprovado na main e constroi exatamente o SHA testado; nao executa para PRs, forks ou CI reprovado. Disparo manual apenas na main. Usuario solicitou envio a testes internos: `--auto-submit` com track `internal` e releaseStatus `completed`, sem publicacao publica.
- CI tambem valida `check:fingerprint:android`. Secret GitHub `EXPO_TOKEN` existe, sessao Expo local tem acesso; lista EAS Android estava vazia nesta verificacao.
- Usuario confirmou app novo. Chave Android criada com sucesso no EAS via `credentials:configure-build --platform android --profile production`, sem iniciar build e sem salvar chave privada no repositorio.
- Validados: configuracao resolvida pelo EAS, fingerprint Android, lint, tipos, 77 suites / 548 testes unitarios e 219 E2E. Jornadas E2E: 72/72 em Android Web, iOS WebKit e desktop. Workflow conferido com parser YAML e assercoes dos filtros de origem/SHA, perfil de assinatura e track de envio.
- Usuario cadastrou a conta de servico Google no EAS. Associacao a Play Store Submissions de `com.gochamps.app` e keystore confirmadas pelo EAS CLI; nenhuma chave privada baixada.
- PR #21 mergeado por squash em `b899e7e8bcaf1efc264f4e8790debfda612916e7`: https://github.com/go-champs-org/go-champs-app/pull/21. Checks Quality e Expo access aprovados antes do merge. Main local atualizada com fast-forward.
- CI de push main aprovado: https://github.com/go-champs-org/go-champs-app/actions/runs/43100892545. Workflows disparados automaticamente: Android 43102030998 e iOS 43102031069.
- EAS Android 1.0.0 (2): build `c58c7b09-d5a0-43a2-a70c-544b7d91a5bf`, SHA `b899e7e`, FINISHED. Submission `6df24b72-5f76-4c8b-8dcc-637099c62237` FINISHED para `internal`/`COMPLETED`. Workflow GitHub Android 43102030998 concluido com sucesso. Envio a testes internos confirmado; processamento/disponibilidade para testadores depende do Google Play. Ver `docs/ANDROID_RELEASE.md`.
- iOS 1.0.0 (16): build `14ff35da-4046-4c64-8094-d83ef7a4e359` FINISHED; submission `986f1c22-a981-4254-be0b-a6d6e09ebc72` FINISHED. Envio ao App Store Connect confirmado pelo EAS; processamento/disponibilidade TestFlight depende da Apple.
- Fluxo automatico validado de ponta a ponta para ambas as plataformas, sem publicacao publica. Nenhum processo local de acompanhamento permanece ativo. Atualizacoes documentais finais ficam locais, sem push adicional na main para evitar outra build.

## Correcao local de inicializacao iOS (2026-11-11)

- Pull inicial com fast-forward/autostash de `384c904` para `02813d6`, preservando as alteracoes documentais locais. Trabalho inicialmente isolado em `fix/ios-crash-launch-branding` e depois integrado pelo PR #21; resultados do release acima.
- Crash reproduzido em Release no iPhone 18 Pro, iOS 27.0: DYLD `Symbol missing`, `AnyModule._classTypes`, referenciado por `ExpoMediaLibrary` e ausente no binario `ExpoModulesCore`. Relatorio local: `~/Library/Logs/DiagnosticReports/GoChamps-2026-11-11-090328.ips`.
- `package.json`: autolinking iOS `buildFromSource` para `expo-modules-core` e `expo-media-library`, evitando ABI divergente dos binarios precompilados. A configuracao e consumida tambem pelo EAS; nao remover sem validar abertura de uma build Release.
- Nome nativo `Go Champs`; splash clara/escura usa `assets/images/logo-white-name.png`, fundo `#1d1d1b`. Bundle ID e slug preservados.
- `npm run ios` agora gera/executa o app nativo, nao Expo Go. Pastas nativas geradas ficam ignoradas pelo Git (CNG).
- Use Node 22 e CocoaPods Homebrew: `export PATH=/Users/aw-admin/.nvm/versions/node/v22.22.2/bin:/opt/homebrew/opt/ruby/bin:/opt/homebrew/bin:$PATH`. O `pod` do Ruby de sistema falha neste Mac.
- Repro/validacao: `CI=1 npx expo run:ios --configuration Release --device 961BFDA6-39C6-46D5-9FB7-53D6BA4F6987 --no-bundler`. No Xcode 27 o simulador aparece no Device Hub (`com.apple.dt.Devices`).
- Typecheck, lint e 77 suites / 548 testes passaram. Cobertura do escopo configurado: linhas 99,77%, statements 99,71%, funcoes 100%, branches 97,70%. E2E web nao foi reexecutado neste ciclo.
- Build Release nativa concluida (zero erros). Tres inicializacoes com processos novos (`94980`, `95012`, `95089`) carregaram a home com dados reais; nenhum novo relatorio de crash. Splash com logo e nome `Go Champs` conferidos no binario e na gravacao `/tmp/go-champs-launch-fixed.mp4` (quadros `/tmp/go-champs-launch-frames.png`). App deixado aberto no simulador, sem depender do Metro; captura de logs encerrada. Logs `/tmp/go-champs-release-fix.log` e `/tmp/go-champs-ios-startup.log`.
- Configuracao `buildFromSource` documentada em https://docs.expo.dev/guides/prebuilt-expo-modules/. Build iOS (16) enviada posteriormente pelo PR #21; validar tambem no dispositivo via TestFlight, alem das aberturas ja testadas no simulador.

## Preparacao para App Store

- PRs #4 (automacao EAS) e #5 (fingerprint) mergeados. Main em `2bf0202` antes do PR de icones.
- Build iOS 1.0.0 (2) `271444d1-70d5-4611-9482-decc0f9639b9` concluido e enviado ao App Store Connect com sucesso pelo workflow 40950067924.
- Projeto EAS `wagnerassis/go-champs-app`, ID `07a87e62-c99e-4ceb-b2c4-0ff27a5544d5`. Sessao local e secret GitHub EXPO_TOKEN validados.
- Bundle `com.gochamps.app`, equipe `H859MRQ6UP`, App Store Connect `6822873868`. Certificado/provisioning ativos ate outubro/2027; chave APP_MANAGER associada ao EAS Submit.
- Main protegida por PR, Quality e Expo access. Merge -> CI aprovado -> build EAS do SHA testado -> auto-submit ao TestFlight. Publicacao publica ainda depende de revisao Apple.
- Override global de brace-expansion removido pelo PR #5; `check:fingerprint` no CI evita a falha da primeira tentativa. `.npmrc` resolve os peers do RN RC exigido pelo SDK atual.
- Icones novos gerados a partir de `assets/branding/source-logo.png`: iOS/legacy 1024 opaco, Android adaptativo + monocromatico transparentes e Google Play 512. Regenerar com `npm run icons:generate`. Area segura e canais verificados; lint passou.
- PR de icones #6 mergeado na main em `384c9045517f69b7434c706c48a8d237ffe896e8`. CI main 40961134971 e workflow iOS 40961764716 aprovados. Build 1.0.0 (3) `a0ca3155-c421-4d9b-837e-d843b3092a38` concluido e enviado ao App Store Connect com sucesso; submission `53a237c3-03cb-4665-87c7-9b6d2933befd`. Icone extraido do IPA e conferido visualmente; Info.plist confirma 1.0.0 (3). Link: https://expo.dev/accounts/wagnerassis/projects/go-champs-app/builds/a0ca3155-c421-4d9b-837e-d843b3092a38. Aguardar processamento Apple/TestFlight, sem confundir upload com publicacao publica. Ultimas atualizacoes documentais estao locais para evitar disparar outra build.
- Ultima matriz completa aprovada: 165 unitarios, 87 E2E, 28/28 jornadas nas tres plataformas; cobertura configurada acima de 90%.
- Nao fazer pushes documentais extras na main durante release: cada push aprovado inicia outro build. Detalhes em `docs/IOS_RELEASE.md`.

## Objetivo em andamento

Aplicar o novo design system mobile do Figma ao app Expo/React Native Web, preservar a experiência web e entregar um PWA com cobertura de testes unitários e E2E de pelo menos 90%.

Figma de referência: https://www.figma.com/design/ejLZZAUH3CLh1PNsvjs4jp/Home?node-id=628-10881

## Estado atual

- Branch local de trabalho: `main`, apos merge do PR #23 (`f215886`). Commits GC-12 preservados tambem na branch de origem. Registros locais finais deste disparo estao sem push; nao fazer push documental extra na main para nao disparar builds duplicadas.
- Há alterações locais ainda não commitadas neste ciclo; não descarte nem reverta arquivos modificados.
- **Expo SDK 58**: `expo@^58.0.5`, React Native `0.88.0-rc.3`, React `19.3.0`. A validacao atual e com binario nativo Release no simulador **iPhone 18 Pro**, nao Expo Go.
- Navegação: `app/index.tsx` usa `NavigationIndependentTree` + `NavigationContainer` (necessário no SDK 58 com Expo Router + stack próprio).
- O app foi reorganizado em camadas `core`, `data`, `domain`, `viewmodels` e `views`.
- Serviços legados duplicados em `src/services` foram removidos após verificar que não possuíam importadores.
- As telas atuais usam componentes compartilhados e tokens do design system em `src/theme/theme.ts`.
- A home segue o frame Figma Home / TournamentList: lista de até 15 campeonatos (fixados primeiro), sem hero nem cabeçalho de seção. A busca desce do topo pelo ícone de lupa e usa `GET /v1/search?term=` (debounce de 500 ms, até 15 resultados), como a home pública.
- `AppHeader`: logo, lupa (só na home) e menu lateral (`SideMenu`): Início, Organizações (lista das mais vistas, `GET /v1/organizations/recently-viewed`, com busca em todas, `GET /v1/organizations`), FAQ/Sobre nós/Fale com a gente (go-champs.com no navegador do app) e redes sociais. Entrar fica na aba Perfil.
- `app/+not-found.tsx` renderiza o app em caminhos desconhecidos do Expo Router: na web, voltar pelo histórico para /profile (após o login) mostrava "Unmatched Route".
- A escolha de fase deixou de ser uma tela dedicada: uma única fase navega direto e múltiplas fases usam modal.
- Telas de classificação, grupos, playoffs, partidas, perfil, organização e histórico foram alinhadas ao novo padrão visual.
- **Auth MVP nativo:** login `POST /v1/accounts/signin`; token persistido (`expo-secure-store` / `localStorage` na web) via `SecureAuthTokenStore`; `GoChampsApiClient` injeta `Authorization: Bearer <token>`; perfil de conta via `GET /v1/users/:username`; perfil de atleta via `athlete-profiles`; Meus jogos via `GET /v1/athlete-profiles/me/schedules`; logout local (API sem revoke).
- **WebAuth isolado** em `src/webauth/`: cadastro, recuperação e alteração de credenciais abrem `WebAuthFlowScreen` (WebView no native; browser externo na web). Substituível por fluxo nativo sem mudar o restante do app.
- **Detalhe do jogo:** `GameDetailScreen` com placar + súmula (`GET /v1/games/:id` + `GET /v1/player-stats-logs?where[game_id]=`). Navegação a partir de `GamesList` e `MyGamesScreen`.
- **Perfil (Sua conta):** dados da conta read-only (e-mail não é alterável; “Redefinir senha” abre WebAuth de recuperação); dados de identidade (`/v1/account-identity`) e perfil de atleta editáveis por seção com um único Editar; foto via URL assinada (`/v1/upload/presigned-url`).
- Plano/spec auth: `docs/superpowers/specs/2026-09-15-auth-mvp-design.md` e `docs/superpowers/plans/2026-09-15-auth-mvp.md`.

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

Em 2026-11-11 o GitHub sinalizou 26 alertas abertos na main, incluindo um critico em `shell-quote` (command injection; primeira versao corrigida indicada: 1.11.0). Consultado via Dependabot API; correcao de dependencias nao incluida no PR #21. Revisar antes de publicacao publica.

O `npm audit` reporta alertas high na cadeia Metro/Expo (`image-size`). Correção automática puxa Expo SDK 57. Não adicionar override de `image-size` 2.x.
