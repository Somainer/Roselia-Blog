namespace RoseliaBlog.RoseliaCore.Image

open System.IO
open System.Linq
open System.Threading.Tasks
open RoseliaBlog.RoseliaCore

type UploadedImage = {
    Url: string
    FileName: string
    DeleteKey: string
    Channel: string
}

type IImageManager =
    abstract Identifier : string
    abstract DisplayName : string
    abstract Description : string
    
    abstract IsEnabled : unit -> bool
    abstract IsDefault : bool
    abstract ListImagesAsync : unit -> Task<UploadedImage seq>
    abstract AddImageAsync : Stream -> string -> string -> Task<Result<UploadedImage, string>>
    abstract DeleteImageAsync : string -> Task<Result<unit, string>>

[<AutoOpen>]
module ImageManagement =
    let inline ImportFromConfig<'a> key =
        Config.GetSecret<'a> key

    let DiscoverImageManagers () =
        seq {
            for t in typeof<IImageManager>.Assembly.GetTypes() do
                if t.IsClass && not t.IsAbstract && t.IsAssignableTo(typeof<IImageManager>) then
                    let ctor = t.GetConstructor([||])
                    if not (isNull ctor) then
                        let manager = ctor.Invoke([||]) :?> IImageManager
                        if manager.IsEnabled() then
                            yield manager
        }
        
    let ImageManagers = DiscoverImageManagers()
    let ImageManagerDict =
        ImageManagers.Select(fun m -> m.Identifier, m)
        |> Map.ofSeq

    let DefaultImageManager =
        ImageManagers.SingleOrDefault(fun im -> im.IsDefault)
