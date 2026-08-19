/**
 * 转盘旋转计算单元测试
 * 测试 weightedPick、segments 计算、spin 目标角度、onSpinEnd 结果一致性
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ===== 从 LotteryWheel.tsx 中提取的核心逻辑（便于独立测试）=====

interface Prize {
  name: string;
  weight: number;
}

function weightedPick(prizes: Prize[]): number {
  const total = prizes.reduce((s, p) => s + Math.max(p.weight, 0), 0);
  if (total <= 0) return -1;
  let r = Math.random() * total;
  for (let i = 0; i < prizes.length; i++) {
    r -= Math.max(prizes[i].weight, 0);
    if (r <= 0) return i;
  }
  return prizes.length - 1;
}

interface Segment {
  start: number;
  end: number;
  angle: number;
}

function buildSegments(prizes: Prize[]): Segment[] {
  const totalWeight = prizes.reduce((s, p) => s + Math.max(p.weight, 0), 0) || 1;
  let acc = 0;
  return prizes.map((p) => {
    const start = acc;
    const angle = (Math.max(p.weight, 0) / totalWeight) * 360;
    acc += angle;
    return { start, end: acc, angle };
  });
}

/**
 * 模拟 spin() 中的旋转计算
 * @param currentRotation 当前旋转角度
 * @param segments 扇区数组
 * @param targetIndex 目标奖品索引
 * @returns 旋转后的新角度
 */
function simulateSpin(currentRotation: number, segments: Segment[], targetIndex: number): number {
  const seg = segments[targetIndex];
  const center = (seg.start + seg.end) / 2;
  const spins = 5;
  // 原始代码逻辑
  const targetMod = (360 - center) % 360;
  const currentMod = ((currentRotation % 360) + 360) % 360;
  let delta = targetMod - currentMod;
  if (delta < 0) delta += 360;
  return currentRotation + spins * 360 + delta;
}

/**
 * 模拟 onSpinEnd() 中的中奖判定逻辑
 * @param finalRotation 最终旋转角度
 * @param segments 扇区数组
 * @returns 中奖索引
 */
function simulateOnSpinEnd(finalRotation: number, segments: Segment[]): number {
  const currentMod = ((finalRotation % 360) + 360) % 360;
  const pointerLocal = (360 - currentMod) % 360;
  return segments.findIndex((s) => pointerLocal >= s.start && pointerLocal < s.end);
}

// ===== 测试用例 =====

describe('weightedPick', () => {
  it('应该根据权重概率选择奖品', () => {
    const prizes: Prize[] = [
      { name: 'A', weight: 90 },
      { name: 'B', weight: 10 },
    ];

    // 运行多次，验证概率分布
    const counts = { A: 0, B: 0 };
    for (let i = 0; i < 1000; i++) {
      const idx = weightedPick(prizes);
      if (idx === 0) counts.A++;
      else if (idx === 1) counts.B++;
    }

    // A 应该大约被选中 90% 次，B 大约 10% 次
    expect(counts.A).toBeGreaterThan(800);
    expect(counts.B).toBeLessThan(200);
    expect(counts.A + counts.B).toBe(1000);
  });

  it('权重为 0 的奖品不应该被选中', () => {
    const prizes: Prize[] = [
      { name: 'A', weight: 1 },
      { name: 'B', weight: 0 },
    ];

    let bCount = 0;
    for (let i = 0; i < 100; i++) {
      if (weightedPick(prizes) === 1) bCount++;
    }
    expect(bCount).toBe(0);
  });

  it('所有权重为 0 时返回 -1', () => {
    const prizes: Prize[] = [
      { name: 'A', weight: 0 },
      { name: 'B', weight: 0 },
    ];
    expect(weightedPick(prizes)).toBe(-1);
  });
});

describe('buildSegments', () => {
  it('等权重奖品应该平分 360 度', () => {
    const prizes: Prize[] = [
      { name: 'A', weight: 1 },
      { name: 'B', weight: 1 },
      { name: 'C', weight: 1 },
    ];
    const segments = buildSegments(prizes);

    expect(segments).toHaveLength(3);
    segments.forEach((seg) => {
      expect(seg.angle).toBeCloseTo(120, 5);
    });
    // 总角度应该是 360
    expect(segments[2].end).toBeCloseTo(360, 5);
  });

  it('权重不等时角度应该按比例分配', () => {
    const prizes: Prize[] = [
      { name: 'A', weight: 1 },
      { name: 'B', weight: 3 },
    ];
    const segments = buildSegments(prizes);

    expect(segments[0].angle).toBeCloseTo(90, 5);   // 1/4 * 360
    expect(segments[1].angle).toBeCloseTo(270, 5);   // 3/4 * 360
    expect(segments[0].start).toBe(0);
    expect(segments[0].end).toBeCloseTo(90, 5);
    expect(segments[1].start).toBeCloseTo(90, 5);
    expect(segments[1].end).toBeCloseTo(360, 5);
  });

  it('单个奖品应该占据全部 360 度', () => {
    const prizes: Prize[] = [{ name: '唯一', weight: 1 }];
    const segments = buildSegments(prizes);

    expect(segments).toHaveLength(1);
    expect(segments[0].start).toBe(0);
    expect(segments[0].end).toBeCloseTo(360, 5);
    expect(segments[0].angle).toBeCloseTo(360, 5);
  });
});

describe('spin 旋转计算', () => {
  let prizes: Prize[];
  let segments: Segment[];

  beforeEach(() => {
    prizes = [
      { name: '一等奖', weight: 1 },
      { name: '二等奖', weight: 3 },
      { name: '三等奖', weight: 6 },
      { name: '谢谢参与', weight: 10 },
    ];
    segments = buildSegments(prizes);
  });

  it('从 0 度开始转到每个奖品中心，最终指针应落在对应扇区内', () => {
    for (let i = 0; i < segments.length; i++) {
      const finalRotation = simulateSpin(0, segments, i);
      const resultIdx = simulateOnSpinEnd(finalRotation, segments);
      expect(resultIdx).toBe(i);
    }
  });

  it('从任意角度开始旋转，目标奖品判定应保持一致', () => {
    const testAngles = [0, 45, 90, 180, 270, 359, 720, -90, -45];

    for (const startAngle of testAngles) {
      for (let targetIdx = 0; targetIdx < segments.length; targetIdx++) {
        const finalRotation = simulateSpin(startAngle, segments, targetIdx);
        const resultIdx = simulateOnSpinEnd(finalRotation, segments);
        expect(resultIdx, `startAngle=${startAngle}, targetIdx=${targetIdx}`).toBe(targetIdx);
      }
    }
  });

  it('转动的总角度应该包含至少 5 圈（1800 度）', () => {
    const finalRotation = simulateSpin(0, segments, 0);
    expect(finalRotation).toBeGreaterThanOrEqual(5 * 360);
  });

  it('相同起始角度和目标，应该产生相同的旋转角度', () => {
    const rotation1 = simulateSpin(100, segments, 2);
    const rotation2 = simulateSpin(100, segments, 2);
    expect(rotation1).toBe(rotation2);
  });

  it('边界测试：targetMod 为 0 时不应导致错误', () => {
    // 当 center 正好是 360 的倍数时，targetMod = 0
    // center 不可能正好是 360 的倍数（除非只有一个奖品），这里验证边界情况
    const finalRotation = simulateSpin(0, segments, 0);
    const resultIdx = simulateOnSpinEnd(finalRotation, segments);
    expect(resultIdx).toBe(0);
  });
});

describe('端到端一致性：spin → onSpinEnd', () => {
  it('多次随机转动应该每次都命中目标奖品', () => {
    const prizes: Prize[] = [
      { name: 'A', weight: 1 },
      { name: 'B', weight: 2 },
      { name: 'C', weight: 3 },
    ];
    const segments = buildSegments(prizes);

    for (let trial = 0; trial < 100; trial++) {
      const currentRotation = Math.random() * 360 * 10; // 随机起始角度
      const targetIdx = Math.floor(Math.random() * prizes.length);

      const finalRotation = simulateSpin(currentRotation, segments, targetIdx);
      const resultIdx = simulateOnSpinEnd(finalRotation, segments);

      expect(resultIdx).toBe(targetIdx);
    }
  });

  it('连续转动后角度应该单调递增', () => {
    const segments = buildSegments([
      { name: 'A', weight: 1 },
      { name: 'B', weight: 1 },
    ]);

    let currentRotation = 0;
    const rotations: number[] = [];

    for (let i = 0; i < 10; i++) {
      const targetIdx = i % 2;
      currentRotation = simulateSpin(currentRotation, segments, targetIdx);
      rotations.push(currentRotation);
    }

    for (let i = 1; i < rotations.length; i++) {
      expect(rotations[i]).toBeGreaterThan(rotations[i - 1]);
    }
  });
});

describe('已知角度验证', () => {
  it('4 个等宽扇区：指针位置应该正确', () => {
    const prizes: Prize[] = [
      { name: '0°-90°', weight: 1 },
      { name: '90°-180°', weight: 1 },
      { name: '180°-270°', weight: 1 },
      { name: '270°-360°', weight: 1 },
    ];
    const segments = buildSegments(prizes);

    // 每个扇区 90 度
    segments.forEach((seg, i) => {
      expect(seg.start).toBe(i * 90);
      expect(seg.end).toBe((i + 1) * 90);
      expect(seg.angle).toBe(90);
    });

    // 验证每个目标的旋转结果
    for (let i = 0; i < 4; i++) {
      const finalRotation = simulateSpin(0, segments, i);
      const resultIdx = simulateOnSpinEnd(finalRotation, segments);
      expect(resultIdx).toBe(i);
    }
  });

  it('单奖品场景：总是命中该奖品', () => {
    const prizes: Prize[] = [{ name: '唯一奖', weight: 1 }];
    const segments = buildSegments(prizes);

    for (let i = 0; i < 20; i++) {
      const finalRotation = simulateSpin(Math.random() * 360, segments, 0);
      const resultIdx = simulateOnSpinEnd(finalRotation, segments);
      expect(resultIdx).toBe(0);
    }
  });
});
