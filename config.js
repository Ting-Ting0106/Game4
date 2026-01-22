/**
 * config.js - 遊戲全域參數配置 (V2.1)
 * 
 * 改進：法師和騎士方向顯示改為使用 config 統一管理
 */

export const GAME_CONFIG = {
    BOARD_SIZE: 10,
    WIN_COUNT: 5,
    ANIMATION_DELAY: 400,
    TURN_TIME_LIMIT: 15,
};

// 棋子類型與對應圖示
export const PIECE_DATA = {
    LORD: { icon: '🏰', class: 'lord' },
    KNIGHT: { icon: '🐎', class: 'knight' },
    MAGE: { icon: '🧙', class: 'mage' },
};

// 騎士移動方向配置（保持原樣）
export const DIRECTIONS = [
    { dr: -1, dc: 0, icon: '⬆️', name: 'up' },
    { dr: 1, dc: 0, icon: '⬇️', name: 'down' },
    { dr: 0, dc: -1, icon: '⬅️', name: 'left' },
    { dr: 0, dc: 1, icon: '➡️', name: 'right' },
];

// 🔥 新增：法師方向配置（與騎士類似）
export const MAGE_DIRECTIONS = {
    horizontal: {
        icon: '↔️',        // 左右箭頭
        displayText: '→ 🧙 ←',  // 卡牌顯示文字
        color: '#3498db',  // 藍色
        name: 'horizontal'
    },
    vertical: {
        icon: '↕️',        // 上下箭頭
        displayText: '↓ 🧙 ↑',  // 卡牌顯示文字
        color: '#2ecc71',  // 綠色
        name: 'vertical'
    }
};

// PeerJS 連線伺服器配置
export const PEER_CONFIG = {
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true,
    config: {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    }
};