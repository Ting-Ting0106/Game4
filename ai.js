/**
 * ai.js - V27.0 活四防守修正版
 * 
 * 重點修復：
 * 1. 修正活四檢測：確保正確識別 "4個連線 + 至少一端開口" 的活四
 * 2. 強化活四阻擋權重：活四阻擋 >= 活四評估分數
 * 3. 完善威脅掃描：活四和活三分開計算，優先防守活四
 */

import { GAME_CONFIG } from './config.js';

export class AIPlayer
{
    constructor(board)
    {
        this.board = board;
        this.SIZE = GAME_CONFIG.BOARD_SIZE;

        // 權重常數：防禦必須遠大於進攻
        this.SCORE = {
            WIN: 1000000000,          // 直接獲勝
            BLOCK_FOUR: 300000000,    // 🔥 阻擋活四或死四 (必須是最高防守權重)
            BLOCK_LIVE_FOUR: 250000000, // 阻擋活四特別版本
            MY_FOUR: 5000000,         // 自己造四
            BLOCK_THREE: 2000000,     // 阻擋活三
            MY_THREE: 800000,         // 自己造三
            DANGER_ZONE: -10000000,   // 陷阱避讓
            CENTER_BIAS: 2000         // 置中加權
        };
    }

    chooseAction(hand, handDir, aiRole, mageDir)
    {
        const opp = aiRole === 'AI' ? 'PLAYER' : 'AI';
        const me = aiRole;

        let bestScore = -Infinity;
        let bestMoves = [];

        // 掃描全棋盤空格
        for (let r = 0; r < this.SIZE; r++)
        {
            for (let c = 0; c < this.SIZE; c++)
            {
                if (this.board.hasPiece(r, c)) continue;

                // 核心評估函式
                let score = this.evaluateMove(r, c, hand, handDir, me, opp, mageDir);

                // 基礎位置加成：越靠近中心分越高
                const distToCenter = Math.abs(r - 4.5) + Math.abs(c - 4.5);
                score += (this.SIZE - distToCenter) * this.SCORE.CENTER_BIAS;

                if (score > bestScore)
                {
                    bestScore = score;
                    bestMoves = [{ r, c }];
                } else if (score === bestScore)
                {
                    bestMoves.push({ r, c });
                }
            }
        }
        return bestMoves.length > 0
            ? bestMoves[Math.floor(Math.random() * bestMoves.length)]
            : { r: 5, c: 5 };
    }

    /**
     * 模擬落子並計算該步的綜合價值
     * 🔥 核心邏輯：防守 > 進攻
     */
    evaluateMove(r, c, hand, handDir, me, opp, mageDir)
    {
        // 1. 獲取當前真實棋盤的威脅狀態
        const currentThreat = this.analyzeThreats(this.board.grid, opp);

        // 2. 建立虛擬棋盤進行模擬
        let grid = this.copyGrid();
        let skillBonus = 0;

        // --- 執行模擬動作 ---
        if (hand === 'KNIGHT' && handDir)
        {
            const tr = r + handDir.dr, tc = c + handDir.dc;
            if (this.isIn(tr, tc) && grid[tr][tc]?.p === opp)
            {
                grid[tr][tc] = null;
                skillBonus += 100000;
            }
            grid[r][c] = null;
        } else if (hand === 'MAGE')
        {
            const dirs = mageDir === 'vertical' ? [[-1, 0], [1, 0]] : [[0, -1], [0, 1]];
            dirs.forEach(([dr, dc]) =>
            {
                const tr = r + dr, tc = c + dc;
                if (this.isIn(tr, tc) && grid[tr][tc] && grid[tr][tc].p === opp)
                {
                    grid[tr][tc].p = me;
                    skillBonus += 200000;
                }
            });
            grid[r][c] = { p: me, type: 'MAGE' };
        } else
        {
            grid[r][c] = { p: me, type: 'LORD' };
        }

        // 3. 檢查 AI 是否直接獲勝
        if (this.checkWinInGrid(grid, me)) return this.SCORE.WIN;

        // 4. 重算威脅 (模擬後的棋盤狀態)
        const nextThreat = this.analyzeThreats(grid, opp);

        let defenseBonus = 0;

        // 🔥 防守優先級 1：對手有活四威脅，必須阻擋！
        if (nextThreat.liveFour < currentThreat.liveFour)
        {
            defenseBonus = this.SCORE.BLOCK_LIVE_FOUR;
        }
        // 🔥 防守優先級 2：對手有死四威脅，也要阻擋
        else if (nextThreat.four < currentThreat.four)
        {
            defenseBonus = this.SCORE.BLOCK_FOUR;
        }
        // 防守優先級 3：對手有活三威脅
        else if (nextThreat.three < currentThreat.three)
        {
            defenseBonus = this.SCORE.BLOCK_THREE;
        }

        // 5. 陷阱檢查
        const isTrap = this.isCellUnderSkillThreat(r, c, opp);
        if (isTrap && defenseBonus < this.SCORE.BLOCK_FOUR)
        {
            defenseBonus += this.SCORE.DANGER_ZONE;
        }

        // 6. 進攻分數 (自己連線的長度)
        const myAttackScore = this.getGridLineScore(grid, me);

        return myAttackScore + defenseBonus + skillBonus;
    }

    /**
     * 掃描全棋盤，計算對手的威脅
     * 🔥 關鍵修正：分開計算活四和死四
     */
    analyzeThreats(grid, player)
    {
        let stats = { liveFour: 0, four: 0, three: 0 };

        for (let r = 0; r < this.SIZE; r++)
        {
            for (let c = 0; c < this.SIZE; c++)
            {
                if (grid[r][c]?.p === player && grid[r][c]?.type === 'LORD')
                {
                    const info = this.getLineInfo(grid, r, c, player);
                    stats.liveFour += info.liveFour;
                    stats.four += info.four;
                    stats.three += info.three;
                }
            }
        }
        return stats;
    }

    /**
     * 從指定點發散掃描四個方向的連線狀況
     * 🔥 修正：正確計算活四（4連 + 至少一端開口）
     */
    getLineInfo(grid, r, c, player)
    {
        let res = { liveFour: 0, four: 0, three: 0 };
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

        for (const [dr, dc] of directions)
        {
            let count = 1;      // 連續子數
            let leftOpen = false;  // 左邊開口
            let rightOpen = false; // 右邊開口

            // 掃描正方向（右邊或下邊）
            for (let i = 1; i < 5; i++)
            {
                const nr = r + dr * i;
                const nc = c + dc * i;

                if (this.isIn(nr, nc))
                {
                    const cell = grid[nr][nc];
                    if (cell?.p === player && cell?.type === 'LORD')
                    {
                        count++;
                    } else if (!cell)
                    {
                        rightOpen = true;  // 遇到空格，表示右邊開口
                        break;
                    } else
                    {
                        break; // 遇到敵方或其他棋子，此方向終止
                    }
                } else
                {
                    break;
                }
            }

            // 掃描反方向（左邊或上邊）
            for (let i = 1; i < 5; i++)
            {
                const nr = r - dr * i;
                const nc = c - dc * i;

                if (this.isIn(nr, nc))
                {
                    const cell = grid[nr][nc];
                    if (cell?.p === player && cell?.type === 'LORD')
                    {
                        count++;
                    } else if (!cell)
                    {
                        leftOpen = true;  // 遇到空格，表示左邊開口
                        break;
                    } else
                    {
                        break;
                    }
                } else
                {
                    break;
                }
            }

            // --- 🔥 修正的判定邏輯 ---
            // 活四：恰好4個連線 + 至少一端開口 (如 01110 或 1110_)
            if (count === 4 && (leftOpen || rightOpen))
            {
                res.liveFour++;
            }
            // 死四：4個連線但兩端都被封 (如 01110 變成 21112)
            // 或者 5個以上連線（絕殺）
            else if (count >= 4 && (!leftOpen && !rightOpen))
            {
                res.four++;
            }
            // 活三：3個連線 + 兩端都開口 (如 01110)
            else if (count === 3 && leftOpen && rightOpen)
            {
                res.three++;
            }
        }
        return res;
    }

    /**
     * 計算全盤進攻潛力分
     */
    getGridLineScore(grid, player)
    {
        let total = 0;
        for (let r = 0; r < this.SIZE; r++)
        {
            for (let c = 0; c < this.SIZE; c++)
            {
                if (grid[r][c]?.p === player && grid[r][c]?.type === 'LORD')
                {
                    const info = this.getLineInfo(grid, r, c, player);
                    // 進攻權重必須低於防守
                    total += (info.liveFour * 20000000) +
                        (info.four * 1000000) +
                        (info.three * 100000);
                }
            }
        }
        return total;
    }

    /**
     * 檢查此位置是否在對方功能牌的直接射程內
     */
    isCellUnderSkillThreat(r, c, opp)
    {
        const checkDirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dr, dc] of checkDirs)
        {
            const nr = r + dr, nc = c + dc;
            if (this.isIn(nr, nc))
            {
                const p = this.board.getPiece(nr, nc);
                if (p && p.p === opp)
                {
                    if (p.type === 'MAGE') return true;
                    if (p.type === 'KNIGHT' && p.knightDir)
                    {
                        if (nr + p.knightDir.dr === r && nc + p.knightDir.dc === c) return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * 檢查虛擬棋盤中是否已贏
     */
    checkWinInGrid(grid, player)
    {
        for (let r = 0; r < this.SIZE; r++)
        {
            for (let c = 0; c < this.SIZE; c++)
            {
                if (grid[r][c]?.p === player && grid[r][c]?.type === 'LORD')
                {
                    if (this.isFiveInGrid(grid, r, c, player)) return true;
                }
            }
        }
        return false;
    }

    /**
     * 檢查虛擬棋盤中是否有五連
     */
    isFiveInGrid(grid, r, c, player)
    {
        const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
        return dirs.some(([dr, dc]) =>
        {
            let cnt = 1;
            for (let s of [1, -1])
            {
                for (let i = 1; i < 5; i++)
                {
                    const nr = r + dr * i * s, nc = c + dc * i * s;
                    if (this.isIn(nr, nc) && grid[nr][nc]?.p === player && grid[nr][nc]?.type === 'LORD') cnt++;
                    else break;
                }
            }
            return cnt >= 5;
        });
    }

    // 輔助函式
    copyGrid() { return this.board.grid.map(row => row.map(cell => cell ? { ...cell } : null)); }
    isIn(r, c) { return r >= 0 && r < this.SIZE && c >= 0 && c < this.SIZE; }
}