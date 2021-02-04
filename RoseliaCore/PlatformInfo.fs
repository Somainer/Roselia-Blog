module RoseliaBlog.RoseliaCore.PlatformInfo

open System
open System.Diagnostics
open System.Text.RegularExpressions

type PlatformInfo = {
    Name: string
    Version: string
    Node: string
    ServerInterpreter: string
} with
    static member internal GetCurrentMachine =
        let name =
            if OperatingSystem.IsWindows() then
                "Windows"
            else if OperatingSystem.IsMacOS() then
                match Environment.OSVersion.Version.Major with
                | v when v > 10 -> "macOS"
                | 10 ->
                    match Environment.OSVersion.Version.Minor with
                    | x when x < 8 -> "MAC OS X"
                    | x when x < 12 -> "OS X"
                    | _ -> "macOS"
                | _ -> "Mac OS"
            else if OperatingSystem.IsLinux() then
                "Linus"
            else "Unknown"
        
        {
            Name = name
            Version = Environment.OSVersion.VersionString
            Node = Environment.MachineName
            ServerInterpreter = Runtime.InteropServices.RuntimeInformation.FrameworkDescription
        }


type CpuInfo = {
    Name: string
    TotalCore: int
    LogicalCore: int
}

let private CpuCounter =
    lazy new PerformanceCounter("Processor", "% Processor Time", "_Total", true)
type CpuUsage = {
    Total: double
    Logic: double array
} with
    static member GetUsage =
        let mutable value = CpuCounter.Value.NextValue() |> float
        if value <= 0.0 then value <- CpuCounter.Value.NextValue() |> float
        {
            Total = value
            Logic = [||]
        }
        
        
type MemoryUsage = {
    Total: int64
    Used: int64
    Percent: double
    Available: int64
} with
    static member GetUsage =
        let proc = Process.GetCurrentProcess ()
        let memInfo = GC.GetGCMemoryInfo ()
        let used = GC.GetTotalMemory(false)
        let total = proc.PrivateMemorySize64
        
        {
            Available = memInfo.TotalAvailableMemoryBytes
            Used = used
            Percent = double(used / total)
            Total = total
        }

let CurrentPlatformInfo = lazy PlatformInfo.GetCurrentMachine

let private ExecuteAndGetOutput (command : string seq) =
    use p = new Process()
    p.StartInfo.RedirectStandardInput <- true
    p.StartInfo.RedirectStandardOutput <- true
    p.StartInfo.CreateNoWindow <- true
    p.StartInfo.FileName <- command |> Seq.head
    p.StartInfo.Arguments <-
        command
        |> Seq.tail
        |> String.concat " "
    
    p.Start() |> ignore
    let outcome = p.StandardOutput.ReadToEnd()
    p.WaitForExit()
    
    outcome

let private CpuName =
    lazy
        if OperatingSystem.IsWindows() then
            let output = ExecuteAndGetOutput ["wmic"; "cpu"; "get"; "name"]
            output.Trim().Split('\n').[1]
        else if OperatingSystem.IsMacOS() then
            let output = ExecuteAndGetOutput ["/usr/sbin/sysctl"; "-n"; "machdep.cpu.brand_string"]
            output.Trim()
        else if OperatingSystem.IsLinux() then
            let output = ExecuteAndGetOutput ["cat"; "/proc/cpuinfo"]
            seq {
                for line in output.Split('\n') do
                    if line.Contains "model name" then
                        yield Regex(".*model name.*:").Replace(line, "", 1)
            }
            |> Seq.tryHead
            |> Option.defaultValue ""
        else ""
        
let CurrentCpuInfo =
    lazy
        {
            Name = CpuName.Value
            // There is not solution for getting physical core count.
            // So I assume all processors support hyper threading.
            TotalCore = Environment.ProcessorCount <<< 1
            LogicalCore = Environment.ProcessorCount
        }
