namespace RoseliaBlog.RoseliaCore.Database.Models

open System.ComponentModel.DataAnnotations
open System.ComponentModel.DataAnnotations.Schema

[<CLIMutable>]
[<Table("oauth")>]
type OAuth = {
    [<Column("user_id")>]
    UserId: int
    
    [<Column("oauth_adapter")>]
    OAuthAdapter: string
    
    [<Column("embedding_user")>]
    UnderlyingUser: string
    
    [<ForeignKey("UserId")>]
    User: User
}
