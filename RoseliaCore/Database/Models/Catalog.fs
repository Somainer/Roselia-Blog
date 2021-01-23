namespace RoseliaCore.Database.Models

open System.ComponentModel.DataAnnotations
open System.ComponentModel.DataAnnotations.Schema

[<CLIMutable>]
[<Table("catalog")>]
type Catalog = {
    [<Key; Column("catalog_id")>]
    CatalogId: int
    
    [<Column("catalog_eternal_link")>]
    CatalogEternalLink: string
    
    [<Column("catalog_name")>]
    CatalogName: string
}
