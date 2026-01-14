// modules/ChromeManager.js - Chrome 브라우저 관리
const chromeLauncher = require('chrome-launcher');
const { exec } = require('child_process');
const { promisify } = require('util');
const config = require('../config');

const execAsync = promisify(exec);

class ChromeManager {
    constructor() {
        this.chrome = null;
        this.chromePort = null;
    }

    async startChrome() {
        try {
            console.log('🚀 Chrome 브라우저 시작 중...');
            
            // 기존 Chrome 프로세스 정리
            await this.killExistingChrome();
            await this.sleep(500);

            this.chrome = await chromeLauncher.launch({
                chromeFlags: config.CHROME_FLAGS,
                port: config.CHROME_PORT,
                connectionPollInterval: 500,  
                maxConnectionRetries: 50     
            });

            this.chromePort = this.chrome.port;
            console.log(`✅ Chrome 시작 완료 (포트: ${this.chromePort})`);

            // 연결 안정화를 위한 대기
            await this.sleep(1000);
            
        } catch (error) {
            console.error('❌ Chrome 시작 실패:', error);
            throw error;
        }
    }

    async stopChrome() {
        try {
            if (this.chrome) {
                console.log('🛑 Chrome 브라우저 종료 중...');
                await this.chrome.kill();
                this.chrome = null;
                this.chromePort = null;
                console.log('✅ Chrome 종료 완료');
            }
        } catch (error) {
            console.error('❌ Chrome 종료 중 오류:', error);
            await this.killExistingChrome();
            this.chrome = null;
            this.chromePort = null;
        }
    }

    async killExistingChrome() {
        const isWin = process.platform === 'win32';
        try {
            if (isWin) {
                // Windows: taskkill 명령어 사용
                await execAsync('taskkill /F /IM chrome.exe /T 2>nul || exit 0');
            } else {
                // Mac/Linux: pkill 명령어 사용
                await execAsync('pkill -f "chrome" || true');
            }
        } catch (error) {
            // ignore
        }
    }

    async checkConnection() {
        if (!this.chromePort) return false;
        
        try {
            const http = require('http');
            
            return new Promise((resolve) => {
                const req = http.get(`http://localhost:${this.chromePort}/json`, (res) => {
                    resolve(res.statusCode === 200);
                });
                
                req.on('error', () => resolve(false));
                req.setTimeout(3000, () => {
                    req.destroy();
                    resolve(false);
                });
            });
        } catch (error) {
            return false;
        }
    }

    async restartChrome() {
        console.log('🔄 Chrome 재시작 중...');
        await this.stopChrome();
        await this.sleep(1000);
        await this.startChrome();
    }

    isRunning() {
        return this.chrome !== null && this.chromePort !== null;
    }

    getPort() {
        return this.chromePort;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = ChromeManager;