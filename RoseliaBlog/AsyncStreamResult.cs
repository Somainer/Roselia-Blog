using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

namespace RoseliaBlog;

public class AsyncStreamResult : IActionResult
{
    public string ContentType { get; init; }
    public required IAsyncEnumerable<string> Enumerable { get; init; }

    public async Task ExecuteResultAsync(ActionContext context)
    {
        var httpContext = context.HttpContext;
        httpContext.Response.ContentType = ContentType;
        await foreach (var fragment in Enumerable)
        {
            Encoding.UTF8.GetBytes(fragment, httpContext.Response.BodyWriter);
            await httpContext.Response.BodyWriter.FlushAsync(httpContext.RequestAborted);
        }
    }
}
