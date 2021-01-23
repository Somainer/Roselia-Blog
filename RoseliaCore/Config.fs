namespace RoseliaBlog.RoseliaCore

open System.Collections.Generic
open System.Runtime.CompilerServices

open Tomlyn

type RoseliaSecrets = {
    AppKey: string
    AppSecret: string
    mutable AppSalt: string
    DataBaseConnectionString: string
    SecretStorage: IReadOnlyDictionary<string, obj>
} with
    member this.GetSecret<'a> key : 'a option =
        Util.tryGetFromDictWithType key this.SecretStorage

type RoseliaConfig = {
    Title: string
    Motto: string
    Link: string
    Secrets: RoseliaSecrets
    ConfigStorage: IReadOnlyDictionary<string, obj>
} with
    member this.GetConfig<'a> key : 'a option =
        Util.tryGetFromDictWithType key this.ConfigStorage

module Config =
    let GenKey () =
        use rng = System.Security.Cryptography.RandomNumberGenerator.Create()
        let bytes = Array.zeroCreate 24
        rng.GetNonZeroBytes bytes
        bytes
        |> Seq.map (sprintf "%02x")
        |> String.concat ""

    let internal readConfig (config: string) (secret: string) =
        let configNode =
            Toml.Parse(config).ToModel()
            |> Util.mapFromDict
        let secretNode =
            Toml.Parse(secret).ToModel()
            |> Util.mapFromDict
        
        let title = configNode.["title"] :?> string
        let motto = configNode.["motto"] :?> string
        let link = configNode.["link"] :?> string
        
        let inline nonEmpty s =
            s |> System.String.IsNullOrEmpty |> not
        let getOrGen key =
            secretNode
            |> Map.tryFind key
            |> Option.map (fun x -> downcast x)
            |> Option.filter nonEmpty
            |> Option.defaultWith GenKey
        
        let appKey = getOrGen "appKey"
        let appSecret = getOrGen "appSecret"
        let appSalt = getOrGen "appSalt"
        let connectionString = secretNode.["dbConnectionString"] :?> string
        
        {
            Title = title
            Motto = motto
            Link = link
            ConfigStorage = configNode
            Secrets = {
                AppKey = appKey
                AppSecret = appSecret
                AppSalt = appSalt
                DataBaseConnectionString = connectionString
                SecretStorage = secretNode
            }
        }

    let LoadDefaultConfig () =
        let configContent = System.IO.File.ReadAllText "config.toml"
        let secretContent = System.IO.File.ReadAllText "secrets.toml"
        
        readConfig configContent secretContent

    let Config = LoadDefaultConfig()

    let RefreshSalt () =
        Config.Secrets.AppSalt <- GenKey()

    [<MethodImpl(MethodImplOptions.AggressiveInlining)>]
    let GetConfig<'a> key : 'a option =
        Config.GetConfig key

    [<MethodImpl(MethodImplOptions.AggressiveInlining)>]
    let GetSecret<'a> key : 'a option =
        Config.Secrets.GetSecret key
   