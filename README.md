# 🚀 Missile Dodge Game

React Native + Expo 기반의 간단한 미사일 피하기 게임입니다.

## 🎮 게임 설명

- 비행기를 조작하여 떨어지는 미사일을 피하는 게임
- 터치로 비행기를 자유롭게 이동 가능 (상하좌우)
- 미사일을 피할수록 점수가 올라감
- 미사일에 맞으면 게임 오버

## 🛠 기술 스택

- **React Native** 0.79.3
- **Expo** ~53.0.10
- **TypeScript** ^5.8.3
- **Expo AV** ^15.1.5 (사운드 효과)

## 📁 프로젝트 구조

```
missileDodge/
├── App.tsx                 # 메인 게임 로직
├── components/
│   ├── Plane.tsx          # 비행기 컴포넌트
│   └── Missile.tsx        # 미사일 컴포넌트
├── utils/
│   ├── collision.ts       # 충돌 감지 로직
│   └── soundEffects.ts    # 사운드 효과 관리
├── assets/
│   └── sounds/           # 게임 사운드 파일들
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 실행 방법

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 시작
```bash
npm start
```

### 3. 플랫폼별 실행
```bash
# 웹에서 실행
npm run web

# Android에서 실행
npm run android

# iOS에서 실행
npm run ios
```

## 🎯 게임 특징

### 조작
- **터치 드래그**: 비행기를 자유롭게 이동
- **반응형**: 화면 크기에 맞게 자동 조정

### 게임 메커닉
- **무제한 미사일**: 미사일 수 제한 없음
- **원형 충돌 감지**: 정확한 충돌 판정
- **최적화된 성능**: 60fps 부드러운 애니메이션
- **점수 시스템**: 생존 시간에 따른 점수 증가

### 사운드 시스템
- 배경음악 (게임 루프)
- 충돌음 (폭발음)
- 게임 오버음
- 점수 획득음

## 🔧 주요 기능

### 충돌 감지
- 원형 충돌 박스 사용
- 비행기와 미사일의 정확한 충돌 판정
- 성능 최적화를 위한 범위 제한

### 애니메이션
- React Native Animated API 활용
- 부드러운 60fps 애니메이션
- 최적화된 렌더링 성능

### 사운드 효과
- Expo AV를 통한 사운드 재생
- 게임 상태에 따른 적절한 사운드 출력
- 사운드 파일 없어도 정상 작동

## 🎨 커스터마이징

### 비행기 모양 변경
`components/Plane.tsx`에서 비행기 스타일을 수정할 수 있습니다.

### 미사일 속도 조정
`App.tsx`의 미사일 생성 간격과 속도를 조정할 수 있습니다.

### 사운드 파일 추가
`assets/sounds/` 폴더에 사운드 파일을 추가하고 `utils/soundEffects.ts`에서 참조할 수 있습니다.

## 📱 지원 플랫폼

- ✅ 웹 (React Native Web)
- ✅ Android
- ✅ iOS

## 🐛 알려진 이슈

- 사운드 파일이 없을 경우 콘솔에 로그만 출력됩니다.
- 매우 빠른 터치 시 비행기 움직임이 부자연스러울 수 있습니다.

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**즐거운 게임 되세요! 🎮** 