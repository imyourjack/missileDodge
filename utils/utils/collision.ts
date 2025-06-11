export interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 두 게임 오브젝트 간의 충돌을 감지합니다.
 * @param obj1 첫 번째 오브젝트
 * @param obj2 두 번째 오브젝트
 * @returns 충돌 여부
 */
export const checkCollision = (obj1: GameObject, obj2: GameObject): boolean => {
  return (
    obj1.x < obj2.x + obj2.width &&
    obj1.x + obj1.width > obj2.x &&
    obj1.y < obj2.y + obj2.height &&
    obj1.y + obj1.height > obj2.y
  );
}; 