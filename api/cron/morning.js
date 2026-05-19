const formatters = require('../../src/formatters');
const { runKpi } = require('../../src/cron-handler');

module.exports = (req, res) => runKpi('KPI morning', formatters.formatKpiMorning, req, res);
