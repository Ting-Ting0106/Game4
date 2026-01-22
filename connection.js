/**
 * connection.js - 連線管理
 */

import { PEER_CONFIG } from './config.js';

export class GameConnection
{
    constructor()
    {
        this.peer = null;
        this.conn = null;
        this.myRole = 'PLAYER';
        this.listeners = {};
    }

    on(event, callback) { this.listeners[event] = callback; }

    generateShortId() { return Math.random().toString(36).substring(2, 8).toUpperCase(); }

    initPeer()
    {
        if (this.peer) return;
        const shortId = this.generateShortId();
        this.peer = new Peer(shortId, PEER_CONFIG);

        this.peer.on('open', (id) =>
        {
            if (this.listeners['onConnected']) this.listeners['onConnected'](id);
        });

        this.peer.on('connection', (c) =>
        {
            this.conn = c;
            this.myRole = 'PLAYER';
            this.setupConnection();
        });
    }

    async connectToFriend(targetId)
    {
        this.conn = this.peer.connect(targetId);
        this.myRole = 'AI';
        return new Promise((resolve, reject) =>
        {
            this.conn.on('open', () => { this.setupConnection(); resolve(); });
            setTimeout(() => { if (!this.conn.open) reject(new Error('連線超時')); }, 10000);
        });
    }

    setupConnection()
    {
        this.conn.on('data', (data) =>
        {
            if (this.listeners['onData']) this.listeners['onData'](data);
        });
        this.conn.on('close', () =>
        {
            if (this.listeners['onDisconnected']) this.listeners['onDisconnected']();
        });
    }

    send(data) { if (this.conn && this.conn.open) this.conn.send(data); }
    isConnected() { return this.conn && this.conn.open; }
}