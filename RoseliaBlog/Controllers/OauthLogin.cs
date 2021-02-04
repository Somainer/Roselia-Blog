using System;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using RoseliaBlog.Models;
using RoseliaBlog.Models.Forms;
using RoseliaBlog.RoseliaCore.Managements;
using RoseliaBlog.RoseliaCore.OAuth;
using RoseliaBlog.RoseliaCore.Token;
using RoseliaCore.OAuth;

namespace RoseliaBlog.Controllers
{
    [Route("/api/login/oauth")]
    public class OauthLoginController : Controller
    {
        [Route("adapters")]
        public IActionResult GetAdaptersList()
        {
            return RoseliaApiResult
                .Succeed(OAuthAdapter.Adapters.Select(adp => adp.Name))
                .ToActionResult();
        }
        
        [Route("{adapterName}/url")]
        public IActionResult GetOauthUrl(
            string adapterName,
            [FromQuery(Name = "base")] string urlBase,
            [FromQuery] string redirect
        )
        {
            if (!OAuthAdapter.AdaptersDict.TryGetValue(adapterName, out var adapter))
            {
                return RoseliaApiResult.Failure("Adapter not found.").ToActionResult(NotFound);
            }

            var callback = GetCallbackUrl(adapterName);
            var ud = new RouteValueDictionary
            {
                {nameof(adapterName), adapterName},
                {"base", urlBase},
                {nameof(redirect), redirect}
            };
            
            var fullCallback =
                Url.Action("OauthLoginCallback", ud);
            
            var request = new OauthRequest
            {
                Base = urlBase,
                Redirection = fullCallback,
                State = new OauthLoginState
                    {
                        Base = urlBase,
                        Redirect = redirect
                    },
                Callback = callback
            };

            return RoseliaApiResult
                .Succeed(adapter.GetOAuthUrl(request))
                .ToActionResult();
        }

        [Route("{adapterName}/callback")]
        public async Task<IActionResult> OauthLoginCallback(
            string adapterName,
            [FromQuery] string state,
            [FromQuery] string code,
            [FromQuery(Name = "base")] string baseUrl,
            [FromQuery] string redirect,
            [FromQuery(Name = "type")] string actionType
        )
        {
            if (!OAuthAdapter.AdaptersDict.TryGetValue(adapterName, out var adapter))
            {
                return Redirect("/");
            }
            
            var st = 
                state is null ? null : JsonSerializer.Deserialize<OauthLoginState>(state);
            baseUrl ??= st?.Base;
            redirect ??= st?.Redirect;
            actionType ??= st?.Type;

            if (code is null)
            {
                return Redirect(redirect ?? "/");
            }

            var user = await OAuthManagement.LoginWithCode(adapter, code, new()
            {
                Callback = GetCallbackUrl(adapterName)
            });

            if (user is null)
            {
                return Redirect("/");
            }

            var tokenBase = UserManagement.UserToTokenBase(user.Value);
            var token = TokenProcessor.CreateToken(TokenTypes.MakeUserCredential(tokenBase));

            return Redirect($"/login?token={token}");
        }

        private string GetCallbackUrl(string adapterName)
        {
            var ud = new RouteValueDictionary
            {
                {nameof(adapterName), adapterName}
            };
            
            return Url.Action("OauthLoginCallback", ud);
        }
    }
}
