using Microsoft.Data.Sqlite;
using visualizer_demo.Models;

namespace visualizer_demo.DAL;

public class DataAccess
{
    private readonly string _connectionString = "Data Source=sales.db";

    public DataAccess()
    {
        InitializeDatabase();
    }

    private void InitializeDatabase()
    {
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();
        var command = connection.CreateCommand();
        command.CommandText = @"
            CREATE TABLE IF NOT EXISTS Sales (
                Id INTEGER PRIMARY KEY,
                Category TEXT,
                Amount REAL,
                Date TEXT
            );
        ";
        command.ExecuteNonQuery();

        // Insert sample data if empty
        command.CommandText = "SELECT COUNT(*) FROM Sales";
        var count = (long)command.ExecuteScalar();
        if (count == 0)
        {
            command.CommandText = @"
                INSERT INTO Sales (Category, Amount, Date) VALUES ('Electronics', 1000, '2023-01-15');
                INSERT INTO Sales (Category, Amount, Date) VALUES ('Clothing', 500, '2023-01-20');
                INSERT INTO Sales (Category, Amount, Date) VALUES ('Electronics', 1200, '2023-02-10');
                INSERT INTO Sales (Category, Amount, Date) VALUES ('Books', 300, '2023-02-05');
                INSERT INTO Sales (Category, Amount, Date) VALUES ('Clothing', 700, '2023-02-25');
                INSERT INTO Sales (Category, Amount, Date) VALUES ('Electronics', 1500, '2023-03-12');
                INSERT INTO Sales (Category, Amount, Date) VALUES ('Books', 400, '2023-03-18');
                INSERT INTO Sales (Category, Amount, Date) VALUES ('Clothing', 800, '2023-03-22');
                INSERT INTO Sales (Category, Amount, Date) VALUES ('Home', 600, '2023-03-30');
                INSERT INTO Sales (Category, Amount, Date) VALUES ('Electronics', 1300, '2023-04-08');
                INSERT INTO Sales (Category, Amount, Date) VALUES ('Clothing', 900, '2023-04-14');
                INSERT INTO Sales (Category, Amount, Date) VALUES ('Books', 350, '2023-04-20');
                INSERT INTO Sales (Category, Amount, Date) VALUES ('Home', 750, '2023-04-25');
                INSERT INTO Sales (Category, Amount, Date) VALUES ('Electronics', 1600, '2023-05-05');
                INSERT INTO Sales (Category, Amount, Date) VALUES ('Clothing', 1000, '2023-05-15');
                INSERT INTO Sales (Category, Amount, Date) VALUES ('Books', 500, '2023-05-20');
                INSERT INTO Sales (Category, Amount, Date) VALUES ('Home', 800, '2023-05-28');
            ";
            command.ExecuteNonQuery();
        }
    }

    public List<SalesData> GetSalesData()
    {
        var sales = new List<SalesData>();
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();
        var command = connection.CreateCommand();
        command.CommandText = "SELECT Category, Amount, Date FROM Sales";
        using var reader = command.ExecuteReader();
        while (reader.Read())
        {
            sales.Add(new SalesData
            {
                Category = reader.GetString(0),
                Amount = reader.GetDecimal(1),
                Date = DateTime.Parse(reader.GetString(2))
            });
        }
        return sales;
    }

    public ChartData GetSalesByCategory()
    {
        var data = new ChartData();
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();
        var command = connection.CreateCommand();
        command.CommandText = "SELECT Category, SUM(Amount) FROM Sales GROUP BY Category ORDER BY SUM(Amount) DESC";
        using var reader = command.ExecuteReader();
        while (reader.Read())
        {
            data.Labels.Add(reader.GetString(0));
            data.Values.Add(reader.GetDecimal(1));
        }
        return data;
    }

    public ChartData GetMonthlySales()
    {
        var data = new ChartData();
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();
        var command = connection.CreateCommand();
        command.CommandText = @"
            SELECT strftime('%Y-%m', Date) as Month, SUM(Amount)
            FROM Sales
            GROUP BY strftime('%Y-%m', Date)
            ORDER BY Month
        ";
        using var reader = command.ExecuteReader();
        while (reader.Read())
        {
            data.Labels.Add(reader.GetString(0));
            data.Values.Add(reader.GetDecimal(1));
        }
        return data;
    }

    public (List<string> Headers, List<List<string>> Rows) GetSalesTableData()
    {
        var headers = new List<string> { "ID", "Category", "Amount", "Date" };
        var rows = new List<List<string>>();
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();
        var command = connection.CreateCommand();
        command.CommandText = "SELECT Id, Category, Amount, Date FROM Sales ORDER BY Date DESC";
        using var reader = command.ExecuteReader();
        while (reader.Read())
        {
            rows.Add(new List<string>
            {
                reader.GetInt32(0).ToString(),
                reader.GetString(1),
                reader.GetDecimal(2).ToString("C2"),
                DateTime.Parse(reader.GetString(3)).ToString("yyyy-MM-dd")
            });
        }
        return (headers, rows);
    }

    // New methods for additional visualizations
    public ChartData GetProjectStatuses()
    {
        var data = new ChartData
        {
            Labels = new List<string> { "Pre-proposal", "Proposal", "Approved", "In Progress", "Completed", "Rejected" },
            Values = new List<decimal> { 5, 10, 8, 15, 12, 3 }
        };
        return data;
    }

    public ChartData GetBudgetAllocation()
    {
        var data = new ChartData
        {
            Labels = new List<string> { "Personnel", "Equipment", "Travel", "Supplies", "Overhead" },
            Values = new List<decimal> { 50000, 20000, 10000, 5000, 15000 }
        };
        return data;
    }

    public ChartData GetSpendingTrend()
    {
        var data = new ChartData
        {
            Labels = new List<string> { "Jan", "Feb", "Mar", "Apr", "May", "Jun" },
            Values = new List<decimal> { 8000, 12000, 10000, 15000, 11000, 13000 }
        };
        return data;
    }

    public ChartData GetRadarData()
    {
        var data = new ChartData
        {
            Labels = new List<string> { "Innovation", "Feasibility", "Impact", "Budget", "Timeline" },
            Values = new List<decimal> { 8, 7, 9, 6, 8 }
        };
        return data;
    }

    public ChartData GetPolarData()
    {
        var data = new ChartData
        {
            Labels = new List<string> { "Q1", "Q2", "Q3", "Q4" },
            Values = new List<decimal> { 20, 30, 25, 35 }
        };
        return data;
    }

    public List<(decimal X, decimal Y)> GetScatterData()
    {
        return new List<(decimal X, decimal Y)>
        {
            (1, 10), (2, 15), (3, 8), (4, 20), (5, 12), (6, 18), (7, 25), (8, 22)
        };
    }
}