namespace RoseliaBlog.RoseliaCore.Token

open System.Security.Claims

type TokenModel = {
    ExpireSeconds: int64
    Claims: Claim array
    SecurityAlgorithm: string
}
