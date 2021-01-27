namespace RoseliaBlog.RoseliaCore.Database.Models.Relations

open System.ComponentModel.DataAnnotations.Schema
open RoseliaBlog.RoseliaCore.Database.Models

[<CLIMutable>]
[<Table("post_catalogs")>]
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
type PostTag = {
    [<Column("post_id")>]
    PostId: int
    Post: Post
    
    [<Column("tag_id")>]
    TagId: int
    Tag: Tag
}
