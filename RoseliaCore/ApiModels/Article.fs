namespace RoseliaBlog.RoseliaCore.ApiModels

open System
open System.Linq
open RoseliaBlog.RoseliaCore.Database.Models
open RoseliaBlog.RoseliaCore.StructuralCopy


[<CLIMutable>]
type Article = {
    Id: int
    Title: string
    Subtitle: string
    Content: string
    DisplayId: string
    Secret: int
    Hidden: bool
    Catalogs: string array
    Tags: string array
    EnableComment: bool
    DarkTitle: bool
    Img: string
    Created: DateTime
    LastEdit: DateTime
    Author: UserInfo
}

module Article =
    let private ArticleFromPostTransformerBuilder () =
        StructuralCopy.NewBuilder<Post, Article>
        |> StructuralCopy.mapTo <@ fun p -> p.PostId @> <@ fun a -> a.Id @>
        |> StructuralCopy.mapTo <@ fun p -> p.IsCommentEnabled @> <@ fun a -> a.EnableComment @>
        |> StructuralCopy.mapTo <@ fun p -> p.IsTitleDark @> <@ fun a -> a.DarkTitle @>
        |> StructuralCopy.mapTo <@ fun p -> p.Cover @> <@ fun a -> a.Img @>
        |> StructuralCopy.mapTo <@ fun p -> p.CreatedTime @> <@ fun a -> a.Created @>
        |> StructuralCopy.mapTo <@ fun p -> p.LastEditedTime @> <@ fun a -> a.LastEdit @>
        |> StructuralCopy.mapTo <@ fun p -> p.Tags.Select(fun tag -> tag.TagName).ToArray() @> <@ fun a -> a.Tags @>
        |> StructuralCopy.mapTo <@ fun p -> p.Catalogs.Select(fun tag -> tag.CatalogName).ToArray() @> <@ fun a -> a.Catalogs @>
        |> StructuralCopy.mapTo <@ fun p -> UserInfo.UserInfoFromUserTransformer.Copy p.Author @> <@ fun a -> a.Author @>
        |> StructuralCopy.skipNullValue true
        |> StructuralCopy.whenFieldMissing CopierMissingPolicy.Ignore
        
    let ArticleFromPostTransformer = ArticleFromPostTransformerBuilder().Build()
    let BriefArticleFromPostTransformer =
        ArticleFromPostTransformerBuilder()
        |> StructuralCopy.mapToDefault <@ fun p -> p.Content @>
        |> StructuralCopy.build