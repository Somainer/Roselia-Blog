using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using RoseliaBlog.Middleware;
using RoseliaBlog.Models;
using RoseliaBlog.RoseliaCore;
using RoseliaBlog.RoseliaCore.Token;
using RoseliaCore.Managements;

namespace RoseliaBlog.Controllers
{
    [ApiController]
    [Route("/api/comment")]
    public class CommentController : Controller
    {
        [Route("add")]
        [HttpPost]
        [TokenAuthentication(AllowAnonymous = true, RequiredTokenType = TokenTypes.RoseliaTokenType.UserCredential)]
        public async Task<IActionResult> AddComment([FromBody] JsonElement form)
        {
            var postIdElement = 
                form.GetPropertyOption("toPost") ?? form.GetPropertyOption("to_post");
            var postId =
                postIdElement.FlatMap(x => x.GetIntOption());
            if (postId is null)
            {
                return RoseliaApiResult
                    .Failure("Please specify post to comment.")
                    .ToActionResult(BadRequest);
            }

            if (!form.TryGetProperty("content", out var content))
            {
                return RoseliaApiResult
                    .Failure("Please write something.")
                    .ToActionResult(BadRequest);
            }

            var user = this.GetUser();
            var nickname = form.GetPropertyOption("nickname")?.Value.GetString();
            
            var toComment = form.GetPropertyOption("to_comment") 
                            ?? form.GetPropertyOption("toComment");
            
            var result = await CommentManagement.AddComment(
                postId.Value, content.GetString(),
                toComment.FlatMap(x => x.GetIntOption()),
                Util.Option.ofObject(user.UserName),
                Util.Option.ofObject(nickname)
            );

            if (result.IsError) return RoseliaApiResult.OfResult(result).ToActionResult(Ok);
            var commentId = result.ResultValue;
            var removalToken = TokenProcessor.IssueCommentRemovalToken(commentId);
            return Ok(new
            {
                Success = true,
                CommentId = commentId,
                RemoveToken = removalToken
            });

        }

        [Route("delete")]
        [HttpPost]
        [TokenAuthentication(AllowAnonymous = true, RequiredTokenType = TokenTypes.RoseliaTokenType.UserCredential)]
        public async Task<IActionResult> RemoveComment(JsonElement form)
        {
            var commentId = 
                form.GetPropertyOption("comment").FlatMap(x => x.GetIntOption());

            if (commentId is null)
            {
                return RoseliaApiResult
                    .Failure("Missing comment id.")
                    .ToActionResult(BadRequest);
            }

            var removalToken = 
                (form.GetPropertyOption("remove_token") 
                    ?? form.GetPropertyOption("removeToken"))
                    ?.Value.GetString();
            if (!string.IsNullOrEmpty(removalToken))
            {
                var cid = TokenProcessor.VerifyCommentRemovalToken(removalToken);
                if (cid is not null && cid.Value == commentId.Value)
                {
                    var status = await CommentManagement.ForceDeleteComment(commentId.Value);

                    return Ok(new
                    {
                        Success = status
                    });
                }

                return RoseliaApiResult.Failure("Invalid token.").ToActionResult(Unauthorized);
            }

            if (!this.GetUser().IsAuthenticated)
            {
                return RoseliaApiResult.Failure("Token required.").ToActionResult(Unauthorized);
            }

            var result = await CommentManagement.DeleteComment(commentId.Value, this.GetUser().UserName);

            return RoseliaApiResult.OfResult(result).ToActionResult(Unauthorized);
        }
        
        [Route("comments")]
        public async Task<IActionResult> GetCommentsForPost(
            [FromQuery(Name = "p")] int postId,
            [FromQuery(Name = "limit")] int limit,
            [FromQuery(Name = "page")] int page
        )
        {
            var offset = (page - 1) * limit;
            var comments = await CommentManagement.GetComments(postId, limit, offset);
            var totalCount = await CommentManagement.GetCommentCount(postId);
            var totalPages = totalCount / limit + (totalCount % limit > 0 ? 1 : 0);

            return Ok(new
            {
                Success = true,
                Result = comments,
                Pages = totalPages,
                Total = totalCount
            });
        }

        [Route("comment/{commentId}")]
        public async Task<IActionResult> GetComment(int commentId)
        {
            var comment = await CommentManagement.GetCommentInfo(commentId);
            return RoseliaApiResult
                .OfOption(comment, "Comment not found.")
                .ToActionResult(onFail: NotFound);
        }
    }
}