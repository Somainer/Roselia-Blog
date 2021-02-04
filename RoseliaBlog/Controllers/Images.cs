using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.StaticFiles;
using RoseliaBlog.Middleware;
using RoseliaBlog.Models;
using RoseliaBlog.RoseliaCore.Image;
using RoseliaBlog.RoseliaCore.Token;
using RoseliaCore.Image;

namespace RoseliaBlog.Controllers
{
    [Route("/api/pic")]
    public class ImageController : Controller
    {
        [Route("channels")]
        public IActionResult GetImageUploadChannels()
        {
            return RoseliaApiResult.Succeed(
                ImageManagement.ImageManagers.Select(im => new
                {
                    Id = im.Identifier,
                    Name = im.DisplayName,
                    im.Description
                })
            ).ToActionResult();
        }

        [HttpPost]
        [TokenAuthentication(MinimumRoleLevel = 1, RequiredTokenType = TokenTypes.RoseliaTokenType.UserCredential)]
        [Route("{channelName}/upload")]
        public async Task<IActionResult> UploadImageToChannel(string channelName)
        {
            if (!ImageManagement.ImageManagerDict.TryGetValue(channelName, out var channel))
            {
                return NotFound();
            }

            if (HttpContext.Request.Form.Files.FirstOrDefault() is { } file)
            {
                SetImageUrlBuilder(channel);
                var uploaded = 
                    await channel.AddImageAsync(file.OpenReadStream(), file.FileName, Request.Form["to"].FirstOrDefault());

                return RoseliaApiResult.OfResult(uploaded).ToActionResult(Ok);
            }

            return BadRequest();
        }

        [Route("{channelName}/list")]
        public async Task<IActionResult> GetImageListForChannel(string channelName)
        {
            if (!ImageManagement.ImageManagerDict.TryGetValue(channelName, out var channel))
            {
                return NotFound();
            }

            SetImageUrlBuilder(channel);
            var list = await channel.ListImagesAsync();

            return RoseliaApiResult.Succeed(list).ToActionResult();
        }

        [Route("{channelName}/remove")]
        [TokenAuthentication(MinimumRoleLevel = 1, RequiredTokenType = TokenTypes.RoseliaTokenType.UserCredential)]
        public async Task<IActionResult> DeleteImageFromChannel(string channelName, [FromBody] JsonElement form)
        {
            var fileName = 
                (form.GetStringOption("fileName") ?? form.GetStringOption("file_name"))?.Value;
            if (fileName is null)
            {
                return RoseliaApiResult.Failure("Missing filename").ToActionResult(BadRequest);
            }

            if (!ImageManagement.ImageManagerDict.TryGetValue(channelName, out var channel)) return NotFound();
            
            var result = await channel.DeleteImageAsync(fileName);
            return RoseliaApiResult.OfResult(result).ToActionResult(Ok);
        }

        [Route("{fileName}")]
        public IActionResult GetImageFromLocal(string fileName)
        {
            if (ImageManagement.DefaultImageManager is FileSystemImageManager fsi)
            {
                var stream = fsi.GetStream(fileName)?.Value;
                if (stream is not null)
                {
                    if (new FileExtensionContentTypeProvider()
                        .TryGetContentType(fileName, out var contentType))
                    {
                        return File(stream, contentType);
                    }
                }
            }

            return NotFound();
        }

        private void SetImageUrlBuilder(IImageManager manager)
        {
            FileSystemImageManager.TrySetUrlBuilder(manager, path =>
            {
                var ud = new RouteValueDictionary
                {
                    { "fileName", path }
                };
                return Url.Action("GetImageFromLocal", values: ud);
            });
        }
    }
}