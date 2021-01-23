namespace RoseliaBlog.RoseliaCore.Database.Models

open System
open System.ComponentModel.DataAnnotations
open System.ComponentModel.DataAnnotations.Schema
open RoseliaBlog.RoseliaCore.Database.Models

[<CLIMutable>]
[<Table("comment")>]
type Comment = {
    [<Column("comment_id")>]
    [<Key>]
    CommentId: int
    
    [<Column("to_article")>]
    PostId: int
    
    [<ForeignKey("PostId")>]
    ToArticle: Post
    
    [<Column("reply_to")>]
    ReplyTo: int Nullable
    
    [<ForeignKey("ReplyTo")>]
    ReplyToComment: Comment
    
    [<Column("content")>]
    [<Required>]
    Content: string
    
    [<Column("nickname")>]
    [<MaxLength(32)>]
    Nickname: string
    
    [<Column("from_user")>]
    FromUser: int Nullable
    
    [<Column("create_at")>]
    [<DatabaseGenerated(DatabaseGeneratedOption.Identity)>]
    [<DataType(DataType.DateTime)>]
    CreatedAt: DateTime
    
    [<ForeignKey("FromUser")>]
    Author: User
}
