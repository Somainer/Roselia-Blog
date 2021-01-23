namespace RoseliaBlog.RoseliaCore.Database.Models

open System.ComponentModel.DataAnnotations
open System.ComponentModel.DataAnnotations.Schema
open System.Security.Cryptography
open System.Text
open Microsoft.EntityFrameworkCore

[<CLIMutable>]
[<Table("user")>]
[<Index("UserName", IsUnique = true)>]
type User = {
    [<Column("user_id")>]
    [<Key>]
    UserId: int
    
    [<Column("username")>]
    [<MaxLength(16)>]
    UserName: string
    
    [<Column("password")>]
    [<MaxLength(72)>]
    Password: string
    
    [<Column("nickname")>]
    [<MaxLength(72)>]
    Nickname: string
    
    [<Column("role")>]
    [<Required>]
    Role: int
    
    [<Column("mail")>]
    [<MaxLength(64)>]
    Mail: string
    
    [<Column("avatar")>]
    [<MaxLength(256)>]
    Avatar: string
    
    [<Column("totp_code")>]
    [<MaxLength(64)>]
    TotpCode: string
    
    [<Column("banner")>]
    [<MaxLength(256)>]
    BannerImage: string
    
    [<Column("motto")>]
    [<MaxLength(256)>]
    Motto: string
}

module PasswordDigest =
    let prefix = "ZJUw$p"
    let suffix = "qmmlw$p20"
    let hashSalt = prefix + suffix
    
    let private makeHashFunc () = SHA256.Create()
    
    let AddSalt (password : string) =
        $"{prefix}{password}{password.Length}{suffix}"
        
    let MakeDigest password =
        use hasher = makeHashFunc ()
        password
        |> AddSalt
        |> Encoding.UTF8.GetBytes
        |> hasher.ComputeHash
        |> Array.map (sprintf "%02x")
        |> String.concat ""
