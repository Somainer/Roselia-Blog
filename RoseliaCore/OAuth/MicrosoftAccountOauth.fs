namespace RoseliaBlog.RoseliaCore.OAuth

open System
open System.Collections.Generic
open System.Net.Http
open System.Net.Http.Headers
open System.Text.Json
open System.Web
open FSharp.Control.Tasks.V2
open RoseliaBlog.RoseliaCore
open RoseliaBlog.RoseliaCore.Util

type MicrosoftAccountOauth() =
    let clientIdKey = "MICROSOFT_CLIENT_ID"
    let clientSecretKey = "MICROSOFT_CLIENT_SECRET"
    
    let clientId =
       Config.GetSecret<string> clientIdKey
       |> Option.defaultValue null
    
    let clientSecret =
        Config.GetSecret<string> clientSecretKey
        |> Option.defaultValue null
    
    interface IOauthAdapter with
        member this.Name = "microsoft"
        member this.IsAvailable() =
            StringIsNotNullOrEmpty clientId
                && StringIsNotNullOrEmpty clientSecret
        member this.GetOAuthUrl request =
            "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id={0}&nonce={1}&scope=openid+profile+User.Read&response_type=code&redirect_uri={2}&state={3}"
            |> fun s ->
                String.Format(
                    s,
                    clientId, DateTime.Now.Ticks,
                    // Using callback attribute because msa oauth requires callback url identical to registered endpoints.
                    request.Callback,
                    // So additional information should be stored in state.
                    request.State
                    |> JsonSerializer.Serialize
                    |> HttpUtility.UrlEncode
                )
        member this.GetAccessToken code request =
            task {
                use client = new HttpClient()
                client.DefaultRequestHeaders.Accept.Add(MediaTypeWithQualityHeaderValue("application/json"))
                use form = new FormUrlEncodedContent([
                    KeyValuePair("client_id", clientId)
                    KeyValuePair("client_secret", clientSecret)
                    KeyValuePair(nameof code, code)
                    KeyValuePair("grant_type", "authorization_code")
                    // Using callback because this api also requires callback identical to login url.
                    KeyValuePair("redirect_uri", request.Callback)
                ])
                
                let! response = client.PostAsync("https://login.microsoftonline.com/common/oauth2/v2.0/token", form)
                let! result = response.EnsureSuccessStatusCode().GetJsonAsync<JsonElement>()
                
                return result.GetProperty("access_token").GetString()
            }
        member this.GetUserInformation token =
            task {
                use client = new HttpClient()
                client.DefaultRequestHeaders.Authorization
                    <- AuthenticationHeaderValue("Bearer", token)
                
                let! response = client.GetAsync "https://graph.microsoft.com/v1.0/me/"
                
                let! result = response.EnsureSuccessStatusCode().GetJsonAsync<JsonElement>()
                
                return result.GetProperty("id").GetString()
            }
