namespace RoseliaCore.Database.Models.Relations

open System.ComponentModel.DataAnnotations.Schema
open Microsoft.EntityFrameworkCore
open RoseliaBlog.RoseliaCore.Database.Models
open RoseliaCore.Database.Models

[<CLIMutable>]
[<Table("post_catalogs")>]
[<Keyless>]
type PostCatalog = {
    [<Column("post_id")>]
    PostId: int
    Post: Post
    
    [<Column("catalog_id")>]
    CatalogId: int
    Catalog: Catalog
}

[<CLIMutable>]
[<Table("post_tags")>]
[<Keyless>]
type PostTag = {
    [<Column("post_id")>]
    PostId: int
    Post: Post
    
    [<Column("tag_id")>]
    TagId: int
    Tag: Tag
}
