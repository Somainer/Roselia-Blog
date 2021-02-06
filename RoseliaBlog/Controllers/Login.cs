using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Net.Http.Headers;
using RoseliaBlog.Middleware;
using RoseliaBlog.Models;
using RoseliaBlog.Models.Forms;
using RoseliaBlog.RoseliaCore.Managements;
using RoseliaBlog.RoseliaCore.Token;
using RoseliaCore.Managements;
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

        [Route("code/gen")]
        public IActionResult GenerateLoginCode()
        {
            return Ok(new
            {
                Success = true,
                Code = RemoteLoginManagement.GetRandomCode(GetConnectionInfo())
            });
        }

        [Route("code/scan/{code}")]
        [HttpPost]
        [TokenAuthentication(AllowAnonymous = false, RequiredTokenType = TokenTypes.RoseliaTokenType.UserCredential)]
        public IActionResult ScanLoginCode(string code)
        {
            var token = this.GetUser().UserToken;
            var success = RemoteLoginManagement.ScanCode(code, token);
            var record = RemoteLoginManagement.GetRecordOption(code)?.Value;
            return Ok(new
            {
                Success = success,
                Msg = record?.ConnectionInfo
            });
        }

        [HttpPost]
        [Route("code/confirm/{code}")]
        [TokenAuthentication(AllowAnonymous = false, RequiredTokenType = TokenTypes.RoseliaTokenType.UserCredential)]
        public IActionResult ConfirmRemoteLogin(string code)
        {
            var success =
                RemoteLoginManagement.ConfirmLogin(code, this.GetUser().UserToken);
            return Ok(new
            {
                Success = success
            });
        }

        [HttpPost]
        [Route("code/{code}")]
        public IActionResult GetRemoteLoginCodeInfo(string code)
        {
            var info = 
                RemoteLoginManagement.GetRecordOption(code)?.Value;
            if (info is null) return NotFound();

            string token = null;
            var user = info.User?.Value;
            if (info.IsConfirmed && user is not null)
            {

                var model = TokenTypes.MakeUserCredential(user);
                token = TokenProcessor.CreateToken(model);
            }

            return Ok(new
            {
                Success = true,
                Data = new
                {
                    Username = user?.UserName,
                    Role = user?.UserRole,
                    Token = token
                }
            });
        }

        private RemoteLoginManagement.ConnectionInfo GetConnectionInfo()
        {
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "";
            var userAgent = Request.Headers[HeaderNames.UserAgent];
            var clientInfo = UAParser.Parser.GetDefault().Parse(userAgent);
            return new RemoteLoginManagement.ConnectionInfo(ip, clientInfo.UA.Family, clientInfo.OS.Family);
        }
    }
}
