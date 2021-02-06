using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using RoseliaBlog.Middleware;
using RoseliaBlog.Models;
using RoseliaBlog.Models.Forms;
using RoseliaBlog.RoseliaCore.OAuth;
using RoseliaBlog.RoseliaCore.Token;
using RoseliaCore.OAuth;

namespace RoseliaBlog.Controllers
{
    [Route("/api/oauth")]
    public class OAuthController : Controller
    {
        [Route("list-bind-adapters")]
        [TokenAuthentication(AllowAnonymous = false, RequiredTokenType = TokenTypes.RoseliaTokenType.UserCredential)]
        public async Task<IActionResult> GetOauthAdapters()
        {
            var adapters = await OAuthManagement.GetAdapters(this.GetUser().UserName);
            return RoseliaApiResult.OfResult(adapters).ToActionResult(Unauthorized);
        }

        [HttpPost]
        [Route("remove-adapter/{adapterName}")]
        [TokenAuthentication(AllowAnonymous = false, RequiredTokenType = TokenTypes.RoseliaTokenType.UserCredential)]
        public async Task<IActionResult> RemoveOauthAdapter(string adapterName)
        {
            var result = await OAuthManagement.RemoveAdapter(this.GetUser().UserName, adapterName);
            return RoseliaApiResult.OfResult(result).ToActionResult(Ok);
        }

        [Route("bind/{adapterName}/url")]
        [TokenAuthentication(AllowAnonymous = false, RequiredTokenType = TokenTypes.RoseliaTokenType.UserCredential)]
        public IActionResult GetOauthBindUrl(string adapterName, [FromQuery(Name = "base")] string urlBase)
        {
            if (!OAuthAdapter.AdaptersDict.TryGetValue(adapterName, out var adapter))
            {
                return RoseliaApiResult.Failure("Adapter not found.").ToActionResult(NotFound);
            }

            var callback = OauthLoginController.GetCallbackUrl(adapterName, Url);
            var ud = new RouteValueDictionary
            {
                {nameof(adapterName), adapterName},
                {"base", urlBase},
                {"type", "bind"}
            };
            
            var fullCallback =
                Url.Action("OauthLoginCallback", "OauthLogin", ud);
            
            var request = new OauthRequest
            {
                Base = urlBase,
                Redirection = fullCallback,
                State = new OauthLoginState
                {
                    Base = urlBase,
                    Type = "bind"
                },
                Callback = callback
            };

            return RoseliaApiResult
                .Succeed(adapter.GetOAuthUrl(request))
                .ToActionResult();
        }
    }
}
