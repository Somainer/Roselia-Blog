using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.FSharp.Core;

namespace RoseliaBlog.Models
{
    public abstract class RoseliaApiResult
    {
        public abstract bool Success { get; }

        public IActionResult ToActionResult(Func<RoseliaApiResult, IActionResult> onFail) =>
            Success ? new OkObjectResult(this) : onFail(this);
        
        public static RoseliaSuccess<TResult> Succeed<TResult>(TResult result) =>
            new RoseliaSuccess<TResult>()
            {
                Result = result
            };

        public static RoseliaApiResult Failure(string message) =>
            new RoseliaFailure()
            {
                Msg = message
            };

        public static RoseliaApiResult OfResult<TResult>(FSharpResult<TResult, string> result) =>
            result.IsOk ? Succeed(result.ResultValue) : Failure(result.ErrorValue);

        public static RoseliaApiResult OfOption<TResult>(FSharpOption<TResult> option, string noneMessage) =>
            option is null ? Failure(noneMessage) : Succeed(option.Value);
    }

    public class RoseliaSuccess<TResult> : RoseliaApiResult
    {
        public override bool Success => true;
        public TResult Result { get; init; }

        public IActionResult ToActionResult() => new OkObjectResult(this);
    }

    public class RoseliaFailure : RoseliaApiResult
    {
        public override bool Success => false;
        public string Msg { get; init; }
    }
}