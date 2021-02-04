namespace RoseliaBlog.RoseliaCore.Database.Models

open System
open System.ComponentModel.DataAnnotations
open System.ComponentModel.DataAnnotations.Schema
open RoseliaBlog.RoseliaCore.Database.Models

[<CLIMutable>]
[<Table("plugin_storage")>]
type PluginStorage = {
    [<Key; Column("record_id")>]
    RecordId: int
    
    [<MaxLength(64); Required; Column("application")>]
    Application: string
    
    [<Column("user")>]
    User: int
    
    [<Column("index_key")>]
    mutable IndexKey: string
    
    [<Column("key")>]
    [<MaxLength(64); Required>]
    Key: string
    
    [<Column("content")>]
    mutable Content: string
    
    [<Column("create_time")>]
    [<DatabaseGenerated(DatabaseGeneratedOption.Identity)>]
    [<DataType(DataType.DateTime)>]
    CreatedTime: DateTime
    
    [<Column("last_edit_time")>]
    [<DatabaseGenerated(DatabaseGeneratedOption.Computed)>]
    [<DataType(DataType.DateTime)>]
    LastEditedTime: DateTime
    
    [<ForeignKey("User")>]
    TargetUser: User
}

