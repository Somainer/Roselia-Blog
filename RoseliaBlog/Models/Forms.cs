using System.Text.Json.Serialization;
using RoseliaBlog.RoseliaCore.ApiModels;
using RoseliaBlog.RoseliaCore.Database.Models;
using RoseliaBlog.RoseliaCore.StructuralCopy;

namespace RoseliaBlog.Models.Forms
{
    public class LoginForm
    {
        public string UserName { get; set; }
        public string Password { get; set; }
        public string Code { get; set; }
    }

    public class PostBasicForm
    {
        public int PostId { get; set; }
    }

    public class PostAddOrEditForm : PostBasicForm
    {
        public Article Data { get; set; }
        public bool Markdown { get; set; }
    }

    public class UserChangeModels
    {
        [JsonPropertyName("nickname")]
        public string Nickname { get; set; }
        public string Motto { get; set; }
        public string Avatar { get; set; }
        public string Banner { get; set; }

        public static readonly Copier<UserChangeModels, User> Transformer =
            StructuralCopy.NewBuilder<UserChangeModels, User>()
                .MapTo(u => u.Banner, u => u.BannerImage)
                .SkipNullValues(true)
                .WhenFieldMissing(CopierMissingPolicy.Ignore)
                .Build();
    }

    public class UserChangeForm
    {
        public UserChangeModels Changes { get; set; }
    }

    public class OauthLoginState
    {
        public string Base { get; set; }
        public string Redirect { get; set; }
        
        public string Type { get; set; }
    }
}
