
import PDFDocument from 'pdfkit';
import {
  getFarmReport,
  getFarmDailyReport,
} from './reports.service.js';

function number(value) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value) {
  return `KSh ${number(value).toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function quantity(value) {
  return number(value).toLocaleString('en-KE', {
    maximumFractionDigits: 2,
  });
}

function formatDate(value) {
  if (!value) return 'All dates';
  return String(value).slice(0, 10);
}

function addHeading(doc, heading, subtitle) {
  doc
    .font('Helvetica-Bold')
    .fontSize(19)
    .fillColor('#234B35')
    .text(heading);

  doc
    .moveDown(0.3)
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#555555')
    .text(subtitle);

  doc.moveDown(1);
}

function addMetric(doc, label, value, x, y, width = 245) {
  doc
    .roundedRect(x, y, width, 52, 6)
    .lineWidth(1)
    .strokeColor('#D6E2D8')
    .stroke();

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#555555')
    .text(label, x + 10, y + 9, { width: width - 20 });

  doc
    .font('Helvetica-Bold')
    .fontSize(13)
    .fillColor('#234B35')
    .text(String(value), x + 10, y + 25, {
      width: width - 20,
      ellipsis: true,
    });
}

function drawBarChart(doc, title, rows, category, valueField, valueLabel) {
  const left = 55;
  const top = 105;
  const chartWidth = 480;
  const chartHeight = 180;
  const bottom = top + chartHeight;

  const data = rows
    .filter((row) => row.category === category)
    .slice()
    .sort((a, b) =>
      String(a.report_date).localeCompare(String(b.report_date))
    )
    .slice(-10);

  doc
    .font('Helvetica-Bold')
    .fontSize(13)
    .fillColor('#222222')
    .text(title, left, 65);

  if (data.length === 0) {
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#666666')
      .text('No data available for this chart in the selected period.', left, top);

    return;
  }

  const values = data.map((row) => number(row[valueField]));
  const maxValue = Math.max(...values, 1);
  const slotWidth = chartWidth / data.length;
  const barWidth = Math.min(28, slotWidth * 0.6);

  // Draw the chart axes.
  doc
    .strokeColor('#999999')
    .lineWidth(0.8)
    .moveTo(left, top)
    .lineTo(left, bottom)
    .lineTo(left + chartWidth, bottom)
    .stroke();

  // Draw four horizontal guide lines.
  for (let i = 1; i <= 4; i += 1) {
    const y = bottom - (chartHeight * i) / 4;

    doc
      .strokeColor('#E4E4E4')
      .moveTo(left, y)
      .lineTo(left + chartWidth, y)
      .stroke();

    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor('#666666')
      .text(
        quantity((maxValue * i) / 4),
        left - 42,
        y - 4,
        { width: 35, align: 'right' }
      );
  }

  data.forEach((row, index) => {
    const value = number(row[valueField]);
    const height = (value / maxValue) * (chartHeight - 8);
    const x = left + index * slotWidth + (slotWidth - barWidth) / 2;
    const y = bottom - height;
    const dateLabel = String(row.report_date).slice(5, 10);

    doc
      .rect(x, y, barWidth, height)
      .fill('#4F8A62');

    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor('#333333')
      .text(dateLabel, left + index * slotWidth, bottom + 7, {
        width: slotWidth,
        align: 'center',
      });
  });

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#555555')
    .text(valueLabel, left, bottom + 25);
}

function addDailyTable(doc, rows) {
  const columns = [
    { title: 'Date', x: 45, width: 75 },
    { title: 'Category', x: 120, width: 145 },
    { title: 'Quantity', x: 265, width: 100 },
    { title: 'Amount (KSh)', x: 365, width: 180 },
  ];

  let y = 100;

  function drawTableHeader() {
    doc
      .rect(45, y, 500, 24)
      .fill('#234B35');

    columns.forEach((column) => {
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor('#FFFFFF')
        .text(column.title, column.x + 5, y + 8, {
          width: column.width - 10,
        });
    });

    y += 24;
  }

  drawTableHeader();

  rows.forEach((row, index) => {
    if (y > 720) {
      doc.addPage();
      y = 55;
      drawTableHeader();
    }

    if (index % 2 === 0) {
      doc
        .rect(45, y, 500, 22)
        .fill('#F3F6F3');
    }

    const values = [
      formatDate(row.report_date),
      String(row.category ?? '').replaceAll('_', ' '),
      quantity(row.quantity),
      money(row.amount),
    ];

    columns.forEach((column, columnIndex) => {
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#222222')
        .text(values[columnIndex], column.x + 5, y + 7, {
          width: column.width - 10,
          ellipsis: true,
        });
    });

    y += 22;
  });
}

export async function generateFarmReportPdf(filters = {}) {
  const summary = await getFarmReport(filters);
  const dailyRows = await getFarmDailyReport(filters);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 45,
      bufferPages: true,
      info: {
        Title: 'Poultry Farm Report',
        Author: 'Poultry Management System',
        Subject: 'Farm production, sales, feed and expenses',
      },
    });

    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    // Page 1: Summary.
    addHeading(
      doc,
      'POULTRY FARM REPORT',
      `Reporting period: ${formatDate(filters.start_date)} to ${formatDate(filters.end_date)}`
    );

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#444444')
      .text(`Generated: ${new Date().toISOString().slice(0, 10)}`);

    doc.moveDown(1);

    const metrics = [
      ['Eggs collected', quantity(summary.eggs_collected)],
      ['Broken eggs', quantity(summary.broken_eggs)],
      ['Intact eggs', quantity(summary.intact_eggs)],
      ['Eggs sold', quantity(summary.eggs_sold)],
      ['Egg sales revenue', money(summary.egg_sales_revenue)],
      ['Feed consumed (kg)', quantity(summary.feed_consumed_kg)],
      ['Feed consumption cost', money(summary.feed_consumption_cost)],
      ['Other farm expenses', money(summary.farm_expenses_total)],
      ['Estimated operating profit', money(summary.estimated_operating_profit)],
      [
        'Estimated profit margin',
        `${quantity(summary.estimated_profit_margin_percent)}%`,
      ],
    ];

    const startX = 45;
    const gap = 10;
    const cardWidth = 245;
    const rowGap = 12;
    const startY = 155;

    metrics.forEach(([label, value], index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);

      addMetric(
        doc,
        label,
        value,
        startX + column * (cardWidth + gap),
        startY + row * (52 + rowGap),
        cardWidth
      );
    });

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#666666')
      .text(
        'Financial figures are estimates based on recorded data. Check expense categories and feed costs for possible double-counting.',
        45,
        445,
        { width: 500 }
      );

    // Page 2: Daily report table.
    doc.addPage();
    addHeading(doc, 'DAILY ACTIVITY', 'Recorded activity within the selected reporting period');
    addDailyTable(doc, dailyRows);

    // Page 3: Egg production chart.
    doc.addPage();
    addHeading(doc, 'PRODUCTION CHART', 'Daily eggs collected');
    drawBarChart(
      doc,
      'Eggs collected by date',
      dailyRows,
      'egg_production',
      'quantity',
      'Quantity: eggs'
    );

    // Page 4: Egg sales revenue chart.
    doc.addPage();
    addHeading(doc, 'SALES CHART', 'Daily egg sales revenue');
    drawBarChart(
      doc,
      'Egg sales revenue by date',
      dailyRows,
      'egg_sales',
      'amount',
      'Amount: KSh'
    );

    // Add page numbers to every page.
    const range = doc.bufferedPageRange();

    for (let i = range.start; i < range.start + range.count; i += 1) {
      doc.switchToPage(i);
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#777777')
        .text(
          `Poultry Management System | Page ${i + 1} of ${range.count}`,
          45,
          805,
          { width: 500, align: 'center', lineBreak: false }
        );
    }

    doc.end();
  });
}
