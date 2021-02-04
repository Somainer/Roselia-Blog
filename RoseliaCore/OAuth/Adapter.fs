namespace RoseliaBlog.RoseliaCore.OAuth

open System.Threading.Tasks
open RoseliaBlog.RoseliaCore

[<CLIMutable>]
type OauthRequest = {
    Redirection: string
    Base: string
    State: obj
    Callback: string
}

type IOauthAdapter =
    abstract Name : string
    
    abstract member IsAvailable : unit -> bool

    abstract member GetOAuthUrl : OauthRequest -> string

    abstract member GetAccessToken : string -> OauthRequest -> string Task

    abstract member GetUserInformation : string -> string Task

module OAuthAdapter =
    let DiscoverAdapters() =
        Util.DiscoverImplementations<IOauthAdapter>()
        |> Seq.filter (fun adapter -> adapter.IsAvailable())
    
    let Adapters = DiscoverAdapters()
    let AdaptersDict =
        Adapters
        |> Seq.map (fun a -> a.Name, a)
        |> Map.ofSeq
