/**
 * gameState.js - 遊戲狀態管理 (V2.1)
 * 
 * 新增：法師現在支持橫向和縱向兩種模式
 */

import { DIRECTIONS } from './config.js';

export class GameState
{
    constructor()
    {
        this.turn = 'PLAYER';
        this.hand = 'LORD';
        this.handDir = null;      // 騎士的方向
        this.mageDir = null;      // 法師的方向 ('horizontal' 或 'vertical')
        this.isOver = false;
        this.isProcessing = false;
        this.lastPos = null;
    }

    changeTurn()
    {
        this.turn = this.turn === 'PLAYER' ? 'AI' : 'PLAYER';
    }

    setHand(hand, dir = null, mageDir = null)
    {
        this.hand = hand;
        this.handDir = dir;
        this.mageDir = mageDir;
    }

    /**
     * 隨機生成手牌
     * 20% 法師 (其中 50% 橫向，50% 縱向)
     * 20% 騎士 (隨機方向)
     * 60% 領主
     */
    generateRandomHand(dirs)
    {
        const r = Math.random() * 100;

        if (r < 20)
        {
            // 抽到法師
            this.hand = 'MAGE';
            this.handDir = null;

            // 50% 機率決定法師方向
            const mageRandom = Math.random();
            this.mageDir = mageRandom < 0.5 ? 'horizontal' : 'vertical';
        }
        else if (r < 35)
        {
            // 抽到騎士
            this.hand = 'KNIGHT';
            this.handDir = dirs[Math.floor(Math.random() * dirs.length)];
            this.mageDir = null;
        }
        else
        {
            // 抽到領主
            this.hand = 'LORD';
            this.handDir = null;
            this.mageDir = null;
        }
    }

    reset()
    {
        this.turn = 'PLAYER';
        this.hand = 'LORD';
        this.handDir = null;
        this.mageDir = null;
        this.isOver = false;
        this.isProcessing = false;
        this.lastPos = null;
    }
}