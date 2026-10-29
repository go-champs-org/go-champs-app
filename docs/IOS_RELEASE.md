# Publicacao iOS

## Estado em 2026-10-29

- Projeto EAS: `wagnerassis/go-champs-app`, ID `07a87e62-c99e-4ceb-b2c4-0ff27a5544d5`.
- Bundle ID: `com.gochamps.app`; equipe Apple: `H859MRQ6UP`; App Store Connect: `6822873868`.
- Sessao local Expo e secret GitHub `EXPO_TOKEN` validados. Certificado/provisioning App Store ativos ate outubro/2027; chave APP_MANAGER associada ao EAS Submit.
- Build 1.0.0 (2) concluido e enviado ao App Store Connect: https://expo.dev/accounts/wagnerassis/projects/go-champs-app/builds/271444d1-70d5-4611-9482-decc0f9639b9.
- Workflow desse envio: https://github.com/go-champs-org/go-champs-app/actions/runs/40950067924.
- Icones iOS/Android atualizados na branch `feat/branded-app-icons`; proxima build sera criada pelo merge dessa alteracao.

## Fluxo automatico

1. Abrir PR para main. A protecao exige branch atualizada e os checks `Quality` e `Expo access` aprovados. Administradores mantem bypass; force push e exclusao estao desabilitados.
2. Fazer squash merge (unico metodo habilitado no repositorio).
3. CI roda na main e valida TypeScript, cobertura, lint, fingerprint iOS e E2E.
4. `iOS Production Build` responde ao CI aprovado de push main, faz checkout do SHA testado, constroi na nuvem EAS com incremento remoto e agenda envio ao TestFlight.
5. Disparo manual do workflow tambem esta disponivel na main. Evitar novos pushes documentais durante um release para nao gerar builds extras.

EAS Submit entrega o binario ao App Store Connect. Processamento, disponibilidade em TestFlight e revisao/publicacao publica sao etapas distintas. O build atual nao declara `ITSAppUsesNonExemptEncryption`; o App Store Connect pode exigir responder a classificacao de criptografia antes de liberar testes.

## Icones

Ver `assets/branding/README.md`. A fonte fornecida foi preservada em `source-logo.png`; `npm run icons:generate` produz os assets iOS, Android adaptativo/monocromatico e Google Play. Os assets nativos estao configurados em `app.json`.

## Credenciais e manutencao

Dentro de `go-champs-app`, com Node 22:

```sh
npx eas-cli@27.1.0 login
npx eas-cli@27.1.0 credentials:configure-build --platform ios --profile production
npx eas-cli@27.1.0 credentials --platform ios
```

Esses comandos configuram credenciais sem iniciar build. Selecionar a equipe Apple indicada acima. Senhas/2FA ficam no terminal; certificados, chaves privadas e tokens nao devem ser commitados.

## Validacao e problemas resolvidos

- Ultimo CI completo aprovado: 165 testes unitarios, 87 E2E (28/28 jornadas por plataforma), lint e TypeScript sem erros. Cobertura no escopo configurado: 98.82% linhas, 98.51% statements, 100% funcoes, 90.79% branches.
- `.npmrc` registra a resolucao de peers necessaria ao RN `0.88.0-rc.3` exigido pelo SDK atual.
- PR #4 introduziu CI/EAS; PR #5 removeu o override global incompativel de brace-expansion que quebrava o fingerprint e adicionou `check:fingerprint` ao CI/build.
- PR #3 (Fastlane/macOS) e uma alternativa separada; nao misturar workflows sem reconciliar a estrategia.

Referencias: https://docs.expo.dev/build/setup/ e https://docs.expo.dev/submit/ios/.
