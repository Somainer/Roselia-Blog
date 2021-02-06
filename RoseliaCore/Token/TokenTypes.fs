module rec RoseliaBlog.RoseliaCore.Token.TokenTypes

open System.Security.Claims
open Microsoft.IdentityModel.Tokens

type RoseliaTokenType =
    | UserCredential = 0
    | Refresh = 2
    | SuperUser = 4
    
let GetExpirationMinutes this =
    match this with
    | RoseliaTokenType.SuperUser -> 15 // SU token expires in 15 minutes.
    | RoseliaTokenType.Refresh -> 60 * 24 // Refresh token expires in 1 day.
    | RoseliaTokenType.UserCredential | _ -> 60 // Otherwise expires in 60 minutes.

// Comparing tokens makes no sense. 
[<NoComparison>]
[<NoEquality>]
type RoseliaUserBase = {
    Id: int
    UserName: string
    UserRole: int
} with
    static member op_Implicit (source : RoseliaUserToken) : RoseliaUserBase = {
        Id = source.Id
        UserName = source.UserName
        UserRole = source.UserRole
    }

type RoseliaUserToken = {
    Id: int
    UserName: string
    UserRole: int
    TokenType: RoseliaTokenType
} with
    member this.IsUserCredential =
        this.TokenType = RoseliaTokenType.UserCredential
    member this.IsRefreshToken =
        this.TokenType = RoseliaTokenType.Refresh
    member this.IsSuperUserToken =
        this.TokenType = RoseliaTokenType.SuperUser

let private MakeToken tokenType (tokenBase : RoseliaUserBase) = {
    Id = tokenBase.Id
    UserName = tokenBase.UserName
    UserRole = tokenBase.UserRole
    TokenType = tokenType
}

// Ita expansion to create a method instead of a delegate.
let MakeUserCredential info = MakeToken RoseliaTokenType.UserCredential info
let MakeRefreshToken info = MakeToken RoseliaTokenType.Refresh info
let MakeSuperUserToken info = MakeToken RoseliaTokenType.SuperUser info

let ToModel token : TokenModel = {
    ExpireSeconds =
        token.TokenType
        |> GetExpirationMinutes
        |> (*) 60
        |> int64
    Claims = [|
        Claim(nameof(token.Id), token.Id.ToString())
        Claim(nameof(token.UserName), token.UserName)
        Claim(nameof(token.UserRole), token.UserRole.ToString())
        Claim(nameof(token.TokenType), token.TokenType.ToString())
    |]
    SecurityAlgorithm = SecurityAlgorithms.HmacSha256
}
