#nullable enable
using System.Security.Claims;
using System.Security.Principal;
using System.Threading.Tasks;
using Microsoft.FSharp.Core;
using RoseliaBlog.RoseliaCore.Database.Models;
using RoseliaBlog.RoseliaCore.Managements;
using static RoseliaBlog.RoseliaCore.Token.TokenTypes;

namespace RoseliaBlog.Models
{
    public class RoseliaUserPrincipal : ClaimsPrincipal
    {
        public RoseliaUserToken? UserToken { get; }
        public override IIdentity Identity { get; }

        public RoseliaUserPrincipal(RoseliaUserToken? token)
        {
            this.UserToken = token;
            this.Identity = 
                token is null ? new ClaimsIdentity() : new ClaimsIdentity(ToModel(token).Claims, "Token");
        }

        public int Role => UserToken?.UserRole ?? -1;
        public int PermissionLevel => Role + 1;
        public bool IsRoleGreaterThan(int role) => Role >= role;
        public string? UserName => UserToken?.UserName;
        public bool IsAuthenticated => UserToken is not null;

        public async Task<FSharpOption<User>> GetUnderlyingUser()
        {
            if (this.IsAuthenticated)
            {
                return await UserManagement.FindUserByUsername(this.UserName);
            }
            
            return FSharpOption<User>.None;
        }
    }
}
