# 추억 사진

이 폴더에 부모님과의 옛날 사진을 넣고, `frontend/src/pages/Home.tsx` 의 `MEMORIES` 배열을 수정하면 화면에 반영됩니다.

## 사용 방법

1. 사진 파일을 이 폴더에 넣기 (예: `spring-2015.jpg`)
2. `Home.tsx` 의 `MEMORIES` 항목 수정:

```ts
{ caption: '봄, 다 함께', src: '/photos/spring-2015.jpg', rotate: -2 },
```

(`gradient` 필드 제거하고 `src` 추가)

## 권장 사항

- 정사각형 비율 (1:1) 권장 — 폴라로이드 프레임에 맞음
- 1080px × 1080px 정도면 충분
- JPG/PNG/WebP 모두 지원
