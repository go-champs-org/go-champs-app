# Auth MVP — Design Spec

**Date:** 2026-09-15  
**App:** `go-champs-app`  
**API:** `go_champs_api` (`/v1`, JWT Bearer)

## Goal

Entregar autenticação e perfil **nativos** no app com o que a API já fornece, sem cadastro nativo nesta fase.

## In scope

1. Login nativo (já existe) + injeção do token JWT em chamadas autenticadas
2. Persistência segura do token + restore no boot + logout local
3. Perfil de **conta**: `GET /v1/users/:username` (email, username, organizations)
4. Perfil de **atleta**: `GET` / `POST` / `PATCH` `/v1/athlete-profiles…`
5. **Meus jogos**: `GET /v1/athlete-profiles/me/schedules`
6. Testes unitários + E2E dos fluxos acima

## Out of scope (depois)

- Cadastro / recovery / reset nativos (CAPTCHA)
- `PATCH /v1/users` (editar email/senha — exige recaptcha)
- Logout revoke no servidor / refresh token / `GET /me`
- Facebook auth
- Account identity (KYC)
- Schedules de organização / official

## Domain rules

| Conceito | Uso no app |
|----------|------------|
| User/Account | Login + dados de conta + memberships de org |
| AthleteProfile | Persona pública (nome, foto, redes) — “perfil de jogador” do usuário |
| Player (roster) | Elenco de torneio — **não** é o perfil do usuário logado |

## Auth contract (API)

- Header: `Authorization: Bearer <jwt>`
- Login: `POST /v1/accounts/signin` → `{ data: { email, token, username } }`
- Conta: `GET /v1/users/:username` (Bearer; username deve ser o do token)
- Atleta: `GET /v1/athlete-profiles/username/:username` (público); create/update autenticados
- Agenda: `GET /v1/athlete-profiles/me/schedules` (Bearer; 401 se não houver AthleteProfile)
- Logout API: **não existe** → logout = limpar token no cliente

## App constraints

- Seguir camadas: Repository → UseCase → `container` → ViewModel → View
- Cadastro/recovery na UI continuam abrindo o site (`AuthScreen` modes `signUp` / `recovery`)
- Não inventar endpoints; não usar `/api/*` legado
