/**
 * board.js - 處理棋盤資料結構與勝負判定
 */
import { GAME_CONFIG } from './config.js';

export class Board
{
    constructor()
    {
        this.SIZE = GAME_CONFIG.BOARD_SIZE;
        this.grid = []; // 二維陣列存儲棋子物件
        this.initBoard();
    }

    // 建立空的 10x10 矩陣
    initBoard()
    {
        this.grid = Array(this.SIZE).fill(null).map(() => Array(this.SIZE).fill(null));
    }

    // 放置棋子
    placePiece(r, c, piece)
    {
        if (r >= 0 && r < this.SIZE && c >= 0 && c < this.SIZE)
        {
            this.grid[r][c] = piece;
        }
    }

    // 移除棋子
    removePiece(r, c)
    {
        if (this.grid[r][c]) this.grid[r][c] = null;
    }

    // 獲取特定位置棋子資訊
    getPiece(r, c)
    {
        return (r >= 0 && r < this.SIZE && c >= 0 && c < this.SIZE) ? this.grid[r][c] : null;
    }

    // 檢查是否有棋子
    hasPiece(r, c)
    {
        return this.getPiece(r, c) !== null;
    }

    // 五子連線檢查核心邏輯
    checkWin(player)
    {
        for (let r = 0; r < this.SIZE; r++)
        {
            for (let c = 0; c < this.SIZE; c++)
            {
                const p = this.getPiece(r, c);
                // 只有「領主」棋子能觸發勝利
                if (p && p.p === player && p.type === 'LORD')
                {
                    if (this.checkFive(r, c, player)) return true;
                }
            }
        }
        return false;
    }

    // 掃描四個方向的連線數量
    checkFive(r, c, player)
    {
        const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
        return dirs.some(([dr, dc]) =>
        {
            let count = 1;
            for (let sig of [1, -1])
            {
                for (let i = 1; i < 5; i++)
                {
                    const nr = r + dr * i * sig;
                    const nc = c + dc * i * sig;
                    const p = this.getPiece(nr, nc);
                    if (p && p.p === player && p.type === 'LORD') count++;
                    else break;
                }
            }
            return count >= 5;
        });
    }
}