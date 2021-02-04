#nullable enable
using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Net.Http.Headers;
using RoseliaBlog.Models;
using RoseliaBlog.RoseliaCore.Managements;
using RoseliaBlog.RoseliaCore.Token;
using static RoseliaBlog.RoseliaCore.Token.TokenTypes;

namespace RoseliaBlog.Middleware
{
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false, Inherited = true)]
    public class TokenAuthenticationAttribute : Attribute, IAsyncAuthorizationFilter
    {
        public bool AllowAnonymous { get; init; } = false;
        public int MinimumRoleLevel { get; init; } = 0;
        public RoseliaTokenType RequiredTokenType { get; init; } = RoseliaTokenType.UserCredential;
        
        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            var tokenModel = GetTokenModel(await GetTokenFromContext(context.HttpContext));
            if (!IsAccessAllowed(tokenModel))
            {
                var errorMessage = tokenModel switch
                {
                    null => "Invalid token",
                    { TokenType: var tokenType } when tokenType != RequiredTokenType =>
                        $"Desired {RequiredTokenType} but {tokenModel.TokenType} found",
                    _ => "Wrong role level"
                };
                context.Result = new UnauthorizedObjectResult(new
                {
                    Success = false,
                    Msg = errorMessage
                });
                return;
            }

            context.HttpContext.User = new RoseliaUserPrincipal(tokenModel);
        }

        internal static async Task<string?> GetTokenFromContext(HttpContext context)
        {
            if (context.Request.Headers.TryGetValue(HeaderNames.Authorization, out var authHeader))
            {
                var tokenHeader = authHeader.FirstOrDefault();
                if (!string.IsNullOrEmpty(tokenHeader))
                {
                    var parts = tokenHeader.Split(' ');
                    if (parts.Length == 2 && parts[0].ToLower() == "bearer")
                    {
                        return parts[1];
                    }
                }
            }

            if (context.Request.Method == HttpMethods.Post)
            {
                if (context.Request.HasFormContentType 
                    && context.Request.Form.TryGetValue("token", out var t) 
                    && !string.IsNullOrEmpty(t.FirstOrDefault()))
                {
                    return t.First();
                }

                if (context.Request.HasJsonContentType())
                {
                    var memString = new MemoryStream();
                    await context.Request.Body.CopyToAsync(memString);
                    // After copy, set position to begin.
                    memString.Seek(0, SeekOrigin.Begin);
                    await context.Request.Body.DisposeAsync();
                    context.Request.Body = memString;
                    // This code will consume the stream.
                    var form = 
                        await context.Request.ReadFromJsonAsync<JsonElement>();
                    var token = form.GetStringOption("token")?.Value;
                    
                    // It is essential to make body content stream usable in controller.
                    context.Request.Body.Seek(0, SeekOrigin.Begin);

                    if (!string.IsNullOrEmpty(token))
                    {
                        return token;
                    }
                }
            }

            return null;
        }

        internal static RoseliaUserToken? GetTokenModel(string? token)
            => token is null ? null : TokenProcessor.ValidateRoseliaToken(token)?.Value;

        private bool IsAccessAllowed(RoseliaUserToken? token)
            => token is null
                ? AllowAnonymous
                : token.TokenType == RequiredTokenType && token.UserRole >= MinimumRoleLevel;
    }

    [AttributeUsage(AttributeTargets.Method, Inherited = false, AllowMultiple = false)]
    sealed class MasterUserAuthenticationAttribute : Attribute, IAsyncAuthorizationFilter
    {
        public RoseliaTokenType RequiredTokenType { get; init; } = RoseliaTokenType.UserCredential;
        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            var tokenModel = 
                TokenAuthenticationAttribute.GetTokenModel(await TokenAuthenticationAttribute.GetTokenFromContext(context.HttpContext));
            if (tokenModel is null || tokenModel.TokenType != this.RequiredTokenType)
            {
                context.Result = new UnauthorizedObjectResult(
                    RoseliaApiResult.Failure("Token type does not match.")
                );
                return;
            }
            
            var userPrincipal = new RoseliaUserPrincipal(tokenModel);
            var user = await userPrincipal.GetUnderlyingUser();
            if (user is null || !await UserManagement.IsMaster(user.Value))
            {
                context.Result = new UnauthorizedObjectResult(
                    RoseliaApiResult.Failure("You are not authorized to view this content.")
                );
                return;
            }

            context.HttpContext.User = userPrincipal;
        }
    }
}
