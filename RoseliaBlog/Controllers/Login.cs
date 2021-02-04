using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using RoseliaBlog.Middleware;
using RoseliaBlog.Models;
using RoseliaBlog.Models.Forms;
using RoseliaBlog.RoseliaCore.Managements;
using RoseliaBlog.RoseliaCore.Token;
using static RoseliaBlog.RoseliaCore.Managements.UserManagement;

namespace RoseliaBlog.Controllers
{
    [ApiController]
    [Route("/api/login")]
    public class LoginController : Controller
    {
        [HttpPost]
        public async Task<IActionResult> Login([FromBody] LoginForm loginForm)
        {
            var result = 
                await UserManagement.CheckAndGetUserByPasswordAndCode(loginForm.UserName, loginForm.Password, loginForm.Code);

            if (result.IsOk)
            {
                var user = result.ResultValue;
                var userBase = UserToTokenBase(user);
                var credentialToken = TokenTypes.MakeUserCredential(userBase);
                var refreshToken = TokenTypes.MakeRefreshToken(userBase);
                return Ok(new
                {
                    Success = true,
                    user.Role,
                    Token = TokenProcessor.CreateToken(credentialToken),
                    Rftoken = TokenProcessor.CreateToken(refreshToken)
                });
            }
            
            var error = result.ErrorValue;
            var totpRequired = error switch
            {
                UserVerificationError.MissingTotpCode or
                    UserVerificationError.WrongTotpCode => true,
                _ => false
            };

            var errorMessage = error switch
            {
                UserVerificationError.WrongPassword => "Invalid password.",
                UserVerificationError.NoSuchUser => "Such user does not exist.",
                UserVerificationError.MissingTotpCode => "Missing two-step verification code.",
                UserVerificationError.WrongTotpCode => "Invalid two-step verification code.",
                _ => "Unknown error."
            };

            return Ok(new
            {
                Success = false,
                Msg = errorMessage,
                Totp = totpRequired
            });
        }

        [HttpPost]
        [Route("token/refresh")]
        [TokenAuthentication(RequiredTokenType = TokenTypes.RoseliaTokenType.Refresh)]
        public IActionResult RefreshToken()
        {
            var tokenModel = this.GetUser().UserToken;
            var token = TokenProcessor.RefreshCredentialToken(tokenModel);
            return Ok(new
            {
                Success = token is not null,
                Token = token?.Value
            });
        }
    }
}