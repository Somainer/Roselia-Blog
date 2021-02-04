namespace RoseliaBlog.RoseliaCore.ApiModels

open System
open RoseliaBlog.RoseliaCore
open RoseliaBlog.RoseliaCore.Database.Models
open RoseliaBlog.RoseliaCore.StructuralCopy

[<CLIMutable>]
type CommentInfo = {
    Id: int
    ToArticle: int
    ReplyTo: int
    Content: string
    Nickname: string
    Author: UserInfo
    CreatedAt: DateTime
}

module Comment =
    let CommentInfoTransformer =
        StructuralCopy.NewBuilder<Comment, CommentInfo>
        |> StructuralCopy.mapTo <@ fun c -> c.CommentId @> <@ fun c -> c.Id @>
        |> StructuralCopy.mapTo <@ fun c -> c.ReplyTo.GetValueOrDefault 0 @> <@ fun c -> c.ReplyTo @>
        |> StructuralCopy.mapTo <@ fun c -> c.PostId @> <@ fun c -> c.ToArticle @>
        |> StructuralCopy.mapTo <@ fun c -> if isNull (box c.Author) then Util.Default else UserInfo.UserInfoFromUserTransformer.Copy c.Author @> <@ fun c -> c.Author @>
        |> StructuralCopy.build
