var CONFIG = {
    API_ENDPOINT: "https://app.zusior.com/api/keitaro/update_costs", // Укажи путь к эндпоинту
    DATE_RANGE: "TODAY" // Период, за который нужно получить данные: TODAY, YESTERDAY, LAST_7_DAYS и т.д.
};

function main() {
    var accountName = AdsApp.currentAccount().getName();
    var timeZone = AdsApp.currentAccount().getTimeZone();
    var currency = AdsApp.currentAccount().getCurrencyCode();
    var campaigns = getEnabledCampaigns();
    var reportData = generateReportData(campaigns, accountName, timeZone, currency);
    sendDataToServer(reportData);
}

function getEnabledCampaigns() {
    var dateRangeString = "DURING " + CONFIG.DATE_RANGE;
    var report = AdsApp.report(
        "SELECT CampaignName, CampaignId, Clicks, Cost " +
        "FROM CAMPAIGN_PERFORMANCE_REPORT " +
        "WHERE CampaignStatus = ENABLED " +
        dateRangeString
    );
    return report.rows();
}

function generateReportData(rows, accountName, timeZone, currency) {
    var reportData = [];
    while (rows.hasNext()) {
        var row = rows.next();
        var clicks = parseInt(row['Clicks'], 10);
        var cost = parseFloat(row['Cost'].replace(',', ''));
        var averageCpc = clicks > 0 ? cost / clicks : 0;

        reportData.push({
            accountName: accountName,
            campaignName: row['CampaignName'],
            campaignId: row['CampaignId'],
            clicks: clicks,
            cost: cost,
            averageCpc: averageCpc,
            currency: currency,
            timeZone: timeZone
        });
    }
    return reportData;
}

function sendDataToServer(data) {
    var options = {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(data)
    };

    try {
        var response = UrlFetchApp.fetch(CONFIG.API_ENDPOINT, options);
        Logger.log("Server response: " + response.getContentText());
    } catch (e) {
        Logger.log("Error sending data to server: " + e.toString());
    }
}
