namespace RoseliaCore.Image

open System.Net.Http
open System.Net.Http.Headers
open System.Text.Json
open FSharp.Control.Tasks.V2
open RoseliaBlog.RoseliaCore.Image
open RoseliaBlog.RoseliaCore.Util

type SmmsImageManagerBase(anonymous) =
    static let apiBase = "https://sm.ms/api/v2/"
    static let TokenKeyInConfig = "SM_MS_API_TOKEN"
    static let BaseIdentifier = "smms"
    static let BaseDisplayName = "sm.ms"
    static let BaseDescription = "Upload to sm.ms hosting service."
    
    let apiKey: string option =
        if anonymous then None else
            ImportFromConfig TokenKeyInConfig
            |> Option.filter (System.String.IsNullOrEmpty >> not)
    
    let ApiToken =
        apiKey
        |> Option.defaultValue ""
        
    let GetClient () =
        let client = new HttpClient()
        client.DefaultRequestHeaders.TryAddWithoutValidation(
            nameof(client.DefaultRequestHeaders.Authorization),
            ApiToken
        ) |> ignore
        client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0")
        client
    
    interface IImageManager with
        member this.Identifier =
            if anonymous then $"{BaseIdentifier}-{nameof anonymous}" else BaseIdentifier
        member this.DisplayName =
            if anonymous then $"{BaseDisplayName}-{nameof anonymous}" else BaseDisplayName
        member this.Description =
            if anonymous then $"{BaseDescription} (via anonymous account)" else BaseDescription
        member this.IsDefault = false
        member this.AddImageAsync image fileName convert =
            let url = $"{apiBase}upload"
            task {
                use client = GetClient()
                use message = new MultipartFormDataContent()
                message.Add(new StreamContent(image), "smfile", fileName)
                    
                let! response = client.PostAsync(url, message)
                let! result = response.GetJsonAsync<JsonElement>()
                if result.GetProperty("success").GetBoolean() then
                    let data = result.GetProperty "data"
                    return Ok {
                        Url = data.GetProperty("url").GetString()
                        DeleteKey = data.GetProperty("delete").GetString()
                        FileName = data.GetProperty("filename").GetString()
                        Channel = (this :> IImageManager).Identifier
                    }
                else return Error (result.GetProperty("message").GetString())
            }
        member this.DeleteImageAsync deleteKey =
            task {
                let prefix = "https://sm.ms/delete/"
                let url =
                    if deleteKey.StartsWith prefix then deleteKey
                    else $"{prefix}{deleteKey}"
                use client = GetClient()
                
                let! response = client.GetAsync url
                let! text = response.Content.ReadAsStringAsync()
                
                return
                    if text.Contains "Oops!" then
                        Error "File does not exist or is deleted."
                    else Ok ()
            }
            
        member this.IsEnabled() = anonymous || apiKey.IsSome
        member this.ListImagesAsync() = 
            task {
                use client = GetClient()
                let url =
                    match apiKey with
                    | Some _ -> $"{apiBase}upload_history"
                    | None -> $"{apiBase}history"
                    
                let! response = client.GetAsync(url)
                let! result = response.GetJsonAsync<JsonElement>()
                if result.GetProperty("success").GetBoolean() then
                    let images = seq {
                        for data in result.GetProperty("data").EnumerateArray() do
                            yield {
                                Url = data.GetProperty("url").GetString()
                                DeleteKey = data.GetProperty("delete").GetString()
                                FileName = data.GetProperty("filename").GetString()
                                Channel = (this :> IImageManager).Identifier
                            }
                    }
                    return images
                else return Seq.empty
            }

type SmmsImageManager() =
    inherit SmmsImageManagerBase(false)

type AnonymousSmmsImageManager() =
    inherit SmmsImageManagerBase(true)
