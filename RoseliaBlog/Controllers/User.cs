using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using RoseliaBlog.Middleware;
using RoseliaBlog.Models;
using RoseliaBlog.Models.Forms;
using RoseliaBlog.RoseliaCore.ApiModels;
using RoseliaBlog.RoseliaCore.Managements;
using RoseliaBlog.RoseliaCore.Token;

namespace RoseliaBlog.Controllers
{
    [ApiController]
    [Route("/api/user")]
    public class UserController : Controller
    {
        [HttpGet]
        [Route("user-meta")]
        [Route("user-meta/{userName}")]
        [TokenAuthentication(AllowAnonymous = true, RequiredTokenType = TokenTypes.RoseliaTokenType.UserCredential)]
        public async Task<IActionResult> GetUserMeta([FromQuery(Name = "username")] string userName)
        {
            if (string.IsNullOrEmpty(userName))
            {
                return NotFound();
            }

            if ((await UserManagement.FindUserByUsername(userName)).TryUnwrap(out var user))
            {
                var userInfo = UserInfoModule.FullUserInfoFromUserTransformer.Copy(user);
                if (this.GetUser().IsAuthenticated 
                    && string.Equals(user.UserName, this.GetUser().UserName, StringComparison.OrdinalIgnoreCase))
                {
                    return Ok(RoseliaApiResult.Succeed(userInfo));
                }

                // This info can only be accessed by its user.
                userInfo.Totp = false;
                return Ok(RoseliaApiResult.Succeed(userInfo));
            }

            return NotFound();
        }

        [HttpPost]
        [Route("su")]
        [TokenAuthentication(MinimumRoleLevel = 1, RequiredTokenType = TokenTypes.RoseliaTokenType.UserCredential)]
        public async Task<IActionResult> GetSuperUserToken([FromBody] LoginForm form)
        {
            var userName = this.GetUser().UserName ?? "";
            var user = await UserManagement.CheckAndGetUserByPassword(userName, form.Password);
            if (user is null)
            {
                return RoseliaApiResult.Failure("Invalid password.").ToActionResult(Unauthorized);
            }

            var userBase = UserManagement.UserToTokenBase(user.Value);
            var token = TokenProcessor.CreateToken(TokenTypes.MakeSuperUserToken(userBase));

            return Ok(new
            {
                Success = true,
                Token = token
            });
        }

        [HttpGet]
        [Route("list")]
        [TokenAuthentication(MinimumRoleLevel = 1, RequiredTokenType = TokenTypes.RoseliaTokenType.UserCredential)]
        public async Task<IActionResult> GetUserList()
        {
            var users = await UserManagement.GetAllUserBelowLevel(this.GetUser().Role);
            return RoseliaApiResult.Succeed(users).ToActionResult();
        }

        [HttpPost]
        [Route("change")]
        public async Task<IActionResult> ChangePassword([FromBody] JsonElement form)
        {
            var userName = form.GetStringOption("username");
            var oldPassword = form.GetStringOption("oldPassword");
            var newPassword = form.GetStringOption("newPassword");
            var token = form.GetStringOption("token");
            var model = token
                .FlatMap(TokenProcessor.ValidateRoseliaToken)
                .Filter(model => model.IsSuperUserToken);
            if (userName is null
                || newPassword is null
                || (oldPassword is null && model is null))
            {
                return RoseliaApiResult.Failure("Missing username or password").ToActionResult(BadRequest);
            }

            if (model is null)
            {
                var success = await UserManagement.ChangePassword(userName.Value, oldPassword.Value, newPassword.Value);
                var result =
                    success ? RoseliaApiResult.Succeed("") : RoseliaApiResult.Failure("Wrong password");
                return result.ToActionResult(Unauthorized);
            }

            var user = await UserManagement.FindUserByUsername(userName.Value);
            var setPasswordResult = await user
                .FilterAsync(async u =>
                    await UserManagement.ForceSetPassword(u, newPassword.Value, model.Value.UserRole));

            return RoseliaApiResult
                .OfOption(setPasswordResult.Map(_ => ""), "Invalid token.")
                .ToActionResult(Ok);
        }

        [Route("remove")]
        [HttpPost, HttpDelete]
        [TokenAuthentication(MinimumRoleLevel = 1, RequiredTokenType = TokenTypes.RoseliaTokenType.SuperUser)]
        public async Task<IActionResult> DeleteUser([FromBody] JsonElement form)
        {
            var userName = form.GetStringOption("username")?.Value;
            if (userName is null)
                return RoseliaApiResult.Failure("Please specify username.").ToActionResult(BadRequest);

            var result = await UserManagement.DeleteUser(userName, this.GetUser().Role);
            var response =
                result ? RoseliaApiResult.Succeed("") : RoseliaApiResult.Failure("Permission denied.");

            return response.ToActionResult(Unauthorized);
        }

        [Route("add")]
        [HttpPost]
        [TokenAuthentication(MinimumRoleLevel = 1, RequiredTokenType = TokenTypes.RoseliaTokenType.SuperUser)]
        public async Task<IActionResult> AddUser([FromBody] JsonElement form)
        {
            var userName = form.GetStringOption("username")?.Value;
            var password = form.GetStringOption("password")?.Value;
            var role = form.GetPropertyOption("role")
                .FlatMap(el => el.GetIntOption())?.Value ?? -1;

            if (userName is null || password is null || role < 0)
            {
                return BadRequest();
            }

            if (role >= this.GetUser().Role)
            {
                return Unauthorized();
            }

            _ = await UserManagement.AddUser(userName, password, role);
            return Ok(new {Success = true});
        }

        [HttpPost]
        [Route("change-meta")]
        [TokenAuthentication(MinimumRoleLevel = 0, RequiredTokenType = TokenTypes.RoseliaTokenType.UserCredential)]
        public async Task<IActionResult> ChangeUserMeta([FromBody] UserChangeForm changeForm)
        {
            var result = await UserManagement.MutateUserWithException(this.GetUser().UserName,
                user => { UserChangeModels.Transformer.Assign(changeForm.Changes, user); });

            return RoseliaApiResult.OfResult(result).ToActionResult(Ok);
        }

        [HttpPost]
        [Route("two-step-auth/bind")]
        [TokenAuthentication(MinimumRoleLevel = 0, RequiredTokenType = TokenTypes.RoseliaTokenType.UserCredential)]
        public async Task<IActionResult> BindTwoStepAuth()
        {
            var userName = this.GetUser().UserName;
            var bindResult = await UserManagement.BindTotp(userName);

            return RoseliaApiResult.OfResult(bindResult).ToActionResult(Ok);
        }

        [HttpPost]
        [Route("two-step-auth/remove")]
        [TokenAuthentication(MinimumRoleLevel = 0, RequiredTokenType = TokenTypes.RoseliaTokenType.UserCredential)]
        public async Task<IActionResult> RemoveTwoStepAuth([FromBody] LoginForm code)
        {
            if (string.IsNullOrEmpty(code.Code)) return BadRequest();
            return RoseliaApiResult.OfResult(
                await UserManagement.RemoveTotp(this.GetUser().UserName, code.Code)
            ).ToActionResult(Ok);
        }

        [HttpPost]
        [Route("change-role")]
        [TokenAuthentication(MinimumRoleLevel = 2, RequiredTokenType = TokenTypes.RoseliaTokenType.SuperUser)]
        public async Task<IActionResult> ChangeUserRole([FromBody] UserInfo userInfo)
        {
            // Only username and role is used.
            if (userInfo.Username is null) return BadRequest();

            var result = await UserManagement.ChangeRole(userInfo.Username, userInfo.Role, this.GetUser().Role);
            return RoseliaApiResult.OfResult(result).ToActionResult(Ok);
        }
    }
}