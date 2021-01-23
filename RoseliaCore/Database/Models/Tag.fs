namespace RoseliaBlog.RoseliaCore.Database.Models

open System.ComponentModel.DataAnnotations
open System.ComponentModel.DataAnnotations.Schema
open Microsoft.EntityFrameworkCore

[<CLIMutable>]
[<Table("tag")>]
[<Index("TagName", IsUnique = true)>]
type Tag = {
    [<Key; Column("tag_id")>]
    TagId: int
    
    [<Column("tag_name"); MaxLength(64)>]
    TagName: string
}
