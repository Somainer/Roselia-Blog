module RoseliaBlog.RoseliaCore.Managements.PostManagement

open System.Linq
open FSharp.Control.Tasks.V2
open Microsoft.EntityFrameworkCore
open RoseliaBlog.RoseliaCore
open RoseliaBlog.RoseliaCore.Database
open RoseliaBlog.RoseliaCore.Database.Models
open RoseliaBlog.RoseliaCore.Database.Models.Relations
open RoseliaBlog.RoseliaCore.RoseliaFlavoredMarkdown
open RoseliaBlog.RoseliaCore.StructuralCopy
open RoseliaBlog.RoseliaCore.Util
open RoseliaBlog.RoseliaCore.ApiModels

let inline private queryPost id (context : RoseliaBlogDbContext) =
    context.Posts
        .AsQueryable()
        .FirstOrDefaultAsync(fun p -> p.PostId = id)

let GetPost id =
    task {
        use context = GetContextWithoutTracking()
        let! post = queryPost id context
        
        return Option.ofObject post
    }
    
let FindPostByDisplayId (displayId : string) =
    task {
        use context = GetContextWithoutTracking()
        let! post =
            context.Posts
                .AsQueryable()
                .FirstOrDefaultAsync(fun p -> p.DisplayId.ToLower() = displayId.ToLower())
                
        return Option.ofObject post
    }

let MutatePost fn id =
    MutateEntity (nameof Post) queryPost fn id

let FindTag tagName =
    let name = Tag.GetDisplayedName tagName
    use context = GetContextWithoutTracking()
    context.Tags.AsQueryable()
        .FirstOrDefaultAsync(fun t -> t.TagName.ToLower() = name.ToLower())
    |> Task.map Option.ofObject

let FindCatalog (name : string) =
    use context = GetContextWithoutTracking()
    context.Catalogs
        .AsQueryable()
        .FirstOrDefaultAsync(fun c -> c.CatalogName.ToLower() = name.ToLower())
    |> Task.map Option.ofObject

let FindCatalogByLink (link : string) =
    use context = GetContext()
    context.Catalogs
        .AsQueryable()
        .FirstOrDefaultAsync(fun c -> c.CatalogEternalLink.ToLower() = link.ToLower())
    |> Task.map Option.ofObject

let FilterPostsInVision (userOption : User option) tagOption catalogOption =
    use context = GetContextWithoutTracking()
    let mutable postQuery = context.Posts.AsQueryable()
    postQuery <-
        match userOption with
        | Some user ->
            postQuery
                .Where(fun p -> p.Secret <= user.Role + 1)
                .Include(fun p -> p.Author)
                .Where
                    (fun p ->
                        p.Owner = user.UserId
                        || not p.Hidden
                        || p.Author.Role < user.Role)
        | None ->
            postQuery.Where(fun p -> not p.Hidden).Where(fun p -> p.Secret = 0)
    
    task {
        match!
            tagOption
            |> Option.map FindTag
            |> Task.flattenOption with
        | Some tag ->
            // If not use a local variable, it does not compile. Magic.
            let lastQuery = postQuery
            postQuery <-
                query {
                    for post in lastQuery do
                    join postTag in context.PostTags
                        on (post.PostId = postTag.PostId)
                    where (postTag.TagId = tag.TagId)
                    select post
                }
        | None -> ()
        
        match!
            catalogOption
            |> Option.map FindCatalog
            |> Task.flattenOption
            |> Task.flatMap (function
                | None -> FindCatalogByLink catalogOption.Value
                | some -> Task.unit some) with
        | Some catalog ->
            let lastQuery = postQuery
            postQuery <-
                query {
                    for post in lastQuery do
                    join postCatalog in context.PostCatalog
                        on (post.PostId = postCatalog.PostId)
                    where (postCatalog.CatalogId = catalog.CatalogId)
                    select post
                }
        | None -> ()
        return postQuery
    }

let private AddTag tagName =
    task {
        use context = GetContext()
        let tag = {
            Tag.TagId = 0
            Tag.TagName = Tag.GetDisplayedName tagName
        }
        context.Tags.Add tag
        |> ignore
        
        let! _ = context.SaveChangesAsync()
        return tag
    }

let EnsureTag name =
    task {
        match! FindTag name with
        | Some tag -> return tag
        | None -> return! AddTag name
    }
    
let GetPostCount level =
    use context = GetContextWithoutTracking()
    context.Posts
        .AsQueryable()
        .CountAsync(fun p -> p.Secret <= level)

let PreviousPostId pid user =
    task {
        let! posts = FilterPostsInVision user None None
        return! posts
            .Where(fun p -> p.PostId < pid)
            .OrderByDescending(fun p -> p.PostId)
            .Select(fun p -> p.PostId)
            .DefaultIfEmpty(-1)
            .FirstAsync()
    }
    
let NextPostId pid user =
    task {
        let! posts = FilterPostsInVision user None None
        return! posts
            .Where(fun p -> p.PostId > pid)
            .OrderByDescending(fun p -> p.PostId)
            .Select(fun p -> p.PostId)
            .DefaultIfEmpty(-1)
            .FirstAsync()
    }

let PostFromArticleTransformer =
    StructuralCopy.NewBuilder<Article, Post>
    |> StructuralCopy.mapTo <@ fun a -> a.EnableComment @> <@ fun p -> p.IsCommentEnabled @>
    |> StructuralCopy.mapTo <@ fun a -> a.DarkTitle @> <@ fun p -> p.IsTitleDark @>
    |> StructuralCopy.mapTo <@ fun a -> a.Img @> <@ fun p -> p.Cover @>
    |> StructuralCopy.mapToDefault <@ fun a -> a.CreatedTime @>
    |> StructuralCopy.mapToDefault <@ fun a -> a.LastEditedTime @>
    |> StructuralCopy.mapToDefault <@ fun a -> a.Tags @>
    |> StructuralCopy.mapToDefault <@ fun a -> a.Catalogs @>
    |> StructuralCopy.whenFieldMissing CopierMissingPolicy.Ignore
    |> StructuralCopy.skipNullValue true
    |> StructuralCopy.build

let AddPost (article : Article) owner formatMarkdown =
    task {
        let! tags =
            article.Tags.Select EnsureTag
            |> Task.all
        let post = {
            PostFromArticleTransformer.Copy article with
                Owner = owner
                Tags = tags
        }
        
        if formatMarkdown then
            post.MarkdownContent <- post.Content
            post.Content <- RoseliaFlavoredMarkdown.ConvertToHtml post.MarkdownContent
        
        use context = GetContext()
        context.Posts.Add post
        |> ignore
        
        return! context.SaveChangesAsync()
    }

let EditPost postId (article : Article) role formatMarkdown =
    task {
        match! GetPost postId with
        | None -> return Error "Such post not found."
        | Some post when post.Author.Role <= role ->
            let! tags =
                article.Tags.Select EnsureTag
                |> Task.all
            use context = GetContext()
            context.Attach post |> ignore
            
            post.Tags.Clear()
            for tag in tags do
                post.Tags.Add tag
            
            PostFromArticleTransformer.Assign article post
            
            if formatMarkdown && not(isNull article.Content) then
                post.MarkdownContent <- article.Content
                post.Content <- RoseliaFlavoredMarkdown.ConvertToHtml article.Content
                
            let! _ = context.SaveChangesAsync()
            return Ok()
        | _ -> return Error "Do not have access to modify that post"
    }

let GetPosts offset count user tag catalog =
    task {
        let! postQuery = FilterPostsInVision user tag catalog
        return! postQuery
            .OrderByDescending(fun p -> p.PostId)
            .Skip(offset).Take(count)
            .Select(Article.BriefArticleFromPostTransformer.Copy)
            .ToListAsync()
    }
    
let GetPostsFromAuthor (author : User) offset count user =
    task {
        let! posts =
            FilterPostsInVision user None None
        return! posts
            .Where(fun p -> p.Owner = author.UserId)
            .OrderByDescending(fun p -> p.PostId)
            .Skip(offset).Take(count)
            .Select(Article.BriefArticleFromPostTransformer.Copy)
            .ToListAsync()
    }
    
let RemovePost postId level =
    task {
        use context = GetContext()
        let! post =
            context.Posts
                .Include(fun p -> p.Author)
                .Where(fun p -> p.PostId = postId)
                .Where(fun p -> p.Author.Role <= level)
                .SingleOrDefaultAsync()
        
        match box post with
        | null -> return false
        | _ ->
            context.Posts.Remove(post) |> ignore
            let! _ = context.SaveChangesAsync()
            return true
    }

let GetCount level =
    task {
        use context = GetContext()
        return! context.Posts
            .Where(fun p -> p.Secret <= level)
            .CountAsync()
    }
