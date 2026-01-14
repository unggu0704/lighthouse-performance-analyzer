// config.js - 설정 관리
module.exports = {
    // 측정 설정
    MEASUREMENTS_PER_CACHE_TYPE: 2,
    WAIT_TIME_BETWEEN_MEASUREMENTS: 2000, // 2초
    MAX_RETRIES: 2,
    MEASUREMENT_TIMEOUT: 30000, // 30초

    // Chrome 설정
    CHROME_PORT: 9222,
    CHROME_FLAGS: [
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--disable-default-apps',
        '--no-first-run',
        '--disable-background-timer-throttling'
    ],

    // 측정 대상 사이트
    SITES: [
        {
            name: 'KT 메인',
            url: 'https://shop.kt.com/main.do'
        },
        {
            name: 'KT 모바일 상품',
            url: 'https://shop.kt.com/m/display/olhsPlan.do?plnDispNo=2291'
        },
        {
            name: 'KT 상품 상세',
            url: 'https://shop.kt.com/m/display/olhsPlan.do?plnDispNo=2291'
        }
    ],

    // 성능 지표
    PERFORMANCE_METRICS: ['FCP', 'LCP', 'TBT', 'CLS', 'SI'],

    // Lighthouse 설정
    LIGHTHOUSE_OPTIONS: {
        logLevel: 'error',
        output: 'json',
        onlyCategories: ['performance'],
        settings: {
            maxWaitForFcp: 30 * 1000,
            maxWaitForLoad: 30 * 1000,
            networkQuietThresholdMs: 1000,
            cpuQuietThresholdMs: 1000,
            formFactor: 'desktop',
            throttlingMethod: 'simulate', // trace 수집을 위한 시뮬레이션 모드
            throttling: {
                rttMs: 40,
                throughputKbps: 10240,
                cpuSlowdownMultiplier: 1,
                requestLatencyMs: 0,
                downloadThroughputKbps: 0,
                uploadThroughputKbps: 0
            },
            screenEmulation: {
                mobile: false,
                width: 1350,
                height: 940,
                deviceScaleFactor: 1,
                disabled: false
            },
            emulatedUserAgent: false,
            // trace 수집 명시적 활성화
            onlyAudits: [
                'first-contentful-paint',
                'largest-contentful-paint',
                'total-blocking-time',
                'cumulative-layout-shift',
                'speed-index'
            ]
        }
    },

    // 리포트 설정
    REPORT_FILENAME: 'KT샵_성능측정_결과'
};