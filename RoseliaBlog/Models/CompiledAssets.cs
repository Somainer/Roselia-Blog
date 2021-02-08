using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using RoseliaBlog.RoseliaCore;

namespace RoseliaBlog.Models
{
    public class CompiledAssets
    {
        [JsonPropertyName("javaScripts")]
        public List<string> JavaScripts { get; set; }
        [JsonPropertyName("styleSheets")]
        public List<string> StyleSheets { get; set; }
    }

    public static class CompiledAssetsManager
    {
        internal static readonly CompiledAssets Empty =
            new ()
            {
                JavaScripts = new List<string>(),
                StyleSheets = new List<string>()
            };

        internal static CompiledAssets Debug { get; } =
            new()
            {
                JavaScripts = new List<string> {"/static/js/chunk-vendors.js", "/static/js/app.js"},
                StyleSheets = new List<string>()
            };

        public static CompiledAssets Assets { get; private set; } = Empty;
        private static bool IsAssetsInitialized { get; set; } = false;

        private static readonly string ManifestFileName = "required-static-assets.json";

        public static void Read(string frontendPath)
        {
            if (IsAssetsInitialized) return;
            var filePath = Path.Combine(frontendPath, ManifestFileName);
            if (File.Exists(filePath))
            {
                try
                {
                    var text = File.ReadAllText(filePath);
                    Assets = JsonSerializer.Deserialize<CompiledAssets>(text);
                    System.Diagnostics.Debug.Assert(Assets is not null);
                    Assets.JavaScripts = AddUrlPrefix(Assets.JavaScripts).ToList();
                    Assets.StyleSheets = AddUrlPrefix(Assets.StyleSheets).ToList();
                    IsAssetsInitialized = true;
                }
                catch (Exception ex) when (ex is IOException or JsonException)
                {
                    Assets.GetLogger()
                        .LogError("Error on reading compiled assets: {Message}", ex.ToString());
                }
            }
        }

        private static IEnumerable<string> AddUrlPrefix(IEnumerable<string> source) =>
            source.Select(url => $"{Config.Config.UrlPrefix}/{url}");

        public static void UseDebug()
        {
            Assets = Debug;
            IsAssetsInitialized = true;
        }
    }
}
