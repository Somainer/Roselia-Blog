using System;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using AngleSharp;
using Microsoft.AspNetCore.Mvc;
using RoseliaBlog.Middleware;
using RoseliaBlog.Models;
using RoseliaBlog.RoseliaCore.ApiModels;
using RoseliaBlog.RoseliaCore.RoseliaFlavoredMarkdown;
using RoseliaBlog.RoseliaCore.Token;

namespace RoseliaBlog.Controllers
{
    [Route("/api")]
    public class PostProjectionController : Controller
    {
        [Route("post-link/github/{githubUsername}/{repo}/blob/{**path}")]
        [Route("post-link/github.com/{githubUsername}/{repo}/blob/{**path}")]
        [Route("post/link/github/{githubUsername}/{repo}/blob/{**path}")]
        [Route("post/link/github.com/{githubUsername}/{repo}/blob/{**path}")]
        [TokenAuthentication(AllowAnonymous = false, RequiredTokenType = TokenTypes.RoseliaTokenType.UserCredential)]
        public async Task<IActionResult> GetGithubProjectedPost(string githubUsername, string repo, string path)
        {
            var fileUri = $"https://raw.githubusercontent.com/{githubUsername}/{repo}/{path}";
            using var client = new HttpClient();
            client.DefaultRequestHeaders.ConnectionClose = true;
            var file = await client.GetStringAsync(fileUri);
            var content = file;
            if (path.EndsWith(".md"))
            {
                content = 
                    await InterceptLinks(
                        RoseliaFlavoredMarkdownModule.ConvertToHtml(file), 
                        fileUri, 
                        "");
            }

            var author = await GithubUserGetter.GetUser(githubUsername);
            author.Role = this.GetUser().Role + 1; // Make this post readonly.

            var article = new Article
            {
                Title = path.Split('/').Last(),
                Subtitle = $"{githubUsername}/{repo}",
                Content = content,
                Created = DateTime.Now,
                Author = author,
                EnableComment = false,
                LastEdit = DateTime.Now,
                Tags = new [] { "GitHub", githubUsername, repo },
                Catalogs = Array.Empty<string>(),
            };

            return PostsController.ConvertPostToArticle(-1, -1, article);
        }

        private async Task<string> InterceptLinks(string content, string baseUrl, string projectionUrl)
        {
            var document = await new AngleSharp.Html.Parser.HtmlParser().ParseDocumentAsync(content, default);
            var baseUri = new Uri(baseUrl);
            foreach (var element in document.Images)
            {
                var link = element.GetAttribute("src");
                var path = new Uri(link);
                if (!path.IsAbsoluteUri)
                {
                    element.SetAttribute("src", new Uri(baseUri, path).ToString());
                }
            }

            return document.ToHtml();
        }
    }
}