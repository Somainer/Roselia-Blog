module RoseliaBlog.RoseliaCore.Managements.OtpManagement

open System
open System.Collections.Specialized
open OtpNet
open RoseliaBlog.RoseliaCore
open RoseliaBlog.RoseliaCore.ApiModels

let private MapToQuery (map : Map<string, string>) =
    let coll = NameValueCollection map.Count
    for k in map do
        coll.Add(k.Key, k.Value)
    coll.ToString()
    
let GetProvisioningUri name secret issuer =
    let uriBuilder = UriBuilder()
    uriBuilder.Scheme <- "otpauth"
    let label = $"{Uri.EscapeUriString name}:{Uri.EscapeUriString issuer}"
    
    uriBuilder.Query <-
        Map.empty
        |> Map.add "secret" secret
        |> Map.add "issuer" issuer
        |> MapToQuery
    uriBuilder.Path <- $"/totp/{label}"
    
    uriBuilder.ToString()

let RandomSecret () =
    let key = KeyGeneration.GenerateRandomKey 20
    let base32String = Base32Encoding.ToString key
    
    (key, base32String)

let GenerateRandom name =
    let (key, secret) = RandomSecret ()
    let totp = Totp key
    let url = GetProvisioningUri name secret Config.Config.Title
    
    {
        TotpBindResult.Code = secret
        Url = url
        NextCode = totp.ComputeTotp()
    }

let VerifyCode secret code =
    let totp =
        secret
        |> Base32Encoding.ToBytes
        |> Totp
    
    totp.VerifyTotp(code, ref 0L)
    