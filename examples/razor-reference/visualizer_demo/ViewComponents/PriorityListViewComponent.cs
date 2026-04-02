using Microsoft.AspNetCore.Mvc;

namespace visualizer_demo.ViewComponents
{
    public class PriorityListViewComponent : ViewComponent
    {
        public IViewComponentResult Invoke(int maxItems = 3)
        {
            // Simulate getting priority items (in a real app, this might be from a database)
            var items = new List<PriorityItem>
            {
                new PriorityItem { Id = 1, Title = "High Priority Task", Priority = "High", Description = "This is a critical task" },
                new PriorityItem { Id = 2, Title = "Medium Priority Task", Priority = "Medium", Description = "This is an important task" },
                new PriorityItem { Id = 3, Title = "Low Priority Task", Priority = "Low", Description = "This can wait" },
                new PriorityItem { Id = 4, Title = "Another High Priority", Priority = "High", Description = "Needs attention" },
                new PriorityItem { Id = 5, Title = "Another Medium Task", Priority = "Medium", Description = "Should be done soon" }
            };

            var model = new PriorityListViewModel
            {
                Items = items.Take(maxItems).ToList(),
                MaxItems = maxItems
            };

            return View(model);
        }
    }

    public class PriorityListViewModel
    {
        public List<PriorityItem> Items { get; set; } = new();
        public int MaxItems { get; set; }
    }

    public class PriorityItem
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        public string GetPriorityBadgeClass()
        {
            return Priority.ToLower() switch
            {
                "high" => "bg-danger",
                "medium" => "bg-warning",
                "low" => "bg-success",
                _ => "bg-secondary"
            };
        }
    }
}
