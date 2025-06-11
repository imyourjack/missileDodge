export interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CircleObject {
  x: number;
  y: number;
  radius: number;
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

/**
 * 두 원형 오브젝트 간의 충돌을 감지합니다.
 * @param circle1 첫 번째 원
 * @param circle2 두 번째 원
 * @returns 충돌 여부
 */
export const checkCircleCollision = (circle1: CircleObject, circle2: CircleObject): boolean => {
  const dx = circle1.x - circle2.x;
  const dy = circle1.y - circle2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < circle1.radius + circle2.radius;
}; 