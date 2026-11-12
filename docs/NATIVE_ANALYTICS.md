# Analytics nativo do Go Champs

## Escopo e ativacao

A implementacao de GC-12 envia eventos de produto ao projeto Amplitude Go Champs - App, exclusivamente em builds nativas iOS/Android com chave configurada. Grafana, web/PWA, autocapture, replay e dados de formularios ficam fora deste fluxo.

`EXPO_PUBLIC_AMPLITUDE_API_KEY` foi cadastrada no projeto EAS `wagnerassis/go-champs-app`, somente no ambiente `production`, com visibilidade sensitive. O perfil `build.production.environment` de `eas.json` ja seleciona esse ambiente. A chave nao esta no repositorio. Como toda variavel EXPO_PUBLIC, seu valor sera incluido no bundle; sensitive nao a transforma em segredo do cliente.

Sem chave, em `__DEV__`, durante Jest ou em plataforma diferente de iOS/Android, o cliente nao carrega nem inicializa Amplitude/crypto/application. O SDK e inicializado depois da retomada da autenticacao, sem aguardar HTTP nem bloquear a navegacao. Falhas do SDK sao contidas, sem mensagens na interface.

## Identidade e privacidade

- `user_id`: SHA-256 do username exato em hexadecimal, sem trim ou alteracao de caixa. O texto original so chega ao hash local via Expo Crypto; email e token nao sao parametros de tracking.
- Retomada, login e atualizacoes legadas definem a identidade antes de mudar a sessao visivel. Logout chama reset do SDK, removendo user_id e renovando o identificador anonimo do dispositivo.
- O SDK guarda seu identificador aleatorio e as sessoes entre aberturas usando AsyncStorage. Sao identificadores pseudonimos, nao uma garantia de anonimato.
- Sem IDFA, ADID, IDFV, App Set ID ou geolocalizacao. `trackingOptions` desliga esses dados, e o enrichment plugin remove os campos pessoais do envelope e substitui IP por `0.0.0.0`.
- Autocapture e remote config desabilitados: configuracoes remotas nao podem habilitar coleta de cliques/rede nem alterar a lista de eventos. Nao ha plugin de session replay.

## Contrato de eventos

O contrato unico esta em `src/core/analytics/events.ts`. Tipos e validacao em runtime rejeitam eventos/propriedades desconhecidos. O plugin reconstroi o envelope permitido antes do destino do SDK, incluindo eventos automaticos de sessao. A suite de contrato falha se formatos reais ou eventos aceitos deixarem de satisfazer o contrato.

Todos os eventos recebem `app_version`, `build_number` e `platform` (`ios` ou `android`), obtidos do binario nativo, inclusive quando o numero foi incrementado remotamente pelo EAS.

| Evento | Propriedades especificas |
| --- | --- |
| Screen Viewed | screen_name |
| Screen Exited | screen_name, duration_ms, is_live opcional |
| Share Sheet Opened | sticker: profile ou game |
| Sticker Shared | sticker, action: copy/save/share, format_id, has_photo |
| Live Game Viewed | game_id, tournament_id, organization_id |
| Athlete Profile Saved | is_new, changed_fields |
| session_start / session_end | Nenhuma propriedade customizada alem do contexto comum |

`screen_name` pertence a lista fechada de rotas do stack/abas; titulos e parametros nunca sao enviados. Pais desconhecidos do jogo usam null no lugar de ids. `changed_fields` contem apenas nomes normalizados de campos alterados, nunca seus valores ou URLs de fotos.

## Sessoes e tempo de tela

O SDK gerencia session_id e eventos de sessao no foreground/background, usando seu timeout padrao. O tempo de tela e independente: `ScreenTracker` usa relogio monotonico, centralizado em onReady/onStateChange do NavigationContainer. Cada trecho em foreground gera um par Viewed/Exited; inactive/background fecha o trecho, e o retorno inicia outro. O tempo parado em background nao entra em duration_ms. Eventos repetidos da mesma rota nao criam novas visitas.

O detalhe registra os ids quando o jogo ao vivo chega, sem repetir a cada poll. Dados carregando, com erro, finalizados ou pertencentes ao jogo anterior nao geram evento. A central so emite Live Game Viewed quando a rota correspondente esta ativa, uma vez por abertura; o trecho recebe is_live=true mesmo se o jogo terminar antes da saida.

## Compartilhamento e save

Os dois stickers passam por `ShareStickerViewModel`. Copia e salvamento contam somente depois de a operacao retornar sucesso. A exportacao captura formato/foto escolhidos, e os controles ficam bloqueados durante a operacao.

`expo-sharing.shareAsync` nao distinguia cancelamento de conclusao. A acao Compartilhar usa agora `react-native-share`, com resultado explicito; cancelamento, permissao negada e erro nao geram Sticker Shared. No Android, sucesso confirma a entrega ao destino selecionado na folha do sistema, nao comprova uma publicacao posterior dentro do Instagram/WhatsApp; essa confirmacao nao e fornecida pelo sistema. No iOS, usamos o completed informado pela folha nativa.

Athlete Profile Saved e disparado pelo wrapper do save da tela de edicao, somente quando o viewmodel retorna true, antes da navegacao de retorno. A lista de campos e calculada a partir do input normalizado e da operacao de foto.

## Compatibilidade e testes

- Amplitude React Native 1.13.1, AsyncStorage 2.2.0, Expo SDK 58 / RN 0.88.0-rc.3.
- Override restrito ao Amplitude evita a segunda copia de AsyncStorage 1.x. Instalacao limpa deve mostrar somente 2.2.0 com `npm ls @react-native-async-storage/async-storage --all`.
- Mapeamento Jest de react-native/react-private-interface segue o export real do RN 0.88, permitindo testar componentes com o preset existente.
- Modulo em `src/core/analytics` ja entra no collectCoverageFrom via `src/core/**/*.ts`; o gate global permanece em 90%.
- Integracao executa o SDK real com transporte em memoria e fetch bloqueado, inclusive apos o timer de diagnosticos. Nenhum evento de teste e enviado ao projeto real.
- E2E navega com uma chave ficticia incluida no bundle web e verifica ausencia de requisicoes ao Amplitude; o CI injeta somente essa chave ficticia no passo E2E.
- Build nativa iOS Release e Android Debug arm64 com as dependencias compilaram. SDK requer novo binario nativo; atualizacao apenas JS/Expo Go nao instala as dependencias.
- Resultado em 2026-11-12: typecheck e lint aprovados; 87 suites / 617 testes; modulo analytics com 100% de statements, branches, funcoes e linhas. Cobertura global do escopo configurado: 99,73% statements, 97,89% branches, 100% funcoes e 99,79% linhas.
- Matriz E2E web: 222 aprovados, 73/73 jornadas nas tres plataformas de navegador. Isso nao representa E2E nativo; o smoke nativo validou abertura e navegacao pelas tres abas no simulador iOS Release, sem chave. Export Hermes Android final tambem aprovado apos instalacao limpa.

## Antes do release publico

Confirmar/atualizar App Store Connect: Usage Data > Product Interaction para analytics. Revisar tambem Identifiers > User ID e Device ID, pois existem hash estavel e identificador do SDK. Revisar vinculacao a identidade e a politica de privacidade; nao declarar estes dados como anonimos apenas por serem hashes. Conferir tambem Google Play Data safety. O codigo nao adiciona pedido ATT nem coleta IDFA.

Usuario autorizou merge e builds automaticas para TestFlight e testes internos do Google Play. Publicacao publica continua condicionada a revisao de privacidade. Nenhum payload real de producao foi validado ainda.

PR #23 mergeado em `f215886245f50493298854051d8de11486c91cd7`, apos CI aprovado no PR e na main (43245597871). Builds automaticas criadas e IN_QUEUE na verificacao de 2026-11-12:

- iOS 1.0.0 (17): https://expo.dev/accounts/wagnerassis/projects/go-champs-app/builds/24907508-2e49-413a-9f12-676371b99a11 (workflow 43246952426).
- Android 1.0.0 (3): https://expo.dev/accounts/wagnerassis/projects/go-champs-app/builds/d3c1c69b-58aa-4cf7-90c2-9e8f580f5e86 (workflow 43246952383).

Ambas correspondem ao SHA aprovado, com auto-submit para TestFlight/internal. Disparo confirmado nao significa compilacao/envio concluidos; consultar estes IDs antes de validar eventos. Este registro final permanece local para evitar outro push/build na main.

## Painel App Uso

Criar o painel "App - Uso" e o cohort "compartilhou os dois" somente depois do primeiro build de producao e eventos reais, conforme a story. Confirmado pelo Chrome: organizacao `go-champs-org`, projeto `App`, descricao `Go Champs App`, Project ID `905259`, ainda sem eventos. MCP retorna Unknown tool; continuar validacao e criacao do painel pelo Chrome, conforme combinado com o usuario.

Com o acesso correto e dados reais:

1. Confirmar os eventos, propriedades e user_id hexadecimal no projeto Go Champs - App.
2. Criar duracao de sessao e sessoes por usuario usando session_id do SDK.
3. Criar media de duration_ms de Screen Exited por screen_name. Para total de uso, somar os trechos em foreground, sem somar intervalos em background.
4. Criar usuarios unicos de Sticker Shared por sticker. O cohort e a intersecao de quem teve ao menos um profile e ao menos um game no mesmo periodo; copy/save/share sao resultados do mesmo evento.
5. Criar usuarios unicos de Live Game Viewed; media/total de Screen Exited filtrado por is_live=true para o tempo assistido.
6. Criar frequencia de Athlete Profile Saved por usuario, com quebra por is_new se util.
7. Validar os oito cenarios da story com uso real do app e registrar os links dos charts/cohort/painel neste documento. Nao criar eventos sinteticos na producao para preencher o painel.

Referencias: https://amplitude.com/docs/sdks/analytics/react-native/react-native-sdk, https://react-native-share.github.io/react-native-share/docs/share-open e https://developer.apple.com/app-store/app-privacy-details/.
