#nullable enable
using System;
using System.Linq;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Net.Http.Headers;
using RoseliaBlog.Models;
using RoseliaBlog.RoseliaCore.Token;
using static RoseliaBlog.RoseliaCore.Token.TokenTypes;

namespace RoseliaBlog.Middleware
{
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false, Inherited = true)]
    public class TokenAuthenticationAttribute : Attribute, IAuthorizationFilter
    {
        public bool AllowAnonymous { get; init; } = false;
        public int MinimumRoleLevel { get; init; } = 0;
        public RoseliaTokenType RequiredTokenType { get; init; } = RoseliaTokenType.UserCredential;
        
        public void OnAuthorization(AuthorizationFilterContext context)
        {
            var tokenModel = GetTokenModel(this.GetTokenFromContext(context.HttpContext));
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
            }

            context.HttpContext.User = new RoseliaUserPrincipal(tokenModel);
        }

        private string? GetTokenFromContext(HttpContext context)
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

            return null;
        }

        private static RoseliaUserToken? GetTokenModel(string? token)
            => token is null ? null : TokenProcessor.ValidateRoseliaToken(token)?.Value;

        private bool IsAccessAllowed(RoseliaUserToken? token)
            => token is null
                ? AllowAnonymous
                : token.TokenType == RequiredTokenType && token.UserRole >= MinimumRoleLevel;
    }
}
