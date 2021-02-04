namespace RoseliaBlog.RoseliaCore.OAuth

open System.Collections.Generic
open System.Net.Http
open System.Net.Http.Headers
open System.Text.Json
open System.Web
open FSharp.Control.Tasks.V2
open RoseliaBlog.RoseliaCore
open RoseliaBlog.RoseliaCore.Util

type GitHubOauthAdapter() =
    let clientSecretKey = "GITHUB_CLIENT_SECRET"
    let clientIdKey = "GITHUB_CLIENT_ID"
    
    let clientSecret =
        Config.GetSecret<string> clientSecretKey
        |> Option.defaultValue null
    
    let clientId =
        Config.GetSecret<string> clientIdKey
        |> Option.defaultValue null
        
    interface IOauthAdapter with
        member this.Name = "github"
        member this.IsAvailable() =
            Util.StringIsNotNullOrEmpty clientId
                && Util.StringIsNotNullOrEmpty clientSecret
        member this.GetOAuthUrl request =
            $"https://github.com/login/oauth/authorize?client_id={clientId}&scope=user:email&redirect_uri={HttpUtility.UrlEncode request.Redirection}"
        member this.GetAccessToken code _ =
            task {
                use client = new HttpClient()
                client.DefaultRequestHeaders.Accept.Add(MediaTypeWithQualityHeaderValue("application/json"))
                use form = new FormUrlEncodedContent([
                    KeyValuePair("client_id", clientId)
                    KeyValuePair("client_secret", clientSecret)
                    KeyValuePair(nameof code, code)
                ])
                
                let! response = client.PostAsync("https://github.com/login/oauth/access_token", form)
                let! result = response.EnsureSuccessStatusCode().GetJsonAsync<JsonElement>()
                
                return result.GetProperty("access_token").GetString()
            }
            
        member this.GetUserInformation token =
            task {
                use client = new HttpClient()
                client.DefaultRequestHeaders.Authorization
                    <- AuthenticationHeaderValue("token", token)
                
                let! response = client.GetAsync "https://api.github.com/user"
                let! result = response.EnsureSuccessStatusCode().GetJsonAsync<JsonElement>()
                
                return result.GetProperty("login").GetString()
            }
