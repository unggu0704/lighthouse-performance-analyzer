console.log('🔍 [DEBUG] 디버그 스크립트 시작');

async function test() {
    try {
        console.log('1. 모듈 로드 테스트...');
        const ChromeManager = require('./modules/ChromeManager');
        const LighthouseRunner = require('./modules/LighthouseRunner'); 
        const config = require('./config');
        console.log('✅ 모듈 로드 성공');
        
        console.log('2. 기존 Chrome 연결 테스트...');
        // Chrome이 이미 실행 중이므로 포트 9222에 연결 시도
        const lighthouse = require('lighthouse');
        
        console.log('3. 간단한 Lighthouse 테스트...');
        const options = {
            logLevel: 'info',
            output: 'json',
            onlyCategories: ['performance'],
            port: 9222,
            settings: {
                maxWaitForFcp: 10000,
                maxWaitForLoad: 10000,
            }
        };
        
        console.log('4. Google.com 테스트 측정 시작...');
        const result = await lighthouse('https://google.com', options);
        
        if (result && result.lhr) {
            console.log('✅ Lighthouse 측정 성공!');
            const fcp = result.lhr.audits['first-contentful-paint']?.numericValue || 0;
            console.log(`   FCP: ${fcp}ms`);
        }
        
        console.log('✅ 모든 테스트 완료');
        
    } catch (error) {
        console.error('❌ 테스트 실패:', error.message);
        console.error('스택 트레이스:', error.stack);
    }
    
    process.exit(0);
}

// 30초 타임아웃 추가
setTimeout(() => {
    console.error('❌ 30초 타임아웃 - 프로그램 강제 종료');
    process.exit(1);
}, 30000);

test();
