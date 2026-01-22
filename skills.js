/**
 * skills.js - 技能邏輯 (V2.0)
 * 
 * 新增功能：
 * 法師現在有兩種模式
 * 1. 橫向洗腦 (預設)：轉化左右兩側的敵方棋子
 * 2. 縱向洗腦 (新增)：轉化上下兩側的敵方棋子
 * 
 * 機制：抽到法師時有 50% 機率是橫向，50% 機率是縱向
 */

import { GAME_CONFIG } from './config.js';

export class SkillSystem
{
    constructor(board)
    {
        this.board = board;
        this.SIZE = GAME_CONFIG.BOARD_SIZE;
    }

    async checkAndTriggerSkills(onMessage)
    {
        for (let r = 0; r < this.SIZE; r++)
        {
            for (let c = 0; c < this.SIZE; c++)
            {
                const piece = this.board.getPiece(r, c);

                if (!piece) continue;

                if (piece.type === 'KNIGHT' && piece.knightDir)
                {
                    if (await this.triggerKnightCharge(r, c, piece, onMessage))
                    {
                        return true;
                    }
                }

                if (piece.type === 'MAGE')
                {
                    if (await this.triggerMageConvert(r, c, piece, onMessage))
                    {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    async triggerKnightCharge(r, c, piece, onMessage)
    {
        const tr = r + piece.knightDir.dr;
        const tc = c + piece.knightDir.dc;

        if (tr >= 0 && tr < this.SIZE && tc >= 0 && tc < this.SIZE)
        {
            const target = this.board.getPiece(tr, tc);

            if (target && target.p !== piece.p)
            {
                if (onMessage)
                {
                    await onMessage('騎士衝鋒！');
                }
                this.board.removePiece(tr, tc);
                this.board.removePiece(r, c);
                return true;
            }
        }
        return false;
    }

    /**
     * 法師轉化邏輯
     * 根據 mageDir 屬性判斷是橫向還是縱向洗腦
     * 
     * mageDir = 'horizontal' (或 null)：轉化左右兩側 [[0, -1], [0, 1]]
     * mageDir = 'vertical'：轉化上下兩側 [[-1, 0], [1, 0]]
     */
    async triggerMageConvert(r, c, piece, onMessage)
    {
        const targets = [];

        // 判斷法師方向（預設為橫向）
        const mageDir = piece.mageDir || 'horizontal';

        // 根據方向決定檢查的相對位置
        const directions = mageDir === 'vertical'
            ? [[-1, 0], [1, 0]]  // 上下
            : [[0, -1], [0, 1]]; // 左右

        for (const [dr, dc] of directions)
        {
            const tr = r + dr;
            const tc = c + dc;

            if (tr >= 0 && tr < this.SIZE && tc >= 0 && tc < this.SIZE)
            {
                const target = this.board.getPiece(tr, tc);
                if (target && target.p !== piece.p)
                {
                    targets.push({ tr, tc });
                }
            }
        }

        if (targets.length > 0)
        {
            if (onMessage)
            {
                const dirText = mageDir === 'vertical' ? '縱向' : '橫向';
                await onMessage(`法術洗腦！(${dirText})`);
            }

            targets.forEach(t =>
            {
                const target = this.board.getPiece(t.tr, t.tc);
                target.p = piece.p;
                target.isConverted = true;
            });

            this.board.removePiece(r, c);
            return true;
        }
        return false;
    }
}