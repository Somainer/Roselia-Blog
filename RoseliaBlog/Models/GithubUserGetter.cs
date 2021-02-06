#nullable enable
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using RoseliaBlog.RoseliaCore;
using static RoseliaBlog.RoseliaCore.Util;
using RoseliaBlog.RoseliaCore.ApiModels;

namespace RoseliaBlog.Models
{
    public class GithubUserGetter
    {
        private static readonly Lazy<GithubUserGetter> Instance = new ();
        private static readonly string ClientIdKey = "GITHUB_CLIENT_ID";
        private static readonly string ClientSecretKey = "GITHUB_CLIENT_SECRET";

        public static Task<UserInfo> GetUser(string userName) =>
            Instance.Value.GetUserInfo(userName);

        private readonly string? _clientId = Config.GetSecret<string>(ClientIdKey)?.Value;
        private readonly string? _clientSecret = Config.GetSecret<string>(ClientSecretKey)?.Value;

        private AuthenticationHeaderValue? GetAuthenticationHeader()
        {
            if (string.IsNullOrEmpty(_clientId) 
                || string.IsNullOrEmpty(_clientSecret)) return null;
            
            var authString = $"{_clientId}:{_clientSecret}";
            return new AuthenticationHeaderValue(
                "Basic", 
                Convert.ToBase64String(Encoding.ASCII.GetBytes(authString)));
        }
        
        private IDictionary<string, UserInfo> _cache = 
            new ConcurrentDictionary<string, UserInfo>(StringComparer.OrdinalIgnoreCase);

        private async Task<UserInfo?> FetchUserInfo(string userName)
        {
            using var client = new HttpClient();
            client.DefaultRequestHeaders.Authorization = GetAuthenticationHeader();
            client.DefaultRequestHeaders.ConnectionClose = true;
            client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0");

            var response =
                await client.GetAsync($"https://api.github.com/users/{userName}");
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }
            
            var result = await HttpUtil.GetJsonAsync<JsonElement>(response);

            return new UserInfo
            {
                Id = result.GetProperty("id").GetInt32(),
                Avatar = result.GetProperty("avatar_url").GetString(),
                Username = result.GetProperty("login").GetString(),
                Nickname = result.GetProperty("name").GetString()
            };
        }

        public async Task<UserInfo> GetUserInfo(string userName)
        {
            if (_cache.TryGetValue(userName, out var userInfo))
            {
                return userInfo;
            }

            var user = await FetchUserInfo(userName);

            if (user is null)
                return new()
                {
                    Id = 0,
                    Username = userName,
                    Nickname = userName,
                    Avatar = ""
                };
            
            _cache.Add(userName, user);
            return user;
        }
    }
}