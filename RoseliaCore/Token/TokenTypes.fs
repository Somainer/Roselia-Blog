module RoseliaBlog.RoseliaCore.Token.TokenTypes

open System.Text.Json.Serialization

[<JsonFSharpConverter>]
type RoseliaTokenType =
    | UserCredential
    | Refresh
    | SuperUser
    | CustomToken of string

type IRoseliaToken =
    abstract member TokenRole : RoseliaTokenType

type UserCredentialToken = {
    Id: int
    UserName: string
    UserRole: int
} with
    member this.TokenRole = RoseliaTokenType.UserCredential

type UserRefreshToken = {
    Id: int
    UserName: string
    UserRole: int
} with
    interface IRoseliaToken with
        member this.TokenRole = RoseliaTokenType.Refresh

type SuperUserToken = {
    Id: int
    UserName: string
    UserRole: int
} with
    interface IRoseliaToken with
        member this.TokenRole = RoseliaTokenType.SuperUser
