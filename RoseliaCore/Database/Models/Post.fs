namespace rec RoseliaBlog.RoseliaCore.Database.Models

open System
open System.Collections.Generic
open System.ComponentModel
open System.ComponentModel.DataAnnotations
open System.ComponentModel.DataAnnotations.Schema
open System.Text.Json.Serialization
open System.Text.RegularExpressions
open Microsoft.EntityFrameworkCore

[<CLIMutable>]
[<Table("post")>]
[<Index(propertyName="DisplayId", IsUnique = true)>]
type Post = {
    [<Key>]
    [<Column("post_id")>]
    mutable PostId: int
    
    [<Column("display_id")>]
    mutable DisplayId: string
    
    [<Column("title")>]
    mutable Title: string
    
    [<Column("subtitle")>]
    [<DefaultValue("")>]
    mutable Subtitle: string
    
    [<Column("content")>]
    mutable Content: string
    
    [<Column("md_content")>]
    mutable MarkdownContent: string
    
    [<Column("create_time")>]
    [<DatabaseGenerated(DatabaseGeneratedOption.Identity)>]
    [<DataType(DataType.DateTime)>]
    CreatedTime: DateTime
    
    [<Column("last_edit_time")>]
    [<DatabaseGenerated(DatabaseGeneratedOption.Computed)>]
    [<DataType(DataType.DateTime)>]
    LastEditedTime: DateTime
    
    [<Column("owner")>]
    Owner: int
    
    [<ForeignKey("Owner")>]
    Author: User
    
    [<Column("cover")>]
    mutable Cover: string
    
    [<Column("secret")>]
    [<DefaultValue(0)>]
    mutable Secret: int
    
    [<Column("hidden")>]
    [<DefaultValue(false)>]
    mutable Hidden: bool
    
    [<Column("dark_title")>]
    [<DefaultValue(false)>]
    mutable IsTitleDark: bool
    
    [<Column("enable_comment")>]
    [<DefaultValue(true)>]
    [<JsonPropertyName("enable_comment")>]
    mutable IsCommentEnabled: bool
    
    Tags: Tag ICollection
    Catalogs: Catalog ICollection
}

[<CLIMutable>]
[<Table("catalog")>]
type Catalog = {
    [<Key; Column("catalog_id")>]
    CatalogId: int
    
    [<Column("catalog_eternal_link")>]
    CatalogEternalLink: string
    
    [<Column("catalog_name")>]
    CatalogName: string
    
    Posts: Post ICollection
}

[<CLIMutable>]
[<Table("tag")>]
[<Index(propertyName="TagName", IsUnique = true)>]
type Tag = {
    [<Key; Column("tag_id")>]
    TagId: int
    
    [<Column("tag_name"); MaxLength(64)>]
    TagName: string
    
    Posts: Post ICollection
}

module Tag =
    let GetDisplayedName name =
        Regex.Replace(name, @"\s+", "-")
