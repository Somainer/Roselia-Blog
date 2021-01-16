module RoseliaBlog.RoseliaCore.Token.TokenModel

open System.Security.Claims

type TokenModel = {
    ExpireSeconds: int64
    Claims: Claim array
    SecurityAlgorithm: string
}
