using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using RoseliaBlog.Middleware;
using RoseliaBlog.Models;
using RoseliaBlog.RoseliaCore.Managements;
using RoseliaBlog.RoseliaCore.Token;

namespace RoseliaBlog.Controllers
{
    [ApiController]
    [Route("/api/post")]
    public class Posts : Controller
    {
        [Route("/api/posts")]
        [TokenAuthentication(AllowAnonymous = true, RequiredTokenType = TokenTypes.RoseliaTokenType.UserCredential)]
        public async Task<IActionResult> GetPosts()
        {
            var tag = Request.Query.GetStringOption("tag");
            var catalog = Request.Query.GetStringOption("catalog");
            var userPrincipal = GetUser();
            var user = await userPrincipal.GetUnderlyingUser();
            var page = Request.Query.GetInt("page", 1);
            var limit = Request.Query.GetInt("limit", 6);
            var offset = (page - 1) * limit;
            var (postCount, posts) = 
                await PostManagement.GetPostsAndCount(offset, limit, user, tag, catalog);
            var pageCount = postCount / limit + (postCount % limit > 0 ? 1 : 0);

            return Ok(new
            {
                Data = posts,
                Total = postCount,
                Pages = pageCount,
                Valid = userPrincipal.IsAuthenticated
            });
        }
        
        private RoseliaUserPrincipal GetUser() => HttpContext.User as RoseliaUserPrincipal;
    }
}