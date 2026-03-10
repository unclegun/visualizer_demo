using Microsoft.AspNetCore.Mvc;
using visualizer_demo.Models.Sandbox;
using Markdig;
using Microsoft.Extensions.Caching.Memory;
using System.Text.RegularExpressions;

namespace visualizer_demo.Controllers
{
    public class SandboxController : Controller
    {
        private const string PalettesCacheKey = "coolors_trending_palettes";
        private readonly IWebHostEnvironment _environment;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IMemoryCache _memoryCache;

        public SandboxController(
            IWebHostEnvironment environment,
            IHttpClientFactory httpClientFactory,
            IMemoryCache memoryCache)
        {
            _environment = environment;
            _httpClientFactory = httpClientFactory;
            _memoryCache = memoryCache;
        }

        // GET: Sandbox
        public IActionResult Index()
        {
            return View();
        }

        // GET: Sandbox/TagHelpers
        public IActionResult TagHelpers()
        {
            var docsPath = ResolveTagHelperDocsPath();
            if (!System.IO.File.Exists(docsPath))
            {
                return NotFound("Tag helper documentation was not found.");
            }

            var markdown = System.IO.File.ReadAllText(docsPath);
            ViewBag.TagHelpersDocsHtml = Markdown.ToHtml(markdown);
            return View();
        }

        [HttpGet]
        public async Task<IActionResult> Palettes()
        {
            if (_memoryCache.TryGetValue(PalettesCacheKey, out List<ThemePaletteDto>? cached) && cached is not null && cached.Count > 0)
            {
                return Json(cached);
            }

            var palettes = await TryGetCoolorsTrendingPalettesAsync();
            if (palettes.Count == 0)
            {
                palettes = GetFallbackPalettes();
            }

            _memoryCache.Set(PalettesCacheKey, palettes, TimeSpan.FromHours(6));
            return Json(palettes);
        }

        private string ResolveTagHelperDocsPath()
        {
            var candidateInContentRoot = Path.Combine(_environment.ContentRootPath, "docs", "tag-helpers.md");
            if (System.IO.File.Exists(candidateInContentRoot))
            {
                return candidateInContentRoot;
            }

            var parentDirectory = Directory.GetParent(_environment.ContentRootPath)?.FullName;
            if (!string.IsNullOrWhiteSpace(parentDirectory))
            {
                var candidateInParent = Path.Combine(parentDirectory, "docs", "tag-helpers.md");
                if (System.IO.File.Exists(candidateInParent))
                {
                    return candidateInParent;
                }
            }

            return candidateInContentRoot;
        }

        private async Task<List<ThemePaletteDto>> TryGetCoolorsTrendingPalettesAsync()
        {
            try
            {
                var client = _httpClientFactory.CreateClient();
                client.Timeout = TimeSpan.FromSeconds(10);
                client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (compatible; visualizer_demo/1.0)");

                var html = await client.GetStringAsync("https://coolors.co/palettes/trending");

                var matches = Regex.Matches(html, "href=\"/palette/([a-z0-9-]{11,})\"", RegexOptions.IgnoreCase);
                var slugs = matches
                    .Select(m => m.Groups[1].Value)
                    .Where(v => !string.IsNullOrWhiteSpace(v))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .Take(150)
                    .ToList();

                var palettes = new List<ThemePaletteDto>();
                foreach (var slug in slugs)
                {
                    var colors = slug
                        .Split('-', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                        .Where(segment => Regex.IsMatch(segment, "^[0-9a-fA-F]{6}$"))
                        .Select(segment => $"#{segment.ToUpperInvariant()}")
                        .Take(6)
                        .ToList();

                    if (colors.Count < 4)
                    {
                        continue;
                    }

                    palettes.Add(new ThemePaletteDto
                    {
                        Id = slug,
                        Name = $"Coolors {slug[..Math.Min(18, slug.Length)]}",
                        Colors = colors,
                        SourceUrl = $"https://coolors.co/palette/{slug}"
                    });
                }

                return palettes;
            }
            catch
            {
                return new List<ThemePaletteDto>();
            }
        }

        private static List<ThemePaletteDto> GetFallbackPalettes()
        {
            return new List<ThemePaletteDto>
            {
                new() { Id = "264653-2a9d8f-e9c46a-f4a261-e76f51", Name = "Coolors Terra", Colors = new() { "#264653", "#2A9D8F", "#E9C46A", "#F4A261", "#E76F51" }, SourceUrl = "https://coolors.co/palette/264653-2a9d8f-e9c46a-f4a261-e76f51" },
                new() { Id = "0f4c5c-2c7da0-468faf-89c2d9-e0fbfc", Name = "Coolors Harbor", Colors = new() { "#0F4C5C", "#2C7DA0", "#468FAF", "#89C2D9", "#E0FBFC" }, SourceUrl = "https://coolors.co/palette/0f4c5c-2c7da0-468faf-89c2d9-e0fbfc" },
                new() { Id = "2b2d42-8d99ae-edf2f4-ef233c-d90429", Name = "Coolors Signal", Colors = new() { "#2B2D42", "#8D99AE", "#EDF2F4", "#EF233C", "#D90429" }, SourceUrl = "https://coolors.co/palette/2b2d42-8d99ae-edf2f4-ef233c-d90429" },
                new() { Id = "03045e-0077b6-00b4d8-90e0ef-caf0f8", Name = "Coolors Oceanic", Colors = new() { "#03045E", "#0077B6", "#00B4D8", "#90E0EF", "#CAF0F8" }, SourceUrl = "https://coolors.co/palette/03045e-0077b6-00b4d8-90e0ef-caf0f8" },
                new() { Id = "22223b-4a4e69-9a8c98-c9ada7-f2e9e4", Name = "Coolors Slate Rose", Colors = new() { "#22223B", "#4A4E69", "#9A8C98", "#C9ADA7", "#F2E9E4" }, SourceUrl = "https://coolors.co/palette/22223b-4a4e69-9a8c98-c9ada7-f2e9e4" },
                new() { Id = "ffbe0b-fb5607-ff006e-8338ec-3a86ff", Name = "Coolors Neon Pop", Colors = new() { "#FFBE0B", "#FB5607", "#FF006E", "#8338EC", "#3A86FF" }, SourceUrl = "https://coolors.co/palette/ffbe0b-fb5607-ff006e-8338ec-3a86ff" },
                new() { Id = "0b132b-1c2541-3a506b-5bc0be-6fffe9", Name = "Coolors Depth", Colors = new() { "#0B132B", "#1C2541", "#3A506B", "#5BC0BE", "#6FFFE9" }, SourceUrl = "https://coolors.co/palette/0b132b-1c2541-3a506b-5bc0be-6fffe9" },
                new() { Id = "f72585-b5179e-7209b7-560bad-3a0ca3", Name = "Coolors Vivid Bloom", Colors = new() { "#F72585", "#B5179E", "#7209B7", "#560BAD", "#3A0CA3" }, SourceUrl = "https://coolors.co/palette/f72585-b5179e-7209b7-560bad-3a0ca3" },
                new() { Id = "335c67-fff3b0-e09f3e-9e2a2b-540b0e", Name = "Coolors Autumn Ink", Colors = new() { "#335C67", "#FFF3B0", "#E09F3E", "#9E2A2B", "#540B0E" }, SourceUrl = "https://coolors.co/palette/335c67-fff3b0-e09f3e-9e2a2b-540b0e" },
                new() { Id = "588b8b-ffffff-ffd5c2-f28f3b-c8553d", Name = "Coolors Warm Minimal", Colors = new() { "#588B8B", "#FFFFFF", "#FFD5C2", "#F28F3B", "#C8553D" }, SourceUrl = "https://coolors.co/palette/588b8b-ffffff-ffd5c2-f28f3b-c8553d" }
            };
        }

        public class ThemePaletteDto
        {
            public string Id { get; set; } = string.Empty;
            public string Name { get; set; } = string.Empty;
            public List<string> Colors { get; set; } = new();
            public string SourceUrl { get; set; } = string.Empty;
        }

        // GET: Sandbox/Forms
        public IActionResult Forms()
        {
            return View();
        }

        // POST: Sandbox/Forms
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult Forms(SampleFormModel model)
        {
            if (ModelState.IsValid)
            {
                TempData["SuccessMessage"] = $"Form submitted successfully! Name: {model.Name}, Email: {model.Email}";
                return RedirectToAction(nameof(Forms));
            }
            return View(model);
        }

        // GET: Sandbox/Partials
        public IActionResult Partials()
        {
            var items = new List<string> { "Item 1", "Item 2", "Item 3", "Item 4" };
            return View(items);
        }

        // GET: Sandbox/Components
        public IActionResult Components()
        {
            return View();
        }

        // GET: Sandbox/AjaxExample
        public IActionResult AjaxExample()
        {
            return View();
        }

        // POST: Sandbox/GetData (for AJAX testing)
        [HttpPost]
        public IActionResult GetData([FromBody] dynamic data)
        {
            return Json(new { success = true, message = "Data received successfully!", receivedData = data });
        }

        // GET: Sandbox/AgentSelector
        public IActionResult AgentSelector()
        {
            var viewModel = AgentSelectorViewModel.GetSampleData();
            return View(viewModel);
        }

        // POST: Sandbox/AgentSelector
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult AgentSelector(AgentSelectorFormModel model)
        {
            if (ModelState.IsValid)
            {
                var selectedCount = model.SelectedAgentIds?.Count ?? 0;
                TempData["SuccessMessage"] = $"Successfully selected {selectedCount} agent(s)! Reason: {model.Reason}";
                return RedirectToAction(nameof(AgentSelector));
            }

            // Reload the form data if validation fails
            var viewModel = AgentSelectorViewModel.GetSampleData();
            viewModel.FormModel = model;
            return View(viewModel);
        }
    }
}
