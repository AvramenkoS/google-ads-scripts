var CONFIG = {
    EMAIL_RECIPIENT: [
        "atlas@mbteam.net",
        "lubov.fedoseeva@boomerang-partners.com",
        "kris.analyst@boomerang-partners.com",
        "analytics@boomerang-partners.com",
        "kozlova_julia@boomerang-partners.com"
    ],
    DATE_RANGE: "LAST_7_DAYS", // Options: TODAY, YESTERDAY, LAST_7_DAYS, LAST_30_DAYS, THIS_MONTH, LAST_MONTH, CUSTOM
    CUSTOM_START_DATE: "2024-08-01", // Use this format: YYYY-MM-DD
    CUSTOM_END_DATE: "2024-10-31", // Use this format: YYYY-MM-DD
    CURRENCY_SYMBOL: "€",
    INCLUDE_LABELS: true,
    PERFORMANCE_EMOJIS: ['🔥', '👍', '😐', '👎', '🆘'],
    COLOR_PALETTE: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FED766', '#2AB7CA']
};

function main() {
    var campaigns = getCampaignsWithCost();
    var reportData = generateReportData(campaigns);
    var emailBody = createFunEmailBody(reportData);
    sendEmail(emailBody);
}

function getDateRangeString() {
    switch (CONFIG.DATE_RANGE) {
        case "TODAY":
        case "YESTERDAY":
        case "LAST_7_DAYS":
        case "LAST_30_DAYS":
        case "THIS_MONTH":
        case "LAST_MONTH":
            return "DURING " + CONFIG.DATE_RANGE;
        case "CUSTOM":
            return "DURING " + CONFIG.CUSTOM_START_DATE + "," + CONFIG.CUSTOM_END_DATE;
        default:
            throw new Error("Invalid DATE_RANGE specified in CONFIG");
    }
}

function getCampaignsWithCost() {
    var dateRangeString = getDateRangeString();
    var report = AdsApp.report(
        "SELECT CampaignName, Impressions, Clicks, Cost, Conversions, ConversionValue " +
        "FROM CAMPAIGN_PERFORMANCE_REPORT " +
        "WHERE Cost > 0 " +
        dateRangeString
    );

    return report.rows();
}

function generateReportData(rows) {
    var reportData = [];
    var totalImpressions = 0;
    var totalClicks = 0;
    var totalCost = 0;
    var totalConversions = 0;
    var totalConversionValue = 0;

    while (rows.hasNext()) {
        var row = rows.next();

        var impressions = parseInt(row['Impressions'], 10);
        var clicks = parseInt(row['Clicks'], 10);
        var cost = parseFloat(row['Cost'].replace(',', ''));
        var conversions = parseFloat(row['Conversions']);
        var conversionValue = parseFloat(row['ConversionValue'].replace(',', ''));

        var ctr = clicks > 0 ? clicks / impressions : 0;
        var averageCpc = clicks > 0 ? cost / clicks : 0;
        var conversionRate = clicks > 0 ? conversions / clicks : 0;
        var averageCpa = conversions > 0 ? cost / conversions : 0;
        var roas = cost > 0 ? conversionValue / cost : 0;

        reportData.push({
            name: row['CampaignName'],
            impressions: impressions,
            clicks: clicks,
            ctr: ctr,
            averageCpc: averageCpc,
            cost: cost,
            conversions: conversions,
            conversionRate: conversionRate,
            conversionValue: conversionValue,
            averageCpa: averageCpa,
            roas: roas,
            labels: []
        });

        totalImpressions += impressions;
        totalClicks += clicks;
        totalCost += cost;
        totalConversions += conversions;
        totalConversionValue += conversionValue;
    }

    var avgCtr = totalClicks > 0 ? totalClicks / totalImpressions : 0;
    var avgCpc = totalClicks > 0 ? totalCost / totalClicks : 0;
    var avgConversionRate = totalClicks > 0 ? totalConversions / totalClicks : 0;
    var avgCpa = totalConversions > 0 ? totalCost / totalConversions : 0;
    var avgRoas = totalCost > 0 ? totalConversionValue / totalCost : 0;

    reportData.push({
        name: "Total",
        impressions: totalImpressions,
        clicks: totalClicks,
        ctr: avgCtr,
        averageCpc: avgCpc,
        cost: totalCost,
        conversions: totalConversions,
        conversionRate: avgConversionRate,
        conversionValue: totalConversionValue / reportData.length,
        averageCpa: avgCpa,
        roas: avgRoas,
        labels: []
    });

    return reportData;
}

function createFunEmailBody(reportData) {
    var dateRangeDisplay = CONFIG.DATE_RANGE === "CUSTOM"
        ? "Custom Date Range: " + CONFIG.CUSTOM_START_DATE + " to " + CONFIG.CUSTOM_END_DATE
        : CONFIG.DATE_RANGE.replace(/_/g, ' ');

    var html = '<h1 style="color: #4A4A4A; text-align: center;">🎉 Boomerang PT Google Ads Report 🎉</h1>';
    html += '<h2 style="color: #6D6D6D; text-align: center;">' + dateRangeDisplay + '</h2>';


    var quotes = [
        "Let's dive into the numbers and see what treasures we can find!",
        "Brace yourself for some metric magic!",
        "Time to uncover the secrets of your campaigns!",
        "Get ready for a rollercoaster ride through your ad performance!"
    ];
    html += '<p style="font-style: italic; text-align: center;">"' + quotes[Math.floor(Math.random() * quotes.length)] + '"</p>';
    html += '<table border="1" cellpadding="10" style="border-collapse: collapse; margin: auto;">';
    html += '<tr style="background-color: #f2f2f2; font-weight: bold;">' +
        '<th>Campaign</th>' +
        '<th>Impressions</th>' +
        '<th>Clicks</th>' +
        '<th>CTR</th>' +
        '<th>Avg. CPC</th>' +
        '<th>Cost</th>' +
        '<th>Conversions</th>' +
        '<th>Conv. Rate</th>' +
        '<th>Conv. Value</th>' +
        '<th>Avg. CPA</th>' +
        '<th>ROAS</th>' +
        '<th>Performance</th>' +
        '</tr>';

    reportData.forEach(function (campaign, index) {
        var isTotalRow = campaign.name === "Total";
        var rowColor = index === reportData.length - 1 ? '#FFD700' : CONFIG.COLOR_PALETTE[index % CONFIG.COLOR_PALETTE.length]; // Выделяем итоговый рядок другим цветом
        var performanceEmoji = getPerformanceEmoji(campaign.roas);

        html += '<tr style="background-color: ' + rowColor + '20; ' + (isTotalRow ? 'font-weight: bold;' : '') + '">';
        html += '<td>' + campaign.name + '</td>' +
            '<td style="text-align: right;">' + campaign.impressions.toLocaleString() + '</td>' +
            '<td style="text-align: right;">' + campaign.clicks.toLocaleString() + '</td>' +
            '<td style="text-align: right;">' + (campaign.ctr * 100).toFixed(2) + '%</td>' +
            '<td style="text-align: right;">' + CONFIG.CURRENCY_SYMBOL + campaign.averageCpc.toFixed(2) + '</td>' +
            '<td style="text-align: right;">' + CONFIG.CURRENCY_SYMBOL + campaign.cost.toFixed(2) + '</td>' +
            '<td style="text-align: right;">' + campaign.conversions.toFixed(2) + '</td>' +
            '<td style="text-align: right;">' + (campaign.conversionRate * 100).toFixed(2) + '%</td>' +
            '<td style="text-align: right;">' + CONFIG.CURRENCY_SYMBOL + campaign.conversionValue.toFixed(2) + '</td>' +
            '<td style="text-align: right;">' + CONFIG.CURRENCY_SYMBOL + campaign.averageCpa.toFixed(2) + '</td>' +
            '<td style="text-align: right;">' + campaign.roas.toFixed(2) + '</td>' +
            '<td style="text-align: center; font-size: 24px;">' + performanceEmoji + '</td>' +
            '</tr>';
    });

    html += '</table>';

    html += '<h3 style="color: #4A4A4A; text-align: center;">Campaign Performance Summary</h3>';
    html += '<p style="text-align: center;">🏆 Top Performer (ROAS): ' + getTopPerformer(reportData).name + '</p>';
    html += '<p style="text-align: center;">💪 Most Clicks: ' + getMostClicks(reportData).name + '</p>';
    html += '<p style="text-align: center;">💰 Highest Spend: ' + getHighestSpend(reportData).name + '</p>';
    html += '<p style="text-align: center;">💎 Most Valuable: ' + getMostValuable(reportData).name + '</p>';

    html += createEmojiLegend();

    return html;
}

function createEmojiLegend() {
    var html = '<div style="margin-top: 20px; border-top: 1px solid #ccc; padding-top: 10px;">';
    html += '<h4 style="color: #4A4A4A; text-align: center;">Emoji Legend</h4>';
    html += '<table style="margin: auto; border-collapse: collapse;">';
    html += '<tr><th style="text-align: left; padding: 5px;">Emoji</th><th style="text-align: left; padding: 5px;">Meaning</th></tr>';
    html += '<tr><td style="padding: 5px;">' + CONFIG.PERFORMANCE_EMOJIS[0] + '</td><td>Excellent (ROAS > 4)</td></tr>';
    html += '<tr><td style="padding: 5px;">' + CONFIG.PERFORMANCE_EMOJIS[1] + '</td><td>Good (ROAS 3-4)</td></tr>';
    html += '<tr><td style="padding: 5px;">' + CONFIG.PERFORMANCE_EMOJIS[2] + '</td><td>Average (ROAS 2-3)</td></tr>';
    html += '<tr><td style="padding: 5px;">' + CONFIG.PERFORMANCE_EMOJIS[3] + '</td><td>Below Average (ROAS 1-2)</td></tr>';
    html += '<tr><td style="padding: 5px;">' + CONFIG.PERFORMANCE_EMOJIS[4] + '</td><td>Poor (ROAS < 1)</td></tr>';
    html += '</table>';
    html += '<p style="text-align: center; font-style: italic; color: #666;">🏆 Top Performer | 💪 Most Clicks | 💰 Highest Spend | 💎 Most Valuable</p>';
    html += '</div>';
    return html;
}

function getPerformanceEmoji(roas) {
    if (roas > 4) return CONFIG.PERFORMANCE_EMOJIS[0];
    if (roas > 3) return CONFIG.PERFORMANCE_EMOJIS[1];
    if (roas > 2) return CONFIG.PERFORMANCE_EMOJIS[2];
    if (roas > 1) return CONFIG.PERFORMANCE_EMOJIS[3];
    return CONFIG.PERFORMANCE_EMOJIS[4];
}

function getTopPerformer(reportData) {
    return reportData.reduce((max, campaign) => max.roas > campaign.roas ? max : campaign);
}

function getMostClicks(reportData) {
    return reportData.reduce((max, campaign) => max.clicks > campaign.clicks ? max : campaign);
}

function getHighestSpend(reportData) {
    return reportData.reduce((max, campaign) => max.cost > campaign.cost ? max : campaign);
}

function getMostValuable(reportData) {
    return reportData.reduce((max, campaign) => max.conversionValue > campaign.conversionValue ? max : campaign);
}

function sendEmail(emailBody) {
    var accountName = AdsApp.currentAccount().getName();
    var subject = '🚀 IGEX Google Ads Report for ' + accountName + ' 🚀';
    var emailRecipients = CONFIG.EMAIL_RECIPIENT;

    for (var i = 0; i < emailRecipients.length; i++) {
        MailApp.sendEmail({
            to: emailRecipients[i],
            subject: subject,
            htmlBody: emailBody
        });
    }
}