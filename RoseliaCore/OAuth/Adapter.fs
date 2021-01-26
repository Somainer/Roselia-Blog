namespace RoseliaCore.OAuth

open System.Threading.Tasks

type IOauthAdapter =
    abstract member IsAvailable : unit -> bool

    abstract member GetOAuthUrl : string -> string

    abstract member GetAccessToken : string -> string Task

    abstract member GetUserInformation : string -> string Task
