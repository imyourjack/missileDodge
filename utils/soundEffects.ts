import { Audio } from 'expo-av';

// 사운드 객체들을 저장할 객체
const sounds: { [key: string]: Audio.Sound | null } = {};
let soundsLoaded = false;

// 사운드 초기화
export const initSounds = async () => {
  try {
    console.log('🔊 사운드 시스템 초기화 중...');
    
    // 오디오 모드 설정
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    // 사운드 파일들을 로드 (에러 처리 포함)
    const soundFiles = [
      { key: 'background', file: require('../assets/sounds/game-music-loop-5.mp3'), loop: true, volume: 0.3 },
      { key: 'collision', file: require('../assets/sounds/explosion-1.mp3'), loop: false, volume: 0.6 },
      { key: 'gameOver', file: require('../assets/sounds/game-over.mp3'), loop: false, volume: 0.5 },
      { key: 'score', file: require('../assets/sounds/game-bonus-1.mp3'), loop: false, volume: 0.4 },
    ];

    for (const soundConfig of soundFiles) {
      try {
        const sound = new Audio.Sound();
        await sound.loadAsync(soundConfig.file);
        if (soundConfig.loop) {
          await sound.setIsLoopingAsync(true);
        }
        await sound.setVolumeAsync(soundConfig.volume);
        sounds[soundConfig.key] = sound;
        console.log(`✅ ${soundConfig.key} 사운드 로드 완료`);
      } catch (error) {
        console.log(`❌ ${soundConfig.key} 사운드 로드 실패:`, error);
        sounds[soundConfig.key] = null;
      }
    }

    soundsLoaded = true;
    console.log('🎵 사운드 시스템 초기화 완료!');
  } catch (error) {
    console.log('❌ 사운드 시스템 초기화 오류:', error);
    soundsLoaded = false;
  }
};

// 안전한 사운드 재생 함수
const safePlaySound = async (soundKey: string, fallbackMessage: string) => {
  try {
    if (soundsLoaded && sounds[soundKey]) {
      await sounds[soundKey]!.replayAsync();
      console.log(`🔊 ${fallbackMessage}`);
    } else {
      console.log(`🔊 ${fallbackMessage} (사운드 파일 없음)`);
    }
  } catch (error) {
    console.log(`🔊 ${fallbackMessage} (오류: ${error})`);
  }
};

// 배경음악 재생
export const playBackgroundMusic = async () => {
  await safePlaySound('background', '배경음악 재생 중... 🎵');
};

// 배경음악 정지
export const stopBackgroundMusic = async () => {
  try {
    if (soundsLoaded && sounds.background) {
      await sounds.background.stopAsync();
      console.log('🔇 배경음악 정지');
    } else {
      console.log('🔇 배경음악 정지 (사운드 파일 없음)');
    }
  } catch (error) {
    console.log('🔇 배경음악 정지 (오류: ${error})');
  }
};

// 충돌음 재생
export const playCollisionSound = async () => {
  await safePlaySound('collision', '폭발! 💥');
};

// 게임 오버음 재생
export const playGameOverSound = async () => {
  await safePlaySound('gameOver', '게임 오버! 😵');
};

// 점수 획득음 재생
export const playScoreSound = async () => {
  await safePlaySound('score', '점수 획득! ⭐');
};

// 게임 시작음 재생 (배경음악으로 대체)
export const playStartSound = async () => {
  await safePlaySound('background', '게임 시작! 🚀');
};

// 비행기 이동음 재생 (쓰로틀링 적용)
let lastMoveTime = 0;
export const playMoveSound = async () => {
  const now = Date.now();
  if (now - lastMoveTime > 200) { // 200ms 간격으로 제한
    console.log('✈️ 비행기 이동 중...');
    lastMoveTime = now;
  }
};

// 모든 사운드 정리
export const cleanupSounds = async () => {
  try {
    console.log('🧹 사운드 시스템 정리 중...');
    for (const [key, sound] of Object.entries(sounds)) {
      if (sound) {
        await sound.unloadAsync();
        console.log(`✅ ${key} 사운드 정리 완료`);
      }
    }
    soundsLoaded = false;
    console.log('✅ 사운드 시스템 정리 완료!');
  } catch (error) {
    console.log('❌ 사운드 정리 오류:', error);
  }
};

// 사운드 시스템 상태 확인
export const isSoundsLoaded = () => soundsLoaded; 