// --- File Export Utilities ---
function sanitizeFilename(name) {
    return (name || 'gpa_report').trim().replace(/[^a-z0-9_.-]/gi, '_').replace(/_+/g, '_');
}

function getFormattedDateTime() {
    const now = new Date();
    const options = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    };
    let formatted = new Intl.DateTimeFormat('en-GB', options).format(now);
    return formatted.replace(/\//g, '-');
}

function getSemestersPassed(years) {
    let passedCount = 0;
    (years || []).forEach(year => {
        (year.semesters || []).forEach(semester => {
            const hasPassingGrade = (semester.courses || []).some(course => parseFloat(course.grade) > 0);
            if (hasPassingGrade) {
                passedCount++;
            }
        });
    });
    return passedCount;
}

// --- Export Functions ---
function saveAsJSON() {
    const data = { userInfo: state.userInfo, years: state.years };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = sanitizeFilename(state.userInfo.studentName) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function exportAsText() {
    let text = `Academic Transcript\n\n`;
    text += `Student: ${state.userInfo.studentName || 'N/A'}\n`;
    text += `Degree: ${state.userInfo.degree || 'N/A'}\n`;
    text += `University: ${state.userInfo.university || 'N/A'}\n\n`;
    text += `Cumulative GPA (CGPA): ${state.calculations.cgpa}\n`;
    text += `Total Credits Completed: ${state.calculations.totalCredits}\n`;
    text += `Total Courses Completed: ${state.calculations.totalCourses}\n`;
    text += `Overall Grade Distribution: ${state.calculations.gradeDistribution}\n\n`;
    text += `${'='.repeat(80)}\n\n`;

    state.years.forEach(year => {
        text += `${year.name} (YGPA: ${year.gpa}, Credits: ${year.totalCredits})\n`;
        text += `${'-'.repeat(80)}\n`;
        year.semesters.forEach(semester => {
            text += `  ${semester.name} (GPA: ${semester.gpa}, Credits: ${semester.totalCredits})\n\n`;
            text += `    Code            Title                               Credits  Grade\n`;
            text += `    --------------- ----------------------------------- -------- -----\n`;
            semester.courses.forEach(course => {
                const grade = Object.keys(GRADE_POINTS).find(g => GRADE_POINTS[g] == course.grade) || '';
                text += `    ${(course.code || '').padEnd(15)} ${(course.title || '').padEnd(35)} ${(course.credits || '').toString().padEnd(8)} ${grade}\n`;
            });
            text += `\n`;
        });
        text += `\n`;
    });
    
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = sanitizeFilename(state.userInfo.studentName) + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function exportAsPDF() {
    const exportButton = document.querySelector('a[data-action="export-pdf"]');
    if (!exportButton) return;
    const originalText = exportButton.innerHTML;
    exportButton.innerHTML = 'Generating...';

    setTimeout(() => {
        try {
            let chartImage = null;
            const canvas = document.querySelector('#gpaTrendChart');
            if (canvas && state.calculations.semesterGpaData.length > 0) {
                try {
                    chartImage = canvas.toDataURL('image/png', 1.0);
                } catch (e) {
                    console.error("Could not generate chart image from canvas:", e);
                }
            }

            let gradeFrequencyBody = [];
            const gradeDistString = state.calculations.gradeDistribution;
            if (gradeDistString && gradeDistString !== "N/A") {
                const gradeDistArray = gradeDistString.split(' ').map(g => g.split(':'));
                const totalGrades = gradeDistArray.reduce((sum, [, count]) => sum + parseInt(count, 10), 0);
                
                gradeFrequencyBody = gradeDistArray.map(([grade, count]) => {
                    const percentage = totalGrades > 0 ? ((parseInt(count, 10) / totalGrades) * 100).toFixed(2) + '%' : '0.00%';
                    return [{text: grade, style: 'tableCell', bold: true}, {text: count, style: 'tableCell', alignment: 'center'}, {text: percentage, style: 'tableCell', alignment: 'center'}];
                });
            }

            const docDefinition = {
                pageSize: 'A4',
                pageMargins: [ 40, 60, 40, 80 ],
                background: function() {
                    return {
                        stack: [
                            { text: 'UNOFFICIAL DOCUMENT', color: '#E8E8E8', fontSize: 55, bold: true, alignment: 'center', angle: 45, opacity: 0.5 },
                            { text: 'CG koto?', color: '#E8E8E8', fontSize: 60, bold: true, alignment: 'center', angle: 45, opacity: 0.5, margin: [0, 80, 0, 0] }
                        ],
                        margin: [0, 150, 0, 0]
                    };
                },
                header: function(currentPage) {
                    if (currentPage > 1) {
                        return {
                            margin: [40, 30, 40, 0],
                            columns: [
                                { text: state.userInfo.studentName || 'Student Report', style: 'continuousHeader', alignment: 'left' },
                                { text: 'Academic Transcript', style: 'continuousHeader', alignment: 'right' }
                            ]
                        };
                    }
                    return null;
                },
                footer: function(currentPage, pageCount) {
                    return {
                        columns: [
                            {
                                stack: [
                                    { text: 'Unofficial Document Generated by:', style: 'disclaimer' },
                                    {
                                        text: [
                                            { text: 'CG koto?', link: 'https://saifullahmnsur-again.github.io/cg-koto/', style: 'link', bold: true },
                                            { text: ` at ${getFormattedDateTime()}`, style: 'disclaimer' }
                                        ]
                                    }
                                ],
                                width: 'auto'
                            },
                            { 
                                text: `Page ${currentPage.toString()} of ${pageCount}`, 
                                alignment: 'right', 
                                width: '*',
                                style: 'disclaimer'
                            }
                        ],
                        style: 'footer'
                    };
                },
                content: [
                    { text: `${state.userInfo.university || 'University of Excellence'}`, style: 'universityName', alignment: 'center' },
                    { text: 'Academic Transcript', style: 'documentTitle' },
                    {
                        style: 'userInfoContainer',
                        table: {
                            widths: ['*', '*'],
                            body: [[
                                { stack: [ { text: 'Student Name:', style: 'label' }, { text: state.userInfo.studentName || 'N/A', style: 'value' } ], border: [false, false, false, false] },
                                { stack: [ { text: 'Degree Program:', style: 'label' }, { text: state.userInfo.degree || 'N/A', style: 'value' } ], alignment: 'right', border: [false, false, false, false] }
                            ]]
                        },
                        layout: 'noBorders'
                    },
                    { text: 'Overall Academic Summary', style: 'summaryHeader', alignment: 'center' },
                    {
                        style: 'summaryTable',
                        table: {
                            widths: ['*', '*', '*', '*'],
                            body: [
                                [
                                    {text: 'CGPA', style: 'summaryLabel'},
                                    {text: 'Total Credits', style: 'summaryLabel'},
                                    {text: 'Total Courses', style: 'summaryLabel'},
                                    {text: 'Semesters Passed', style: 'summaryLabel'}
                                ],
                                [
                                    {text: state.calculations.cgpa, style: 'summaryValue'},
                                    {text: state.calculations.totalCredits, style: 'summaryValue'},
                                    {text: state.calculations.totalCourses, style: 'summaryValue'},
                                    {text: getSemestersPassed(state.years), style: 'summaryValue'}
                                ]
                            ]
                        },
                        layout: 'lightHorizontalLines'
                    }
                ],
                styles: {
                    universityName: { fontSize: 16, bold: true, color: '#333333', alignment: 'center', margin: [0, 0, 0, 2] },
                    documentTitle: { fontSize: 24, bold: true, alignment: 'center', margin: [0, 10, 0, 20], color: '#2c5282' },
                    continuousHeader: { fontSize: 10, italics: true, color: '#555555' },
                    userInfoContainer: { margin: [0, 0, 0, 10] },
                    label: { fontSize: 9, color: '#555555' },
                    value: { fontSize: 12, bold: true, color: '#333333' },
                    summaryTable: { margin: [0, 0, 0, 25], alignment: 'center' },
                    summaryHeader: { bold: true, fontSize: 11, color: '#333333', margin: [0, 0, 0, 5] },
                    summaryLabel: { bold: false, fontSize: 9, color: '#555555', alignment: 'center', margin: [0, 2, 0, 2] },
                    summaryValue: { bold: true, fontSize: 12, alignment: 'center', margin: [0, 2, 0, 2] },
                    yearHeader: { fontSize: 14, bold: true, margin: [0, 15, 0, 5], color: '#2c5282' },
                    semesterHeader: { fontSize: 11, bold: true, margin: [0, 10, 0, 5], color: '#333333' },
                    courseTable: { margin: [0, 5, 0, 15] },
                    tableHeader: { bold: true, fontSize: 9, color: 'white', fillColor: '#4a5568', margin: [0, 4, 0, 4] },
                    tableCell: { fontSize: 9, margin: [0, 4, 0, 4] },
                    footer: { margin: [40, 20, 40, 0] },
                    disclaimer: { fontSize: 8, italics: true, color: '#888888' },
                    link: { fontSize: 9, color: 'blue', decoration: 'underline' },
                    sectionHeader: { fontSize: 16, bold: true, margin: [0, 20, 0, 10], color: '#2c5282' }
                },
                defaultStyle: {
                    font: 'Roboto',
                    color: '#333333'
                }
            };

            const yearBlocks = state.years.map(year => {
                const semesterBlocks = (year.semesters || []).map(semester => {
                    const courseBody = semester.courses.map(course => {
                        const grade = Object.keys(GRADE_POINTS).find(g => GRADE_POINTS[g] == course.grade) || '';
                        return [
                            { text: course.code, style: 'tableCell' },
                            { text: course.title, style: 'tableCell' },
                            { text: course.credits, style: 'tableCell', alignment: 'center' },
                            { text: grade, style: 'tableCell', alignment: 'center' }
                        ];
                    });

                    const semesterContent = {
                        stack: [
                            { text: `${semester.name} (GPA: ${semester.gpa} | Credits: ${semester.totalCredits})`, style: 'semesterHeader' }
                        ]
                    };

                    if (courseBody.length > 0) {
                        semesterContent.stack.push({
                            style: 'courseTable',
                            table: {
                                headerRows: 1,
                                keepWithHeaderRows: 1,
                                widths: ['auto', '*', 'auto', 'auto'],
                                body: [
                                    ['Code', 'Course Title', 'Credits', 'Grade'].map(h => ({text: h, style: 'tableHeader'})),
                                    ...courseBody
                                ]
                            },
                            layout: 'lightHorizontalLines'
                        });
                    }
                    return semesterContent;
                });

                return {
                    stack: [
                        { text: `${year.name} (YGPA: ${year.gpa})`, style: 'yearHeader' },
                        ...semesterBlocks
                    ]
                };
            });
            docDefinition.content.push(...yearBlocks);

            if (chartImage) {
                docDefinition.content.push({
                    pageBreak: 'before',
                    stack: [
                        { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 0.5, lineColor: '#cccccc' }], margin: [0, 10, 0, 10] },
                        { text: 'GPA Trend Analysis', style: 'sectionHeader' },
                        { image: chartImage, width: 515 }
                    ]
                });
            }
            
            const yearSummaryBody = state.years.map(year => [
                { text: year.name, style: 'tableCell' },
                { text: year.gpa, style: 'tableCell', alignment: 'center' },
                { text: year.totalCredits, style: 'tableCell', alignment: 'center' }
            ]);

            const semesterSummaryBody = state.years.flatMap(year => 
                year.semesters.map(semester => [
                    { text: `${year.name} - ${semester.name}`, style: 'tableCell' },
                    { text: semester.gpa, style: 'tableCell', alignment: 'center' },
                    { text: semester.totalCredits, style: 'tableCell', alignment: 'center' },
                    { text: semester.gradeDistribution, style: 'tableCell' }
                ])
            );

            if (yearSummaryBody.length > 0) {
                docDefinition.content.push({
                    pageBreak: 'before',
                    stack: [
                        { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 0.5, lineColor: '#cccccc' }], margin: [0, 10, 0, 10] },
                        { text: 'Statistical Summary', style: 'sectionHeader' },
                        { text: 'Year-wise Summary', style: 'semesterHeader' },
                        {
                            style: 'courseTable',
                            table: {
                                headerRows: 1,
                                widths: ['*', 'auto', 'auto'],
                                body: [
                                    ['Academic Year', 'YGPA', 'Total Credits'].map(h => ({text: h, style: 'tableHeader'})),
                                    ...yearSummaryBody
                                ]
                            },
                            layout: 'lightHorizontalLines'
                        },
                        { text: 'Semester-wise Summary', style: 'semesterHeader', margin: [0, 20, 0, 5] },
                        {
                            style: 'courseTable',
                            table: {
                                headerRows: 1,
                                widths: ['auto', 'auto', 'auto', '*'],
                                body: [
                                    ['Semester', 'GPA', 'Credits', 'Grade Distribution'].map(h => ({text: h, style: 'tableHeader'})),
                                    ...semesterSummaryBody
                                ]
                            },
                            layout: 'lightHorizontalLines'
                        },
                        { text: 'Grade Frequency Analysis', style: 'semesterHeader', margin: [0, 20, 0, 5] },
                        {
                            style: 'courseTable',
                            table: {
                                headerRows: 1,
                                widths: ['*', '*', '*'],
                                body: [
                                    ['Grade', 'Count', 'Frequency (%)'].map(h => ({text: h, style: 'tableHeader'})),
                                    ...gradeFrequencyBody
                                ]
                            },
                            layout: 'lightHorizontalLines'
                        }
                    ]
                });
            }

            docDefinition.content.push({ text: '*** End of Transcript ***', alignment: 'center', margin: [0, 40, 0, 0], italics: true, color: '#555555' });

            pdfMake.createPdf(docDefinition).download(sanitizeFilename(state.userInfo.studentName) + '.pdf');

        } catch (error) {
            console.error("Error during PDF generation:", error);
            alert("An unexpected error occurred while creating the PDF.");
        } finally {
            exportButton.innerHTML = 'Export as PDF';
        }
    }, 100);
}