using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Authorization;

namespace visualizer_demo.Pages.Admin
{
    [Authorize]
    public class ElementStyleDesignerModel : PageModel
    {
        public void OnGet()
        {
            // Page load - authorization check already done via [Authorize] attribute
            // All work is done on the client side with localStorage persistence
        }
    }
}
