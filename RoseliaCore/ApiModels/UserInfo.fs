namespace RoseliaBlog.RoseliaCore.ApiModels

open RoseliaBlog.RoseliaCore.Database.Models
open RoseliaBlog.RoseliaCore.StructuralCopy

type UserInfo = {
    Id: int
    Username: string
    Role: int
    Nickname: string
    Mail: string
    Avatar: string
}

type FullUserInfo = {
    Id: int
    Username: string
    Role: int
    Nickname: string
    Mail: string
    Avatar: string
    Totp: bool
    Banner: string
    Motto: string
}

module UserInfo =
    let UserInfoFromUserTransformer =
        StructuralCopy.NewBuilder<User, UserInfo>
        |> StructuralCopy.mapTo <@ fun u -> u.UserId @> <@ fun u -> u.Id @>
        |> StructuralCopy.build
    
    let FullUserInfoFromUserTransformer =
        StructuralCopy.NewBuilder<User, FullUserInfo>
        |> StructuralCopy.mapTo <@ fun u -> u.UserId @> <@ fun u -> u.Id @>
        |> StructuralCopy.mapTo <@ fun u -> u.BannerImage @> <@ fun u -> u.Banner @>
        |> StructuralCopy.mapTo <@ fun u -> not (System.String.IsNullOrEmpty u.TotpSecret) @> <@ fun u -> u.Totp @>
        |> StructuralCopy.build
