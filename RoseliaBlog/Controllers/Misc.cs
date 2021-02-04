using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using RoseliaBlog.Models;
using RoseliaBlog.RoseliaCore.Managements;
using RoseliaBlog.RoseliaCore.Token;

namespace RoseliaBlog.Controllers
{
    [Route("/api")]
    public class MiscController : Controller
    {
        [Route("firstrun")]
        public async Task<IActionResult> CheckFirstRun()
        {
            var isEmpty = await UserManagement.HasNoUser();
            if (!isEmpty)
            {
                return RoseliaApiResult
                    .Failure("User is not empty.").ToActionResult(Ok);
            }

            var userBase = new TokenTypes.RoseliaUserBase(0, "Master", 3);
            var token =
                TokenProcessor.CreateToken(TokenTypes.MakeUserCredential(userBase));
            var superUserToken =
                TokenProcessor.CreateToken(TokenTypes.MakeSuperUserToken(userBase));

            return RoseliaApiResult
                .Succeed(new
                {
                    Username = userBase.UserName,
                    Role = userBase.UserRole,
                    Token = token,
                    SuToken = superUserToken
                }).ToActionResult();
        }
    }
}
