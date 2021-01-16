namespace RoseliaBlog.RoseliaCore.Database.Models

open System
open System.ComponentModel
open System.ComponentModel.DataAnnotations
open System.ComponentModel.DataAnnotations.Schema
open System.Text.Json.Serialization
open Microsoft.EntityFrameworkCore

[<CLIMutable>]
[<Index("display_id", IsUnique = true)>]
type Post = {
    [<Key>]
    [<Column("post_id")>]
    PostId: int
    
    [<Column("display_id")>]
    DisplayId: string
    
    [<Column("title")>]
    Title: string
    
    [<Column("subtitle")>]
    [<DefaultValue("")>]
    Subtitle: string
    
    [<Column("content")>]
    Content: string
    
    [<Column("md_content")>]
    MarkdownContent: string
    
    [<Column("create_time")>]
    [<DatabaseGenerated(DatabaseGeneratedOption.Identity)>]
    CreatedTime: DateTime
    
    [<Column("last_edit_time")>]
    [<DatabaseGenerated(DatabaseGeneratedOption.Computed)>]
    LastEditedTime: DateTime
    
    [<Column("owner")>]
    [<ForeignKey("user.user_id")>]
    Owner: string
    
    [<Column("cover")>]
    Cover: string
    
    [<Column("secret")>]
    [<DefaultValue(0)>]
    Secret: int
    
    [<Column("hidden")>]
    [<DefaultValue(false)>]
    Hidden: bool
    
    [<Column("dark_title")>]
    [<DefaultValue(false)>]
    IsTitleDark: bool
    
    [<Column("enable_comment")>]
    [<DefaultValue(true)>]
    [<JsonPropertyName("enable_comment")>]
    IsCommentEnabled: bool
}
