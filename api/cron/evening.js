const formatters = require('../../src/formatters');
const { runKpi } = require('../../src/cron-handler');

module.exports = (req, res) => runKpi('KPI evening', formatters.formatKpiEvening, req, res);
