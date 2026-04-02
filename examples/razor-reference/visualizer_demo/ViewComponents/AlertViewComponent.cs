using Microsoft.AspNetCore.Mvc;

namespace visualizer_demo.ViewComponents
{
    public class AlertViewComponent : ViewComponent
    {
        public IViewComponentResult Invoke(string message, string type = "info")
        {
            var model = new AlertViewModel
            {
                Message = message,
                Type = type
            };
            return View(model);
        }
    }

    public class AlertViewModel
    {
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = "info";
    }
}
