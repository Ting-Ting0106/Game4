/**
 * ui.js - UI 管理與渲染 (V15.4 法師箭頭清晰版)
 * 
 * 改進：
 * 1. 法師卡牌使用明確的方向箭頭
 * 2. 棋盤上的法師也顯示方向箭頭
 */

import { GAME_CONFIG, PIECE_DATA, MAGE_DIRECTIONS } from './config.js';

export class GameUI
{
    constructor()
    {
        this.SIZE = GAME_CONFIG.BOARD_SIZE;
        this.listeners = {};

        // 圓周長：2 * PI * r (r=45)
        this.CIRCUMFERENCE = 2 * Math.PI * 45;
    }

    on(event, callback) { this.listeners[event] = callback; }

    initBoard()
    {
        const boardEl = document.getElementById('board');
        boardEl.innerHTML = '';
        boardEl.style.gridTemplateColumns = `repeat(${this.SIZE}, 1fr)`;
        boardEl.style.gridTemplateRows = `repeat(${this.SIZE}, 1fr)`;

        for (let r = 0; r < this.SIZE; r++)
        {
            for (let c = 0; c < this.SIZE; c++)
            {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.onclick = () => this.listeners['onCellClick']?.(r, c);
                boardEl.appendChild(cell);
            }
        }

        // 初始化 Timer 為滿的
        this.updateTimer(1, 1);
    }

    /**
     * 修正：棋盤渲染加入法師方向顯示
     */
    render(board)
    {
        const cells = document.querySelectorAll('.cell');
        for (let r = 0; r < this.SIZE; r++)
        {
            for (let c = 0; c < this.SIZE; c++)
            {
                const cell = cells[r * this.SIZE + c];
                cell.innerHTML = '';
                const p = board.getPiece(r, c);
                if (p)
                {
                    const el = document.createElement('div');
                    el.className = `piece ${PIECE_DATA[p.type].class} ${p.p.toLowerCase()}`;
                    el.innerHTML = `<span>${PIECE_DATA[p.type].icon}</span>`;

                    // 騎士：顯示衝鋒方向箭頭
                    if (p.knightDir)
                    {
                        const dir = document.createElement('div');
                        dir.className = 'dir-hint';
                        dir.innerText = p.knightDir.icon;
                        el.appendChild(dir);
                    }

                    // 🔥 新增：法師也要顯示方向箭頭
                    if (p.type === 'MAGE' && p.mageDir)
                    {
                        const mageArrow = document.createElement('div');
                        mageArrow.className = 'dir-hint mage-dir';
                        const dirConfig = MAGE_DIRECTIONS[p.mageDir];
                        mageArrow.innerText = dirConfig.icon;
                        mageArrow.style.color = dirConfig.color;
                        el.appendChild(mageArrow);
                    }

                    cell.appendChild(el);
                }
            }
        }
    }

    updateRoleIndicator(role)
    {
        const tag = document.getElementById('my-role-tag');
        tag.style.display = 'block';
        if (role === 'PLAYER')
        {
            tag.innerText = "你的陣營：藍方 (先手)";
            tag.className = 'tag-blue';
        } else
        {
            tag.innerText = "你的陣營：紅方 (後手)";
            tag.className = 'tag-red';
        }
    }

    /**
     * 修正：法師卡牌使用清晰的方向顯示
     */
    updateCard(hand, handDir, currentTurn, mageDir)
    {
        const cardEl = document.getElementById('game-card');
        const iconEl = document.getElementById('res-icon');
        const dirEl = document.getElementById('res-dir');

        iconEl.innerText = PIECE_DATA[hand].icon;

        // 根據手牌類型設定方向提示
        if (hand === 'MAGE')
        {
            // 法師：顯示清晰的方向指示
            const dirConfig = MAGE_DIRECTIONS[mageDir] || MAGE_DIRECTIONS.horizontal;
            dirEl.innerText = dirConfig.icon;
            dirEl.style.color = dirConfig.color;
        } else if (hand === 'KNIGHT' && handDir)
        {
            // 騎士：顯示衝鋒方向
            dirEl.innerText = handDir.icon;
            dirEl.style.color = '#e74c3c'; // 紅色表示騎士
        } else
        {
            // 領主：不顯示方向
            dirEl.innerText = '';
            dirEl.style.color = '';
        }

        cardEl.classList.remove('glow-p1', 'glow-p2');
        if (currentTurn === 'PLAYER') cardEl.classList.add('glow-p1');
        else cardEl.classList.add('glow-p2');
    }

    updateTimer(timeLeft, totalTime) 
    {
        const bar = document.getElementById('timer-bar');
        if (!bar) return;

        let fraction = timeLeft / totalTime;
        if (fraction < 0) fraction = 0;

        const offset = this.CIRCUMFERENCE * (1 - fraction);
        bar.style.strokeDashoffset = offset;

        if (timeLeft <= 5)
        {
            bar.style.stroke = "var(--timer-warn)";
        } else
        {
            bar.style.stroke = "var(--timer-normal)";
        }
    }

    updateTurnIndicator(turn, isMyTurn)
    {
        const banner = document.getElementById('turn-banner');
        const bannerText = document.getElementById('banner-text');

        if (!banner || !bannerText) return;

        if (isMyTurn)
        {
            bannerText.innerText = "● 你的回合";
        } else
        {
            bannerText.innerText = "○ 等待對手...";
        }

        if (turn === 'PLAYER')
        {
            banner.style.background = 'rgba(44, 62, 80, 0.7)';
        } else
        {
            banner.style.background = 'rgba(192, 57, 43, 0.7)';
        }

        banner.classList.remove('show');
        void banner.offsetHeight;

        setTimeout(() =>
        {
            banner.classList.add('show');
        }, 5);
    }

    setMyId(id) { document.getElementById('my-id').innerText = id; }
    hideLobby() { document.getElementById('lobby-overlay').style.display = 'none'; }
    showLobby() { document.getElementById('lobby-overlay').style.display = 'flex'; }
    showPVPSetup() { document.getElementById('pvp-setup').style.display = 'block'; }
    getInputPeerId() { return document.getElementById('peer-id-input').value.trim().toUpperCase(); }

    showWin(isMe)
    {
        const modal = document.getElementById('win-modal');
        const title = document.getElementById('win-title');
        const desc = document.getElementById('win-desc');

        if (isMe)
        {
            title.innerText = "✨ 你贏了！✨";
            title.style.color = "var(--p1)";
            desc.innerText = "領地成功守護！";
        } else
        {
            title.innerText = "💀 你輸了... 💀";
            title.style.color = "var(--p2)";
            desc.innerText = "領地已失守...";
        }

        modal.classList.add('show');
    }

    hideWin()
    {
        document.getElementById('win-modal').classList.remove('show');
    }

    async showMessage(message, isWarning = false)
    {
        const msgPop = document.getElementById('msg-pop');
        msgPop.innerText = message;

        if (isWarning)
        {
            msgPop.style.borderColor = "#ff4757";
            msgPop.style.color = "#ff4757";
        } else
        {
            msgPop.style.borderColor = "rgba(255,235,59,0.3)";
            msgPop.style.color = "var(--accent)";
        }

        msgPop.style.opacity = '1';

        await new Promise(res => setTimeout(() =>
        {
            msgPop.style.opacity = '0';
            res();
        }, 800));
    }
}