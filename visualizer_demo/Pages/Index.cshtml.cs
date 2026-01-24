using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using visualizer_demo.DAL;
using visualizer_demo.Models;

namespace visualizer_demo.Pages;

public class IndexModel : PageModel
{
    private readonly DataAccess _dataAccess;

    public IndexModel(DataAccess dataAccess)
    {
        _dataAccess = dataAccess;
    }

    public ChartData BarData { get; set; }
    public ChartData PieData { get; set; }
    public ChartData LineData { get; set; }
    public ChartData DoughnutData { get; set; }

    public (List<string> Headers, List<List<string>> Rows) SalesTableData { get; set; }

    // New properties for additional charts
    public ChartData ProjectStatuses { get; set; }
    public ChartData BudgetAllocation { get; set; }
    public ChartData SpendingTrend { get; set; }
    public ChartData RadarData { get; set; }
    public ChartData PolarData { get; set; }
    public List<(decimal X, decimal Y)> ScatterData { get; set; }

    public void OnGet()
    {
        BarData = _dataAccess.GetSalesByCategory();
        PieData = _dataAccess.GetSalesByCategory();
        LineData = _dataAccess.GetMonthlySales();
        DoughnutData = _dataAccess.GetSalesByCategory();
        SalesTableData = _dataAccess.GetSalesTableData();

        // New data
        ProjectStatuses = _dataAccess.GetProjectStatuses();
        BudgetAllocation = _dataAccess.GetBudgetAllocation();
        SpendingTrend = _dataAccess.GetSpendingTrend();
        RadarData = _dataAccess.GetRadarData();
        PolarData = _dataAccess.GetPolarData();
        ScatterData = _dataAccess.GetScatterData();
    }
}
