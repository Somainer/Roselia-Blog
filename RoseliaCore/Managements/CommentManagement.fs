module RoseliaCore.Managements.CommentManagement

open System.Linq
open Ganss.XSS
open Microsoft.EntityFrameworkCore
open FSharp.Control.Tasks.V2
open RoseliaBlog.RoseliaCore
open RoseliaBlog.RoseliaCore.ApiModels
open RoseliaBlog.RoseliaCore.Util
open RoseliaBlog.RoseliaCore.Database.Models
open RoseliaBlog.RoseliaCore.Managements
open RoseliaBlog.RoseliaCore.RoseliaFlavoredMarkdown

let ProcessCommentContent content =
    content
    |> RoseliaFlavoredMarkdown.ConvertToHtml
    |> HtmlSanitizer().Sanitize

let AddComment toPost content toComment fromUser nickname =
    let replyTo =
        toComment
        |> Option.map System.Nullable
        |> Option.defaultValue (System.Nullable())
    
    let AddCommentChecked comment user =
        task {
            match! PostManagement.GetPost toPost with
            | None -> return Error "Invalid post."
            | Some post when post.IsCommentEnabled || Option.isSome user ->
                use context = GetContext()
                context.Comments.Add comment |> ignore
                let! _ = context.SaveChangesAsync()
                return Ok comment.CommentId
            | _ -> return Error "You are not allowed to comment."
            
        }
    let AddCommentForUser (user : User) =
         let comment : Comment = {
             CommentId = 0
             Content = ProcessCommentContent content
             PostId = toPost
             ToArticle = Util.Default
             FromUser = System.Nullable(user.UserId)
             ReplyTo = replyTo
//             ReplyToComment = Util.Default
             Nickname = Util.Default
             CreatedAt = Util.Default
             Author = Util.Default
         }
         
         AddCommentChecked comment (Some user)
    
    let AddCommentAnonymous nickname =
        let comment : Comment = {
            CommentId = 0
            Content = ProcessCommentContent content
            PostId = toPost
            ToArticle = Util.Default
            FromUser = System.Nullable()
            ReplyTo = replyTo
//            ReplyToComment = Util.Default
            Nickname = nickname
            CreatedAt = Util.Default
            Author = Util.Default
        }
        
        AddCommentChecked comment None
    
    task {
        if Option.isSome fromUser then
            let! user = UserManagement.FindUserByUsername fromUser.Value
            if user.IsNone then
                return Error "Invalid user"
            else
                return! AddCommentForUser user.Value
        else
            match
                nickname
                |> Option.filter (fun s -> not(System.String.IsNullOrWhiteSpace s))
                with
                | None -> return Error "Please specify a nickname"
                | Some nickname -> return! AddCommentAnonymous nickname
    }

let CanDeleteComment user (comment : Comment) =
    match Option.ofObject comment.Author with
    | None -> user.Role > 0
    | Some author ->
        user.Role > author.Role
            || user.UserId = author.UserId

let GetComment commentId =
    task {
        use context = GetContextWithoutTracking()
        return! context.Comments
            .Where(fun c -> c.CommentId = commentId)
            .Include(fun c -> c.Author)
            .SingleOrDefaultAsync()
        |> Task.map Option.ofObject
    }
    
let GetCommentInfo commentId =
    GetComment commentId
    |> Task.map (Option.map Comment.CommentInfoTransformer.Copy)

let DeleteComment commentId byUser =
    task {
        let! maybeUser = UserManagement.FindUserByUsername byUser
        let! maybeComment = GetComment commentId
        
        match maybeUser with
        | None -> return Error "Invalid user"
        | Some user ->
            match maybeComment with
            | None -> return Error "Invalid comment id"
            | Some comment when CanDeleteComment user comment ->
                use context = GetContext()
                context.Comments.Remove(comment) |> ignore
                let! _ = context.SaveChangesAsync()
                return Ok()
            | _ -> return Error "You are not permitted to delete that comment."
    }

let ForceDeleteComment commentId =
    task {
        match! GetComment commentId with
        | None -> return false
        | Some comment ->
            use context = GetContext()
            context.Comments.Remove(comment) |> ignore
            let! _ = context.SaveChangesAsync()
            return true
    }

let private GetCommentQuery postId (SameReturnTypeAs GetContext context) =
    context.Comments
        .Where(fun c -> c.PostId = postId)
        .Include(fun c -> c.Author)
        .OrderByDescending(fun c -> c.CommentId)

let GetComments postId (limit: int) offset =
    task {
        use context = GetContextWithoutTracking()
        let query = GetCommentQuery postId context
        return!
            query.Skip(offset).Take(limit)
                .ToListAsync()
            |> Task.map (Seq.map(Comment.CommentInfoTransformer.Copy) >> Seq.toList)
    }

let GetCommentCount postId =
    use context = GetContextWithoutTracking()
    (GetCommentQuery postId context).CountAsync()
