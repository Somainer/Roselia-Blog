using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using RoseliaBlog.Middleware;
using RoseliaBlog.Models;
using RoseliaBlog.RoseliaCore;
using RoseliaBlog.RoseliaCore.Token;

namespace RoseliaBlog.Controllers
{
    [Route("/api/system")]
    public class SystemController : Controller
    {
        [Route("refresh-salt")]
        [MasterUserAuthentication(RequiredTokenType = TokenTypes.RoseliaTokenType.UserCredential)]
        public IActionResult RefreshSalt()
        {
            RoseliaCore.Config.RefreshSalt();
            return RoseliaApiResult.Succeed("").ToActionResult();
        }

        [Route("basic-info")]
        [MasterUserAuthentication(RequiredTokenType = TokenTypes.RoseliaTokenType.UserCredential)]
        public IActionResult GetBasicSystemInfo()
        {
            return RoseliaApiResult.Succeed(new
            {
                Os = PlatformInfo.CurrentPlatformInfo.Value,
                Cpu = PlatformInfo.CurrentCpuInfo.Value
            }).ToActionResult();
        }

        [Route("dynamic-info")]
        [MasterUserAuthentication(RequiredTokenType = TokenTypes.RoseliaTokenType.UserCredential)]
        public IActionResult GetDynamicSystemInfo()
        {
            return RoseliaApiResult.Succeed(new
            {
                Cpu = PlatformInfo.CpuUsage.GetUsage,
                Memory = PlatformInfo.MemoryUsage.GetUsage
            }).ToActionResult();
        }
    }
}
