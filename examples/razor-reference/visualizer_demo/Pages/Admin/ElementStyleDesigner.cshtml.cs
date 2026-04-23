using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace visualizer_demo.Pages.Admin
{
    public class ElementStyleDesignerModel : PageModel
    {
        public void OnGet()
        {
            // Page load - all work is done on the client side with localStorage persistence
            // Publicly accessible for anyone to design custom CSS classes
        }
    }
}
