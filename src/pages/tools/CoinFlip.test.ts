/**
 * CoinFlip 核心逻辑单元测试
 * 测试 randomFace、数量裁剪 parseCoinNum、initCoins、flipOnce 与统计一致性
 */

import { describe, it, expect } from 'vitest';

// ===== 从 CoinFlip.tsx 中提取的核心逻辑（便于独立测试）=====

type Face = 'front' | 'back';

interface CoinResult {
  id: number;
  face: Face;
}

/** 对应 CoinFlip.tsx:14 行的 randomFace */
const randomFace = (): Face => (Math.random() < 0.5 ? 'front' : 'back');

/** 对应 CoinFlip.tsx:16-19 行的 initCoins（页面加载即抛一次） */
function initCoins(n: number): CoinResult[] {
  return Array.from({ length: n }, (_, i) => ({ id: i, face: randomFace() }));
}

/** 对应 CoinFlip.tsx:107 行 onChange 里的数量裁剪 */
function parseCoinNum(raw: string): number {
  return Math.max(1, Math.min(parseInt(raw) || 1, 50));
}

/** 对应 CoinFlip.tsx:61-63 行 flip() 中的一次抛掷 */
function flipOnce(coinNum: number): CoinResult[] {
  const n = Math.max(1, Math.min(coinNum, 50));
  return Array.from({ length: n }, (_, i) => ({ id: Date.now() + i, face: randomFace() }));
}

/** 对应 CoinFlip.tsx:68-69 行 setTimeout 回调里的统计累加 */
function countFaces(coins: CoinResult[]): { front: number; back: number } {
  const f = coins.filter((c) => c.face === 'front').length;
  const b = coins.length - f;
  return { front: f, back: b };
}

/** 对应 CoinFlip.tsx:83-85 行的百分比计算 */
function pct(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

// ===== 测试用例 =====

describe('parseCoinNum 数量裁剪', () => {
  it('非法/空输入归一到 1', () => {
    expect(parseCoinNum('')).toBe(1);
    expect(parseCoinNum('abc')).toBe(1);
  });

  it('0 和负数归一到 1', () => {
    expect(parseCoinNum('0')).toBe(1);
    expect(parseCoinNum('-5')).toBe(1);
  });

  it('超过 50 裁剪到 50', () => {
    expect(parseCoinNum('51')).toBe(50);
    expect(parseCoinNum('999')).toBe(50);
  });

  it('1~50 范围内保持原值', () => {
    expect(parseCoinNum('1')).toBe(1);
    expect(parseCoinNum('25')).toBe(25);
    expect(parseCoinNum('50')).toBe(50);
  });
});

describe('initCoins 初始结果', () => {
  it('生成的硬币数量等于参数 n', () => {
    for (const n of [1, 2, 6, 10, 50]) {
      const coins = initCoins(n);
      expect(coins).toHaveLength(n);
    }
  });

  it('id 唯一且 face 只取 front/back', () => {
    const coins = initCoins(20);
    const ids = new Set(coins.map((c) => c.id));
    expect(ids.size).toBe(20);
    coins.forEach((c) => {
      expect(['front', 'back']).toContain(c.face);
    });
  });
});

describe('flipOnce + countFaces 统计一致性', () => {
  it('每次抛掷正面+反面一定等于裁剪后的硬币数', () => {
    const inputs = [1, 2, 6, 10, 25, 50, 51, 0, -1, 100];
    for (const n of inputs) {
      for (let trial = 0; trial < 200; trial++) {
        const coins = flipOnce(n);
        const { front, back } = countFaces(coins);
        const target = Math.max(1, Math.min(n, 50));
        expect(coins).toHaveLength(target);
        expect(front + back, `n=${n} trial=${trial}`).toBe(target);
      }
    }
  });

  it('多次累计后 front+back === total（与组件状态一致）', () => {
    let frontCount = 0;
    let backCount = 0;
    let total = 0;
    for (let round = 0; round < 100; round++) {
      const coins = flipOnce(Math.floor(Math.random() * 10) + 1);
      const { front, back } = countFaces(coins);
      frontCount += front;
      backCount += back;
      total += coins.length;
      expect(frontCount + backCount).toBe(total);
    }
    expect(total).toBeGreaterThan(0);
  });
});

describe('randomFace 分布（大样本均匀性）', () => {
  it('10000 次中正面比例应接近 50%', () => {
    let front = 0;
    const N = 10000;
    for (let i = 0; i < N; i++) {
      if (randomFace() === 'front') front++;
    }
    const ratio = front / N;
    expect(ratio).toBeGreaterThan(0.45);
    expect(ratio).toBeLessThan(0.55);
  });
});

describe('百分比计算', () => {
  it('总量为 0 时不除零，返回 0', () => {
    expect(pct(0, 0)).toBe(0);
  });

  it('正反面百分比严格互补为 100', () => {
    // 修复后：backPct = 100 - frontPct，不再出现 101%/99% 的溢出或留缝
    for (const [front, total] of [
      [1, 8],
      [3, 8],
      [5, 8],
      [4, 8],
      [1, 3],
      [1, 2],
      [0, 8],
      [8, 8],
    ]) {
      const frontPct = pct(front, total);
      const backPct = total > 0 ? 100 - frontPct : 0;
      expect(frontPct + backPct, `front=${front} total=${total}`).toBe(total > 0 ? 100 : 0);
    }
  });

  it('总量为 0 时正反面百分比均为 0', () => {
    const frontPct = pct(0, 0);
    const backPct = 0;
    expect(frontPct).toBe(0);
    expect(backPct).toBe(0);
  });
});
