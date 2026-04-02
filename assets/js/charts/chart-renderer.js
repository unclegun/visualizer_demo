export function renderCharts(chartConfigs) {
  if (typeof Chart === "undefined") {
    return;
  }

  const radialChartTypes = new Set(["pie", "doughnut", "polarArea", "radar"]);

  Object.entries(chartConfigs || {}).forEach(([chartId, config]) => {
    const canvas = document.getElementById(`chart-${chartId}`);
    if (!canvas) {
      return;
    }

    const existing = Chart.getChart(canvas);
    if (existing) {
      existing.destroy();
    }

    const datasets = (config.datasets || []).map((dataset) => ({
      ...dataset,
      borderRadius: config.type === "bar" ? 6 : dataset.borderRadius,
      borderWidth: dataset.borderWidth ?? 2,
      tension: dataset.tension ?? 0.36
    }));

    new Chart(canvas.getContext("2d"), {
      type: config.type,
      data: {
        labels: config.labels,
        datasets
      },
      options: {
        responsive: true,
        // Keep chart height stable as the page settles/layout shifts.
        maintainAspectRatio: true,
        aspectRatio: radialChartTypes.has(config.type) ? 1 : 1.9,
        plugins: {
          legend: {
            labels: {
              color: getComputedStyle(document.body).getPropertyValue("--text-main") || "#0f172a"
            }
          }
        },
        scales: {
          y: {
            ticks: {
              color: getComputedStyle(document.body).getPropertyValue("--text-muted") || "#475569"
            },
            grid: {
              color: "rgba(148, 163, 184, 0.2)"
            }
          },
          x: {
            ticks: {
              color: getComputedStyle(document.body).getPropertyValue("--text-muted") || "#475569"
            },
            grid: {
              color: "rgba(148, 163, 184, 0.15)"
            }
          }
        }
      }
    });
  });
}
