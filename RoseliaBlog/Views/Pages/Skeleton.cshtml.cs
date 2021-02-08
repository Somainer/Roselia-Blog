using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace RoseliaBlog.Views.Pages
{
    public class Skeleton : PageModel
    {
        public IHtmlContent BodyContent { get; init; }
        public IHtmlContent HeaderContent { get; init; }
    }
}