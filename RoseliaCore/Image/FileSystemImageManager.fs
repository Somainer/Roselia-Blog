namespace RoseliaCore.Image

open System
open System.Threading.Tasks
open FSharp.Control.Tasks.V2
open RoseliaBlog.RoseliaCore
open RoseliaBlog.RoseliaCore.Image

type FileSystemImageManager() =
    let SupportedExtensions =
        ["jpg"; "jpeg"; "png"; "bmp"; "webp"; "gif"]
        |> Set.ofList
        
    let UploadDir =
        Config.GetConfig<string> "uploadDir"
        |> Option.filter (String.IsNullOrEmpty >> not)
    
    let IsExtensionSupported (ext : string) =
        let extension =
            if ext.StartsWith "." then
                ext.Substring(1)
            else ext
        
        SupportedExtensions.Contains  extension
    let IsFileNameSupported (fileName : string) =
        fileName
        |> IO.Path.GetExtension
        |> IsExtensionSupported
        
    let mutable UrlDelegate : option<string -> string> = None
    
    let GetUrl url =
        UrlDelegate
        |> Option.defaultValue id
        |> fun f -> f url
        
    let SanitizeFileName (name : string) =
        let invalidChars = IO.Path.GetInvalidFileNameChars()
        name.Split(invalidChars, StringSplitOptions.RemoveEmptyEntries)
        |> String.concat "_"
    
    member this.GetStream name =
        name
        |> SanitizeFileName
        |> Option.ofObj
        |> Option.filter IsFileNameSupported
        |> Option.map (fun p -> IO.Path.Join(UploadDir.Value, p))
        |> Option.filter IO.File.Exists
        |> Option.map IO.File.OpenRead
    
    member this.SetUrlBuilder ub =
        UrlDelegate <- (Some ub)
    
    static member TrySetUrlBuilder (manager : IImageManager) (ub : System.Func<string, string>) =
        match manager with
        | :? FileSystemImageManager as fsi ->
            fsi.SetUrlBuilder ub.Invoke
        | _ -> ()
    
    interface IImageManager with
        member this.Identifier = "roselia"
        member this.DisplayName = "Roselia"
        member this.Description = "Upload to this site directly."
        member this.IsDefault = true
        member this.IsEnabled() = UploadDir.IsSome
        member this.AddImageAsync image rawFileName convert =
            task {
                let fileName = SanitizeFileName rawFileName
                if IsFileNameSupported fileName then
                    let prefix = DateTime.Now.ToString "Upload_%Y%m%d%H%M%S_"
                    let newFileName = $"{prefix}{fileName}"
                    use fileStream = IO.File.OpenWrite(IO.Path.Join(UploadDir.Value, newFileName))
                    let! _ = image.CopyToAsync fileStream
                    return Ok {
                        Url = GetUrl newFileName
                        FileName = newFileName
                        DeleteKey = newFileName
                        Channel = (this :> IImageManager).Identifier
                    }
                else return Error "File extension is not supported."
            }
        member this.DeleteImageAsync fileName =
            task {
                let secureFileName = SanitizeFileName fileName
                if secureFileName <> fileName then
                    return Error "Invalid path name"
                else
                    let fullPath = IO.Path.Join(UploadDir.Value, secureFileName)
                    if IO.File.Exists fullPath then
                        IO.File.Delete fullPath
                        return Ok ()
                    else return Error "File not exist."
            }
            
        member this.ListImagesAsync() =
            let files = IO.Directory.GetFiles UploadDir.Value
            files
            |> Seq.map IO.Path.GetFileName 
            |> Seq.filter IsFileNameSupported
            |> Seq.map
                (fun path -> {
                    Url = GetUrl path
                    FileName = path
                    DeleteKey = path
                    Channel = (this :> IImageManager).Identifier
                })
            |> Task.FromResult
