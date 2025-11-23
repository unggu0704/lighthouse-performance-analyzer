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
            '캐시 상태',
            '회차',
            'FCP',
            'LCP',
            'TBT',
            'CLS',
            'SI'
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

            // 캐시 없음 각 회차
            siteResult.noCache.runs.forEach((run, index) => {
                worksheet.addRow({
                    A: siteName,
                    B: '캐시 없음',
                    C: index + 1,       // 측정 회차
                    D: this.convertToOptimalUnit(run.fcp),
                    E: this.convertToOptimalUnit(run.lcp),
                    F: this.convertToOptimalUnit(run.tbt),
                    G: run.cls,
                    H: this.convertToOptimalUnit(run.si)
                });
            });

            // 캐시 있음 각 회차
            siteResult.withCache.runs.forEach((run, index) => {
                worksheet.addRow({
                    A: siteName,
                    B: '캐시 있음',
                    C: index + 1,       // 측정 회차
                    D: this.convertToOptimalUnit(run.fcp),
                    E: this.convertToOptimalUnit(run.lcp),
                    F: this.convertToOptimalUnit(run.tbt),
                    G: run.cls,
                    H: this.convertToOptimalUnit(run.si)
                });
            });
        });

        // 평균 데이터 추가
        allResults.forEach(siteResult => {
            const siteName = siteResult.siteName + " 평균";

            // 캐시 없음 평균
            worksheet.addRow({
                A: siteName,
                B: '캐시 없음',
                C: '',  // 회차 번호 빈칸
                D: this.convertToOptimalUnit(siteResult.noCache.average.fcp),
                E: this.convertToOptimalUnit(siteResult.noCache.average.lcp),
                F: this.convertToOptimalUnit(siteResult.noCache.average.tbt),
                G: siteResult.noCache.average.cls,
                H: this.convertToOptimalUnit(siteResult.noCache.average.si)
            });

            // 캐시 있음 평균
            worksheet.addRow({
                A: siteName,
                B: '캐시 있음',
                C: '',  // 회차 번호 빈칸
                D: this.convertToOptimalUnit(siteResult.withCache.average.fcp),
                E: this.convertToOptimalUnit(siteResult.withCache.average.lcp),
                F: this.convertToOptimalUnit(siteResult.withCache.average.tbt),
                G: siteResult.withCache.average.cls,
                H: this.convertToOptimalUnit(siteResult.withCache.average.si)
            });
        });
    }

    // 값이 1000 이상이면 초(s)로 변환, 미만이면 ms 그대로
    convertToOptimalUnit(valueInMs) {
        if (valueInMs >= 1000) {
            return valueInMs / 1000; // 초로 변환
        }
        return valueInMs; // ms 그대로
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
                    if (colNumber > 3) { // D, E, F, G, H (FCP, LCP, TBT, CLS, SI)
                        cell.alignment = { horizontal: 'right' };

                        // CLS는 항상 소수점 3자리
                        if (colNumber === 7) { // G = CLS
                            cell.numFmt = '0.000';
                        } else {
                            // 값이 1 미만이면 초 단위 (소수점 3자리), 아니면 ms (정수)
                            const value = cell.value;
                            if (typeof value === 'number' && value < 1 && value > 0) {
                                cell.numFmt = '0.000';
                            } else {
                                cell.numFmt = '0';
                            }
                        }
                    } else if (colNumber === 3) { // C = 회차
                        cell.alignment = { horizontal: 'center' };
                    } else {
                        cell.alignment = { horizontal: 'center' };
                    }

                    // 캐시 있음/없음에 따른 배경색
                    const cacheStatus = row.getCell(2).value;
                    if (cacheStatus === '캐시 없음') {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFFEEE6' }
                        };
                    } else if (cacheStatus === '캐시 있음') {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFE6FFE6' }
                        };
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
            '캐시 상태': 12,
            '회차': 8,
            'FCP': 12,
            'LCP': 12,
            'TBT': 12,
            'CLS': 10,
            'SI': 12
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