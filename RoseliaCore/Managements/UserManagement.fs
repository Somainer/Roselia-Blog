module RoseliaBlog.RoseliaCore.Managements.UserManagement

open System.Linq
open FSharp.Control.Tasks.V2
open Microsoft.EntityFrameworkCore
open RoseliaBlog.RoseliaCore.Database.Models
open RoseliaBlog.RoseliaCore.Util
open RoseliaBlog.RoseliaCore.ApiModels
open RoseliaBlog.RoseliaCore.Database

let GetUserById (userId : int) =
    task {
        use context = Helpers.GetContext()
        let! result = context.Users.FindAsync userId
        return Option.ofObject result
    }

let inline private queryUser (userName : string) (context : RoseliaBlogDbContext) =
    context.Users
        .AsQueryable()
        .FirstOrDefaultAsync(fun x -> x.UserName.ToLower() = userName.ToLower())

let FindUserByUsername userName =
    task {
        use context = GetContextWithoutTracking()
        let! user = queryUser userName context
        return Option.ofObject user
    }
    
//let MutateUser fn userName =
//    task {
//        use context = Helpers.GetContext()
//        let! user = queryUser userName context
//        match box user with
//        | null ->
//            return Error "User not found."
//        | _ ->
//            match fn user with
//            | Ok r ->
//                let! _ = context.SaveChangesAsync()
//                return Ok r
//            | err ->
//                return err
//    }
let MutateUser fn userName =
    MutateEntity (nameof User) queryUser fn userName

let MutateUserWithException userName (fn : System.Action<User>) =
    MutateEntityWithException (nameof User) queryUser userName fn

let AddUser username password role =
    let user = {
        UserId = 0
        UserName = username
        Role = role
        Password = PasswordDigest.MakeDigest password
        Nickname = ""
        Motto = null
        Mail = null
        Avatar = null
        TotpSecret = null
        BannerImage = null
    }
    
    use context = Helpers.GetContext()
    context.Users.Add user |> ignore
    context.SaveChangesAsync()

type UserVerificationError =
    | NoSuchUser = 1
    | WrongPassword = 2
    | MissingTotpCode = 3
    | WrongTotpCode = 4

let CheckAndGetUserByPassword userName password =
    let digestedPassword = PasswordDigest.MakeDigest password
    task {
        let! user = FindUserByUsername userName
        
        return
            match user with
            | Some u when u.Password = digestedPassword -> user
            | _ -> None
    }

let UserToTokenBase (user : User) : RoseliaBlog.RoseliaCore.Token.TokenTypes.RoseliaUserBase =
    {
        UserRole = user.Role
        Id = user.UserId
        UserName = user.UserName
    }

let ForceSetPassword (user : User) newPassword level =
    let shouldChange =
        match level with
        | Some lv -> lv > user.Role
        | None -> true
    
    task {
        if shouldChange then
            use context = Helpers.GetContext()
            context.Attach user |> ignore
            user.Password <- PasswordDigest.MakeDigest newPassword
            let! _ = context.SaveChangesAsync()
            do ()
        
        return shouldChange
    }

let ChangePassword userName oldPassword newPassword =
    task {
        match! CheckAndGetUserByPassword userName oldPassword with
        | Some u ->
            return! ForceSetPassword u newPassword None
        | None -> return false
    }

let DeleteUser userName byRole =
    task {
        match! FindUserByUsername userName with
        | Some u when u.Role < byRole ->
            use context = Helpers.GetContext()
            context.Users.Remove u |> ignore
            let! _ = context.SaveChangesAsync()
            return true
        | _ -> return false
    }

let IsMaster (user : User) =
    use context = Helpers.GetContext()
    context.Users
        .AsQueryable()
        .AllAsync(fun x -> user.Role >= x.Role)

let BindTotp userName =
    let doBind user =
        let bindResult = OtpManagement.GenerateRandom user.UserName
        user.TotpSecret <- bindResult.Code
        Ok bindResult
    
    MutateUser doBind userName

let private CheckTotpOfUser user code =
    System.String.IsNullOrEmpty user.TotpSecret
        || OtpManagement.VerifyCode user.TotpSecret code
    
let CheckTotp userName code =
    task {
        let! user = FindUserByUsername userName
        return
            match user with
            | None -> false
            | Some u ->
                CheckTotpOfUser u code
    }
    
let CheckAndGetUserByPasswordAndCode userName password code =
    task {
        let digestedPassword = PasswordDigest.MakeDigest password
        match! FindUserByUsername userName with
        | Some user when user.Password = digestedPassword ->
            return
                if CheckTotpOfUser user code then
                    Ok user
                else if System.String.IsNullOrEmpty code then
                    Error UserVerificationError.MissingTotpCode
                else Error UserVerificationError.WrongTotpCode
        
        | Some _ -> return Error UserVerificationError.WrongPassword
        | None -> return Error UserVerificationError.NoSuchUser
    }

let HasTotpVerification userName =
    task {
        let! user = FindUserByUsername userName
        return user
        |> Option.filter (fun x -> not (isNull x.TotpSecret))
        |> Option.isSome
    }
    
let RemoveTotp userName code =
    let doRemove user =
        if CheckTotpOfUser user code then
            user.TotpSecret <- null
            Ok ()
        else Error "Invalid otp code"
    
    MutateUser doRemove userName
    
/// <summary>Change the user role.</summary>
/// <param name="userName">The username of user to change.</param>
/// <param name="newRole">The new role of that user.</param>
/// <param name="changedByRole">The role of operator user.</param>
let ChangeRole userName newRole changedByRole =
    let change (user : User) =
        if changedByRole <= user.Role || newRole >= changedByRole then
            Error "Can not change whose role is larger than you."
        else if newRole < 0 then
            Error "Role must not less than 0."
        else
            user.Role <- newRole
            Ok ()
        
    MutateUser change userName
    
let GetAllUserBelowLevel role =
    task {
        use context = GetContextWithoutTracking()
        let! users =
            context.Users.AsQueryable()
                .Where(fun u -> u.Role < role)
                .ToListAsync()
        
        return users
            |> Seq.map UserInfo.UserInfoFromUserTransformer.Copy
    }
