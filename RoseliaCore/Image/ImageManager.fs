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
        Util.DiscoverImplementations<IImageManager>()
        |> Seq.filter (fun im -> im.IsEnabled())
        
    let ImageManagers = DiscoverImageManagers()
    let ImageManagerDict =
        ImageManagers
        |> Seq.map (fun m -> m.Identifier, m)
        |> Map.ofSeq

    let DefaultImageManager =
        ImageManagers.SingleOrDefault(fun im -> im.IsDefault)
