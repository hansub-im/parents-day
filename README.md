# 어버이날 편지 (im-hansub.co.kr)

가족이 한 마음으로 모아 쓰는 어버이날 편지 + 답장 + 가족 사진 모음 웹앱.

## 구조

```
parents-day/
├─ frontend/          React 19 + Vite + Tailwind v4 (TypeScript)
├─ backend/           Spring Boot + JPA + MS SQL (Java 21)
├─ deploy/            systemd / nginx / 재배포 훅 / env 템플릿
├─ scripts/           로컬 PowerShell 배포 스크립트
└─ .github/workflows/ GitHub Actions 자동 배포
```

## 기능

- 사촌 6명이 부모님 5분께 편지 작성 (각 사촌 5장)
- 가족별 호칭 자동 매핑 (큰집/우리집/작은집)
- 부모님이 받는 편지 + 모두에게 한 통 / 개별 답장
- 추억의 사진 업로드 (폰에서 직접, 받는 분 태그)
- 부모님 전용 추억 홈 (사진 폴라로이드 + 편지 진입)

## 로컬 개발

```powershell
# 백엔드 (로컬은 H2 파일 DB 자동 사용)
cd backend
.\gradlew.bat bootRun

# 프론트
cd frontend
npm install
npm run dev
```

## 배포

[deploy/README.md](deploy/README.md) 참조. GitHub Actions로 main 브랜치 push 시 자동 배포.

필요한 GitHub Secrets:
- `SSH_HOST`, `SSH_PORT`, `SSH_USER`, `SSH_PRIVATE_KEY`
