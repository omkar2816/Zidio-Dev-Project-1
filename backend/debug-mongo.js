db.charthistories.find({}).limit(2).forEach(function(chart) {
  print("Chart: " + chart.chartTitle);
  print("chartData type: " + typeof chart.chartData);
  print("chartData isArray: " + Array.isArray(chart.chartData));
  
  if (chart.chartData) {
    print("chartData keys: " + Object.keys(chart.chartData).slice(0, 5));
    if (Array.isArray(chart.chartData)) {
      print("chartData length: " + chart.chartData.length);
    } else {
      print("chartData key count: " + Object.keys(chart.chartData).length);
    }
  }
  
  print("configuration.values length: " + (chart.configuration?.values?.length || 0));
  print("dataInfo.totalRows: " + (chart.dataInfo?.totalRows || 0));
  print("---");
});
