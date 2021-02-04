namespace RoseliaBlog.RoseliaCore.Database

open System
open Microsoft.EntityFrameworkCore
open Microsoft.Extensions.Logging
open RoseliaBlog.RoseliaCore
open RoseliaBlog.RoseliaCore.Database.Models
open RoseliaBlog.RoseliaCore.Database.Models.Relations

type DbType =
    | SqlDb = 0
    | InMemoryDb = 1

type RoseliaBlogDbContext(dbType: DbType) =
    inherit DbContext()
    
    static let DbLoggerFactory =
        LoggerFactory.Create
            (fun builder -> builder.AddConsole() |> ignore)
    
    new() = new RoseliaBlogDbContext(DbType.SqlDb)
    member this.GetUtcDate = "datetime('now')"
    
    static member OpenSqlConnection =
        new RoseliaBlogDbContext(DbType.SqlDb)
        
    static member OpenInMemoryConnection =
        new RoseliaBlogDbContext(DbType.InMemoryDb)
    
    override this.OnConfiguring optionsBuilder =
        optionsBuilder
            .EnableSensitiveDataLogging(true)
            .UseLoggerFactory(DbLoggerFactory)
        |> ignore
        match dbType with
        | DbType.SqlDb ->
            optionsBuilder.UseSqlite Config.Config.Secrets.DataBaseConnectionString
        | DbType.InMemoryDb ->
            optionsBuilder.UseInMemoryDatabase (nameof RoseliaBlogDbContext)
        | _ -> optionsBuilder
        |> ignore
    
    override this.OnModelCreating modelBuilder =
        modelBuilder.Entity<OAuth>()
            .HasKey ("UserId", "OAuthAdapter")
        |> ignore
        modelBuilder.Entity<Comment>()
            .HasOne(fun c -> c.ToArticle)
            .WithMany()
            .OnDelete(DeleteBehavior.Cascade)
        |> ignore
        modelBuilder.Entity<Comment>()
            .HasMany()
            .WithOne(fun c -> c.ReplyToComment)
            .HasForeignKey("ReplyTo")
            .OnDelete(DeleteBehavior.SetNull)
        |> ignore
        
        modelBuilder.Entity<Post>()
            .Property(fun p -> p.CreatedTime)
            .HasDefaultValueSql(this.GetUtcDate)
        |> ignore
        
        modelBuilder.Entity<Post>()
            .Property(fun p -> p.LastEditedTime)
            .HasDefaultValueSql(this.GetUtcDate)
        |> ignore
        
        modelBuilder.Entity<Comment>()
            .Property(fun p -> p.CreatedAt)
            .HasDefaultValueSql(this.GetUtcDate)
        |> ignore
        
        modelBuilder.Entity<PluginStorage>()
            .Property(fun p -> p.CreatedTime)
            .HasDefaultValueSql(this.GetUtcDate)
        |> ignore
        
        modelBuilder.Entity<PluginStorage>()
            .Property(fun p -> p.LastEditedTime)
            .HasDefaultValueSql(this.GetUtcDate)
        |> ignore
        
        modelBuilder.Entity<Post>()
            .HasMany(Util.ExprToLinqCovariant <@ fun p -> p.Tags @>)
            .WithMany(Util.ExprToLinqCovariant <@ fun (t : Tag) -> t.Posts @>)
            .UsingEntity<PostTag>(
                Func<_, _>(fun p -> p.HasOne(fun xs -> xs.Tag).WithMany()),
                Func<_, _>(fun p -> p.HasOne(fun xs -> xs.Post).WithMany())
            ).HasKey("PostId", "TagId")
        |> ignore
        
        modelBuilder.Entity<Post>()
            .HasMany(Util.ExprToLinqCovariant <@ fun p -> p.Catalogs @>)
            .WithMany(Util.ExprToLinqCovariant <@ fun (p : Catalog) -> p.Posts @>)
            .UsingEntity<PostCatalog>(
                Func<_, _>(fun p -> p.HasOne(fun xs -> xs.Catalog).WithMany()),
                Func<_, _>(fun p -> p.HasOne(fun xs -> xs.Post).WithMany())
            ).HasKey("PostId", "CatalogId")
        |> ignore
    
    [<DefaultValue>]
    val mutable private users : User DbSet
    member this.Users
        with get() = this.users and set value = this.users <- value
    
    [<DefaultValue>]
    val mutable private posts : Post DbSet
    member this.Posts
        with get() = this.posts and set value = this.posts <- value
    
    [<DefaultValue>]
    val mutable private comments : Comment DbSet
    member this.Comments
        with get() = this.comments and set value = this.comments <- value
    
    [<DefaultValue>]
    val mutable private tags : Tag DbSet
    member this.Tags
        with get() = this.tags and set value = this.tags <- value
    
    [<DefaultValue>]
    val mutable private pluginStorage : PluginStorage DbSet
    member this.PluginStorage
        with get() = this.pluginStorage and set value = this.pluginStorage <- value
    
    [<DefaultValue>]
    val mutable private oAuth : OAuth DbSet
    member this.OAuth
        with get() = this.oAuth and set value = this.oAuth <- value
    
    [<DefaultValue>]
    val mutable private postTags : PostTag DbSet
    member this.PostTags
        with get() = this.postTags and set value = this.postTags <- value
    
    [<DefaultValue>]
    val mutable private catalogs : Catalog DbSet
    member this.Catalogs
        with get() = this.catalogs and set value = this.catalogs <- value
        
    [<DefaultValue>]
    val mutable private postCatalog : PostCatalog DbSet
    member this.PostCatalog
        with get() = this.postCatalog and set value = this.postCatalog <- value
