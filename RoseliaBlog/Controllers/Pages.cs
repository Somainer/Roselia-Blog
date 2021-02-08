using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using RoseliaBlog.RoseliaCore.ApiModels;
using RoseliaBlog.RoseliaCore.Database.Models;
using RoseliaBlog.RoseliaCore.Managements;
using RoseliaBlog.RoseliaCore.RoseliaFlavoredMarkdown;

namespace RoseliaBlog.Controllers
{
    [Route("/")]
    public class PagesController : Controller
    {
        [Route("")]
        public async Task<IActionResult> Index()
        {
            var tag = Request.Query.GetStringOption("tag");
            var catalog = Request.Query.GetStringOption("catalog");
            var page = Request.Query.GetInt("page", 1);
            var limit = Request.Query.GetInt("limit", 6);
            var offset = (page - 1) * limit;
            var (postCount, posts) = 
                await PostManagement.GetPostsAndCount(offset, limit, null, tag, catalog);
            var pageCount = postCount / limit + (postCount % limit > 0 ? 1 : 0);
            ViewData["total"] = pageCount;
            ViewData["current"] = page;
            
            return View("Index", posts);
        }

        [Route("post")]
        public async Task<IActionResult> PostById([FromQuery] int p)
        {
            var post = await PostManagement.GetPost(p);
            return GeneratePostView(post?.Value);
        }

        [Route("post/{**postLink}")]
        public async Task<IActionResult> PostByDisplayId(string postLink)
        {
            var post = await PostManagement.FindPostByDisplayId(postLink);
            return GeneratePostView(post?.Value);
        }

        private IActionResult GeneratePostView(Post post)
        {
            if (post is null || post.Secret > 0)
            {
                var notFoundArticle = new Article()
                {
                    Title = "404 Not Found",
                    Subtitle = "Please check your post-id. Or try to Login.",
                    Created = DateTime.Now,
                    LastEdit = DateTime.Now,
                    Author = new UserInfo() {},
                    Content = "There might be some problem. Please check your input."
                };
                var response = View("Post", notFoundArticle);
                response.StatusCode = (int?) HttpStatusCode.NotFound;
                return response;
            }
            
            var article = ArticleModule.ArticleFromPostTransformer.Copy(post);
            article.Content = RoseliaFlavoredMarkdownModule.CleanupScript(article.Content);
            return View("Post", article);
        }

        [NonAction]
        public static string GetPostLinkViaArticle(Article article, IUrlHelper url)
        {
            if (string.IsNullOrEmpty(article.DisplayId))
            {
                return url.Action("PostById", new {p = article.Id});
            }

            return url.Action("PostByDisplayId", new {postLink = article.DisplayId});
        }
    }
}
