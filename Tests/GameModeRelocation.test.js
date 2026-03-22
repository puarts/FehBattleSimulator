import { describe, it, expect } from 'vitest';

describe('GameMode relocation to StatusConstants.js', () => {
    it('GameMode が StatusConstants.js から正しく export される', async () => {
        const { GameMode } = await import('../Sources/StatusConstants.js');
        expect(GameMode).toBeDefined();
        expect(typeof GameMode).toBe('object');
    });

    it('GameMode の全値が正しい（移動前後で値が一致）', async () => {
        const { GameMode } = await import('../Sources/StatusConstants.js');
        expect(GameMode.AetherRaid).toBe(0);
        expect(GameMode.Arena).toBe(1);
        expect(GameMode.AllegianceBattles).toBe(2);
        expect(GameMode.ResonantBattles).toBe(3);
        expect(GameMode.TempestTrials).toBe(4);
        expect(GameMode.PawnsOfLoki).toBe(5);
        expect(GameMode.SummonerDuels).toBe(6);
    });

    it('DamageCalculator.js 内で GameMode が定義されていない（StatusConstants.js からの import のみ）', async () => {
        const fs = await import('fs');
        const path = await import('path');
        const content = fs.readFileSync(
            path.resolve(process.cwd(), 'Sources/DamageCalculator.js'), 'utf-8'
        );
        // GameMode の定義（const GameMode = {）が存在しないことを確認
        const defMatch = content.match(/^\s*const\s+GameMode\s*=/m);
        expect(defMatch).toBeNull();
    });
});
