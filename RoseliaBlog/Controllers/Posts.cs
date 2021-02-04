#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.FSharp.Core;
using RoseliaBlog.Middleware;
using RoseliaBlog.Models;
using RoseliaBlog.Models.Forms;
using RoseliaBlog.RoseliaCore.ApiModels;
using RoseliaBlog.RoseliaCore.Database.Models;
using RoseliaBlog.RoseliaCore.Managements;
using RoseliaBlog.RoseliaCore.RoseliaFlavoredMarkdown;
using RoseliaBlog.RoseliaCore.Token;

namespace RoseliaBlog.Controllers
{
    [ApiController]
    [Route("/api/post")]
    public class PostsController : Controller
    {
        [Route("~/api/posts")]
        [Route("list")]
        [TokenAuthentication(AllowAnonymous = true, RequiredTokenType = TokenTypes.RoseliaTokenType.UserCredential)]
        public async Task<IActionResult> GetPosts()
        {
            var tag = Request.Query.GetStringOption("tag");
            var catalog = Request.Query.GetStringOption("catalog");
            var userPrincipal = this.GetUser();
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

        [Route("user/{userName}")]
        [TokenAuthentication(AllowAnonymous = true, RequiredTokenType = TokenTypes.RoseliaTokenType.UserCredential)]
        public async Task<IActionResult> GetPostsForAuthor(string userName)
        {
            var userPrincipal = this.GetUser();
            var user = await userPrincipal.GetUnderlyingUser();
            var author = await UserManagement.FindUserByUsername(userName);
            var page = Request.Query.GetInt("page", 1);
            var limit = Request.Query.GetInt("limit", 6);
            var offset = (page - 1) * limit;
            var (postCount, posts) = 
                author is null ? Tuple.Create(0, Enumerable.Empty<Article>()) :
                await PostManagement.GetPostsFromAuthorAndCount(author.Value, offset, limit, user);
            var pageCount = postCount / limit + (postCount % limit > 0 ? 1 : 0);
            
            return Ok(new
            {
                Data = posts,
                Total = postCount,
                Pages = pageCount,
                Valid = userPrincipal.IsAuthenticated
            });
        }

        [HttpGet]
        [Route("{postId}")]
        [TokenAuthentication(AllowAnonymous = true, RequiredTokenType = TokenTypes.RoseliaTokenType.UserCredential)]
        public async Task<IActionResult> GetPostContent(int postId)
        {
            var post = await PostManagement.GetPost(postId).ConfigureAwait(false);
            
            return await GetArticleResponse(post?.Value);
        }

        [HttpGet]
        [Route("~/api/post-link/{**displayId}")]
        [Route("link/{**displayId}")]
        [TokenAuthentication(AllowAnonymous = true, RequiredTokenType = TokenTypes.RoseliaTokenType.UserCredential)]
        public async Task<IActionResult> GetPostContentByDisplayId(string displayId)
        {
            var post = await PostManagement.FindPostByDisplayId(displayId);

            return await GetArticleResponse(post?.Value);
        }

        [HttpGet]
        [Route("meta/id/{postId}")]
        [TokenAuthentication(AllowAnonymous = true, RequiredTokenType = TokenTypes.RoseliaTokenType.UserCredential)]
        public async Task<IActionResult> GetPostMeta(int postId)
        {
            var postOption = await PostManagement.GetPost(postId);
            return this.GeneratePostMetaFromPost(postOption);
        }
        
        [HttpGet]
        [Route("meta/link/{**postLink}")]
        [TokenAuthentication(AllowAnonymous = true, RequiredTokenType = TokenTypes.RoseliaTokenType.UserCredential)]
        public async Task<IActionResult> GetPostMetaFromLink(string postLink)
        {
            var postOption = await PostManagement.FindPostByDisplayId(postLink);
            return this.GeneratePostMetaFromPost(postOption);
        }

        [HttpPost]
        [Route("~/api/add")]
        [Route("add")]
        [TokenAuthentication(MinimumRoleLevel = 1, RequiredTokenType = TokenTypes.RoseliaTokenType.UserCredential)]
        public async Task<IActionResult> AddOrEditPost([FromBody] PostAddOrEditForm editForm)
        {
            FSharpResult<Unit, string> result;
            var user = (await this.GetUser().GetUnderlyingUser())?.Value;
            if (user is null) return Unauthorized();
            if (editForm.PostId > 0)
            {
                result = await PostManagement.EditPost(editForm.PostId, editForm.Data, user.Role, editForm.Markdown);
            }
            else
            {
                result = await PostManagement.AddPost(editForm.Data, user.UserId, editForm.Markdown);
            }

            return RoseliaApiResult.OfResult(result).ToActionResult(Ok);
        }

        [HttpPost, HttpDelete]
        [Route("~api/remove")]
        [Route("remove")]
        [TokenAuthentication(MinimumRoleLevel = 1, RequiredTokenType = TokenTypes.RoseliaTokenType.UserCredential)]
        public async Task<IActionResult> DeletePost([FromBody] PostBasicForm form)
        {
            var user = (await this.GetUser().GetUnderlyingUser())?.Value;
            if (user is null)
            {
                return Unauthorized();
            }
            
            var success = await PostManagement.RemovePost(form.PostId, user.Role);
            var result = success ? RoseliaApiResult.Succeed("") : RoseliaApiResult.Failure("No such post");
            return result.ToActionResult(NotFound);
        }

        [HttpPost]
        [Route("render-markdown")]
        [TokenAuthentication(MinimumRoleLevel = 0, RequiredTokenType = TokenTypes.RoseliaTokenType.UserCredential)]
        public IActionResult RenderMarkdown([FromBody] JsonElement post)
        {
            var markdown = post.GetStringOption("markdown")?.Value ?? string.Empty;
            return RoseliaApiResult
                .Succeed(RoseliaFlavoredMarkdownModule.ConvertToHtml(markdown))
                .ToActionResult();
        }

        private async Task<IActionResult> GetArticleResponse(Post? post)
        {
            if (post is null)
            {
                return NotFound();
            }

            var userPrinciple = this.GetUser();
            if (userPrinciple.PermissionLevel < post.Secret)
            {
                return NotFound();
            }

            var user = await userPrinciple.GetUnderlyingUser();
            var previousId = await PostManagement.NextPostId(post.PostId, user);
            var nextId = await PostManagement.PreviousPostId(post.PostId, user);

            return ConvertPostToArticle(
                nextId, previousId, post, this.Request.Query.GetBool("markdown", false)
            );
        }

        private IActionResult ConvertPostToArticle(int nextId, int lastId, Post post, bool needMarkdown)
        {
            var article = ArticleModule.ArticleFromPostTransformer.Copy(post);
            article.Content = needMarkdown ? post.MarkdownContent : post.Content;
            dynamic result = Expando.FromObject(article);
            result.Prev = lastId;
            result.Next = nextId;

            return Ok(result);
        }

        private IActionResult GeneratePostMetaFromPost(FSharpOption<Post>? postOption)
        {
            var userLevel = this.GetUser().PermissionLevel;
            if (postOption is null || userLevel < postOption.Value.Secret)
            {
                return NotFound(RoseliaApiResult.Failure("Post not found."));
            }

            var post = postOption.Value;
            return Ok(RoseliaApiResult.Succeed(ArticleModule.BriefArticleFromPostTransformer.Copy(post)));
        }
    }
}