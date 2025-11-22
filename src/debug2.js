console.log('🔍 [DEBUG] 빠른 타임아웃 테스트');

async function quickTest() {
    try {
        const lighthouse = require('lighthouse');
        
        console.log('Chrome 수동 시작...');
        const chromeLauncher = require('chrome-launcher');
        const chrome = await chromeLauncher.launch({
            chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox'],
            port: 9222
        });
        
        console.log(`Chrome 시작됨 (포트: ${chrome.port})`);
        
        const options = {
            logLevel: 'info',
            output: 'json', 
            onlyCategories: ['performance'],
            port: chrome.port,
            settings: {
                maxWaitForFcp: 5000,      // 5초로 단축
                maxWaitForLoad: 5000,     // 5초로 단축
                networkQuietThresholdMs: 1000,
                cpuQuietThresholdMs: 1000,
            }
        };
        
        console.log('간단한 페이지로 테스트 시작...');
        
        // Google 대신 더 빠른 페이지로 테스트
        const result = await lighthouse('https://example.com', options);
        
        if (result && result.lhr) {
            console.log('✅ 측정 성공!');
            const fcp = result.lhr.audits['first-contentful-paint']?.numericValue || 0;
            console.log(`FCP: ${fcp}ms`);
        }
        
        await chrome.kill();
        console.log('✅ 테스트 완료');
        
    } catch (error) {
        console.error('❌ 에러:', error.message);
    }
    
    process.exit(0);
}

// 15초 타임아웃
setTimeout(() => {
    console.error('❌ 15초 타임아웃 - 여전히 문제 있음');
    process.exit(1);
}, 15000);

quickTest();