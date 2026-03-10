# Visualizer Demo

This is a demo of modern, modular visualizers for ASP.NET Core Razor web applications. The visualizers are designed to be contained entities that can be easily integrated into existing enterprise applications with minimal HTML changes.

## Features

- **Modern Design**: Bootstrap 5 cards with responsive layouts and contemporary styling.
- **Multiple Chart Types**: Bar, Pie, Line, and Doughnut charts using Chart.js.
- **Modular Architecture**: Self-contained partial views with inline CSS and JavaScript.
- **Bootstrap Integration**: Leverages Bootstrap for responsive grids, cards, and utilities.
- **Data Integration**: Uses basic DAL with SQL queries to fetch data from SQLite.
- **Minimal Integration**: Developers only need to provide a partial call with data.

## Structure

- **Models/ChartData.cs**: Unified data model for all chart types.
- **DAL/DataAccess.cs**: Data Access Layer with SQL queries for different aggregations.
- **Pages/Shared/_*ChartPartial.cshtml**: Modular partial views for each chart type.
- **Index.cshtml**: Responsive Bootstrap layout showcasing all visualizers.

## Chart Types

- **Bar Chart**: Sales by category with modern Bootstrap primary colors.
- **Pie Chart**: Sales distribution with colorful segments.
- **Line Chart**: Monthly sales trends with smooth curves.
- **Doughnut Chart**: Category breakdown with cutout center.

## Usage

To include a visualizer in a Razor page:

1. Fetch data using your DAL (adapt `DataAccess` methods).
2. In the Razor view, use:

```cshtml
@await Html.PartialAsync("_BarChartPartial", new {
    Id = "uniqueChartId",
    Title = "Your Chart Title",
    Label = "Data Label",
    Data = yourChartData // ChartData object
})
```

3. Bootstrap handles responsive layout and styling automatically.

## Responsive Layout

The demo uses Bootstrap's grid system:
- Desktop: 4 charts in a row (col-xl-3)
- Tablet: 2 charts per row (col-lg-6)
- Mobile: 1 chart per row (col-12)

## Running the Demo

1. Ensure .NET 10.0 and SQLite are available.
2. Run `dotnet build` and `dotnet run`.
3. Open `http://localhost:5062` for the full demo.

## Integration into Enterprise Apps

- Copy partial views to your `Pages/Shared/` folder.
- Ensure Bootstrap 5 and Chart.js are loaded.
- Adapt DAL methods to your SQL queries.
- Use the partial calls as shown above.
- Everything is self-contained and responsive.

## Deviation Comment Block Snippets

Reusable XML snippets are available for documenting intentional deviations from template styles/conventions:

- `docs/snippets/style-deviation-css.snippet`
- `docs/snippets/style-deviation-js.snippet`
- `docs/snippets/style-deviation-html.snippet`
- `docs/snippets/style-deviation-csharp.snippet`

Full setup instructions, usage examples, and guidance for creating new snippets are in:

- `docs/snippets/README.md`