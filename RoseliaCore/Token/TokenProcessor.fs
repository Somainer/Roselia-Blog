module RoseliaBlog.RoseliaCore.Token.TokenProcessor

open System
open System.IdentityModel.Tokens.Jwt
open System.Security.Claims
open System.Text
open Microsoft.IdentityModel.Tokens

open RoseliaBlog.RoseliaCore
open RoseliaBlog.RoseliaCore.Config
open RoseliaBlog.RoseliaCore.Token.TokenTypes
open Util

let private GetSecurityKey () =
    $"{Config.Secrets.AppKey}{Config.Secrets.AppSecret}{Config.Secrets.AppSalt}"
    |> Encoding.UTF8.GetBytes
    |> SymmetricSecurityKey
    
let private GetTokenValidationParameters () =
    let parameters = TokenValidationParameters()
    parameters.IssuerSigningKey <- GetSecurityKey()
    parameters.ValidateAudience <- false
    parameters.ValidateIssuer <- false
    parameters

let internal IssueToken (model : TokenModel) =
    let descriptor = SecurityTokenDescriptor()
    descriptor.Expires <- DateTime.UtcNow.AddSeconds(model.ExpireSeconds |> float)
    descriptor.Subject <- ClaimsIdentity(model.Claims)
    descriptor.SigningCredentials <-
        SigningCredentials(GetSecurityKey(), model.SecurityAlgorithm)

    let handler = JwtSecurityTokenHandler()
    
    descriptor
    |> handler.CreateEncodedJwt

let internal GetModelFromToken (token : string) =
    if String.IsNullOrEmpty token then None
    else
        let parameters = GetTokenValidationParameters()
        let handler = JwtSecurityTokenHandler()
        try
            let (principle, _validatedToken) = handler.ValidateToken(token, parameters)
            principle.Claims
            |> Seq.map (fun claim -> (claim.Type, claim.Value))
            |> Map.ofSeq
            |> Some
        with
        | _ -> None

// This exists because F# nameof operator does not support accessing
// non static fields.
let private dummyToken = {
    RoseliaUserToken.Id = 0
    UserName = String.Empty
    UserRole = 0
    TokenType = RoseliaTokenType.UserCredential
}

let ValidateRoseliaToken token =
    let GetTokenFromClaim (claims : Map<string, string>) =
        optional {
            let! userName =
                claims
                |> Map.tryFind (nameof dummyToken.UserName)
            let! id =
                claims
                |> Map.tryFind (nameof dummyToken.Id)
                |> Option.map Convert.ToInt32
            
            let! userRole =
                claims
                |> Map.tryFind (nameof dummyToken.UserRole)
                |> Option.map Convert.ToInt32
            let! tokenType =
                claims
                |> Map.tryFind (nameof dummyToken.TokenType)
                |> Option.map RoseliaTokenType.Parse
            
            return {
                Id = id
                UserName = userName
                UserRole = userRole
                TokenType = tokenType
            }
        }
    let TryGetTokenFromClaims claims =
        try GetTokenFromClaim claims
        with _ -> None
    
    token
    |> GetModelFromToken
    |> Option.bind TryGetTokenFromClaims

let CreateToken token =
    token
    |> TokenTypes.ToModel
    |> IssueToken
