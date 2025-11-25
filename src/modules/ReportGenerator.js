// modules/ReportGenerator.js - Excel 리포트 생성
const ExcelJS = require('exceljs');
const path = require('path');
const config = require('../config');

class ReportGenerator {
    constructor() {
        this.workbook = new ExcelJS.Workbook();
    }

    async generateExcelReport(allResults) {
        try {
            console.log('📊 Excel 리포트 생성 중...');
            
            const worksheet = this.workbook.addWorksheet('성능 측정 결과');
            
            // 헤더 설정
            this.setupHeaders(worksheet);
            
            // 데이터 추가
            this.addDataRows(worksheet, allResults);
            
            // 스타일 적용
            this.applyStyles(worksheet);
            
            // 파일 저장
            const filename = this.generateFilename();
            const filepath = path.join(process.cwd(), filename);
            
            await this.workbook.xlsx.writeFile(filepath);
            console.log(`✅ Excel 리포트 생성 완료: ${filename}`);
            
            return filepath;
            
        } catch (error) {
            console.error('❌ Excel 리포트 생성 실패:', error);
            throw error;
        }
    }

    setupHeaders(worksheet) {
        const headers = [
            '사이트명',
            '회차',
            'FCP (캐시 없음)',
            'FCP (캐시 있음)',
            'LCP (캐시 없음)',
            'LCP (캐시 있음)',
            'TBT (캐시 없음)',
            'TBT (캐시 있음)',
            'CLS (캐시 없음)',
            'CLS (캐시 있음)',
            'SI (캐시 없음)',
            'SI (캐시 있음)'
        ];

        worksheet.columns = headers.map((header, index) => ({
            header,
            key: this.getColumnKey(index),
            width: this.getColumnWidth(header)
        }));
    }

    addDataRows(worksheet, allResults) {
        allResults.forEach(siteResult => {
            const siteName = siteResult.siteName;

            // 각 회차별로 캐시 없음/있음 데이터를 같은 행에 배치
            const runCount = Math.max(
                siteResult.noCache.runs.length,
                siteResult.withCache.runs.length
            );

            for (let i = 0; i < runCount; i++) {
                const noCacheRun = siteResult.noCache.runs[i];
                const withCacheRun = siteResult.withCache.runs[i];

                worksheet.addRow({
                    A: siteName,
                    B: i + 1,  // 회차
                    C: noCacheRun ? this.convertToOptimalUnit(noCacheRun.fcp) : '',
                    D: withCacheRun ? this.convertToOptimalUnit(withCacheRun.fcp) : '',
                    E: noCacheRun ? this.convertToOptimalUnit(noCacheRun.lcp) : '',
                    F: withCacheRun ? this.convertToOptimalUnit(withCacheRun.lcp) : '',
                    G: noCacheRun ? this.convertToOptimalUnit(noCacheRun.tbt) : '',
                    H: withCacheRun ? this.convertToOptimalUnit(withCacheRun.tbt) : '',
                    I: noCacheRun ? noCacheRun.cls : '',
                    J: withCacheRun ? withCacheRun.cls : '',
                    K: noCacheRun ? this.convertToOptimalUnit(noCacheRun.si) : '',
                    L: withCacheRun ? this.convertToOptimalUnit(withCacheRun.si) : ''
                });
            }

            // 평균 행 추가
            const avgSiteName = siteName + " 평균";
            worksheet.addRow({
                A: avgSiteName,
                B: '',  // 회차 빈칸
                C: this.convertToOptimalUnit(siteResult.noCache.average.fcp),
                D: this.convertToOptimalUnit(siteResult.withCache.average.fcp),
                E: this.convertToOptimalUnit(siteResult.noCache.average.lcp),
                F: this.convertToOptimalUnit(siteResult.withCache.average.lcp),
                G: this.convertToOptimalUnit(siteResult.noCache.average.tbt),
                H: this.convertToOptimalUnit(siteResult.withCache.average.tbt),
                I: siteResult.noCache.average.cls,
                J: siteResult.withCache.average.cls,
                K: this.convertToOptimalUnit(siteResult.noCache.average.si),
                L: this.convertToOptimalUnit(siteResult.withCache.average.si)
            });
        });
    }

    // 값이 1000 이상이면 초(s)로 변환, 미만이면 ms 그대로, 단위 포함
    convertToOptimalUnit(valueInMs) {
        if (valueInMs >= 1000) {
            return `${(valueInMs / 1000).toFixed(3)}s`; // 초로 변환, 소수점 3자리
        }
        return `${Math.round(valueInMs)}ms`; // ms 그대로, 정수
    }

    applyStyles(worksheet) {
        // 헤더 스타일
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE6F3FF' }
            };
            cell.font = {
                bold: true,
                size: 12
            };
            cell.alignment = {
                horizontal: 'center',
                vertical: 'middle'
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // 데이터 행 스타일
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
                row.eachCell((cell, colNumber) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };

                    // 숫자 컬럼은 우측 정렬 및 포맷 설정
                    if (colNumber > 2) { // C부터 L까지 (메트릭 데이터)
                        cell.alignment = { horizontal: 'right' };

                        // CLS 컬럼 (I, J = 9, 10번)은 항상 숫자이므로 소수점 3자리
                        if (colNumber === 9 || colNumber === 10) {
                            cell.numFmt = '0.000';
                        }
                        // 나머지 컬럼은 단위가 포함된 문자열이므로 포맷 적용 안 함
                    } else if (colNumber === 2) { // B = 회차
                        cell.alignment = { horizontal: 'center' };
                    } else {
                        cell.alignment = { horizontal: 'center' };
                    }

                    // 캐시 없음/있음 컬럼에 따른 배경색
                    // 홀수 컬럼(C, E, G, I, K = 3, 5, 7, 9, 11): 캐시 없음
                    // 짝수 컬럼(D, F, H, J, L = 4, 6, 8, 10, 12): 캐시 있음
                    if (colNumber >= 3) {
                        if (colNumber % 2 === 1) { // 홀수 = 캐시 없음
                            cell.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFFFEEE6' }
                            };
                        } else { // 짝수 = 캐시 있음
                            cell.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFE6FFE6' }
                            };
                        }
                    }
                });
            }
        });

        // 자동 높이 조정
        worksheet.eachRow((row) => {
            row.height = 25;
        });
    }

    getColumnKey(index) {
        return String.fromCharCode(65 + index); // A, B, C, ...
    }

    getColumnWidth(header) {
        const widths = {
            '사이트명': 20,
            '회차': 8,
            'FCP (캐시 없음)': 14,
            'FCP (캐시 있음)': 14,
            'LCP (캐시 없음)': 14,
            'LCP (캐시 있음)': 14,
            'TBT (캐시 없음)': 14,
            'TBT (캐시 있음)': 14,
            'CLS (캐시 없음)': 12,
            'CLS (캐시 있음)': 12,
            'SI (캐시 없음)': 14,
            'SI (캐시 있음)': 14
        };
        return widths[header] || 15;
    }

    generateFilename() {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
        return `${config.REPORT_FILENAME}_${dateStr}.xlsx`;
    }

    // 간단한 콘솔 리포트도 생성
    generateConsoleReport(allResults) {
        console.log('\n📊 ===== 성능 측정 결과 요약 =====');
        
        allResults.forEach((siteResult, index) => {
            console.log(`\n${index + 1}. ${siteResult.siteName}`);
            console.log(`   📍 URL: ${siteResult.url}`);
            
            console.log('   🚫 캐시 없음:');
            this.printMetrics(siteResult.noCache);
            
            console.log('   ✅ 캐시 있음:');
            this.printMetrics(siteResult.withCache);
        });
        
        console.log('\n✅ 전체 성능 측정 완료!');
    }

    printMetrics(metrics) {
        const fcp = this.formatMetricForConsole(metrics.average.fcp);
        const lcp = this.formatMetricForConsole(metrics.average.lcp);
        const tbt = this.formatMetricForConsole(metrics.average.tbt);
        const si = this.formatMetricForConsole(metrics.average.si);
        const cls = metrics.average.cls.toFixed(3);

        console.log(`      FCP: ${fcp}, LCP: ${lcp}, TBT: ${tbt}, CLS: ${cls}, SI: ${si}`);
    }

    formatMetricForConsole(valueInMs) {
        if (valueInMs >= 1000) {
            return `${(valueInMs / 1000).toFixed(3)}s`;
        }
        return `${Math.round(valueInMs)}ms`;
    }
}

module.exports = ReportGenerator;