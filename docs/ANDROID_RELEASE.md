# Build Android

## Configuracao

- Package: `com.gochamps.app`.
- Projeto EAS: `wagnerassis/go-champs-app` (`07a87e62-c99e-4ceb-b2c4-0ff27a5544d5`).
- Perfil `production`: Android App Bundle (`.aab`), credenciais remotas e `versionCode` incrementado pelo EAS.
- Secret GitHub existente: `EXPO_TOKEN`. Nenhuma chave privada Android deve ser commitada.
- Em 2026-11-11: chave de assinatura criada no EAS para este app novo e perfil validado com `eas config`. Conta de servico Google cadastrada no EAS e envio automatico validado com sucesso.
- PR de ativacao mergeado: https://github.com/go-champs-org/go-champs-app/pull/21, SHA `b899e7e`. Validacao local: 548 testes unitarios e 219 E2E aprovados, alem de lint, tipos e fingerprint Android. CI de push main 43100892545 aprovado.
- Conta de servico de envio associada a `com.gochamps.app`, confirmada via EAS CLI. Workflow Android automatico: https://github.com/go-champs-org/go-champs-app/actions/runs/43102030998.
- Primeira build Android 1.0.0 (2) FINISHED: https://expo.dev/accounts/wagnerassis/projects/go-champs-app/builds/c58c7b09-d5a0-43a2-a70c-544b7d91a5bf. Envio para internal FINISHED: https://expo.dev/accounts/wagnerassis/projects/go-champs-app/submissions/6df24b72-5f76-4c8b-8dcc-637099c62237, com releaseStatus COMPLETED. Workflow GitHub concluido com sucesso. Processamento e disponibilidade para os testadores sao posteriores ao upload.
- Status final registrado localmente, sem push documental na main para nao gerar builds duplicadas.

## Assinatura inicial

Antes do primeiro merge com a automacao Android, configurar a chave no EAS. Se o app ja foi publicado, reutilizar a chave de upload existente; nao gerar uma substituta sem validar a identidade no Google Play Console.

Dentro de `go-champs-app`, com Node 22:

```sh
npx eas-cli@27.1.0 credentials:configure-build --platform android --profile production
```

Esse comando configura a assinatura sem disparar uma build. A configuracao inicial e interativa; o GitHub usa as credenciais salvas para executar sem prompts.

## Fluxo automatico

1. PR para `main`, com `Quality` e `Expo access` aprovados.
2. Merge dispara o CI completo na `main`.
3. `Android Production Build` so executa depois do CI de push aprovado no proprio repositorio, usando o SHA testado.
4. O EAS gera o AAB assinado e agenda envio ao Google Play com `--auto-submit`. O perfil `submit.production.android` seleciona `internal`, com `releaseStatus: completed`. Nao promove para producao publica.
5. O link de download aparece no log da acao e no painel de builds do projeto Expo. A conclusao do build nao comprova a conclusao do envio: conferir tambem EAS Submit e Play Console.

O workflow tambem aceita disparo manual, apenas na `main`. A automacao fica ativa quando `.github/workflows/android-production.yml` estiver na branch padrao e as credenciais remotas estiverem configuradas. O workflow iOS permanece independente.

## Google Play

Antes de ativar o workflow, cadastrar o app no Play Console e configurar uma conta de servico com permissao de publicar em faixas de testes no EAS Submit. No painel Expo do projeto: Credentials > Android > `com.gochamps.app` > Service credentials > Google service account key for Expo Submit. A chave precisa estar atribuida a esse identificador; apenas salvar uma chave na conta nao basta. Nao e necessario adicionar um secret Google ao GitHub: o EAS usa a chave remota atribuida ao app.

A documentacao Expo atual permite o primeiro envio automatico a testes internos; a ficha e as tarefas de configuracao do Play Console ainda precisam ser concluidas para liberar/promover o app. Completar tambem a lista de testadores. Nunca enviar o JSON privado da conta de servico pelo chat ou pelo Git.

Referencias: https://docs.expo.dev/build/building-on-ci/, https://docs.expo.dev/app-signing/app-credentials/ e https://docs.expo.dev/submit/android/.
