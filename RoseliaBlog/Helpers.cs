using System;
using System.Collections.Generic;
using System.Dynamic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.FSharp.Core;
using RoseliaBlog.Models;
using RoseliaBlog.RoseliaCore;

namespace RoseliaBlog
{
    public static class QueryExtensions
    {
        public static int GetInt(this IQueryCollection query, string key, int alternative)
        {
            var parameter = query[key].FirstOrDefault();
            return int.TryParse(parameter, out var result) ? result : alternative;
        }

        public static bool GetBool(this IQueryCollection query, string key, bool alternative)
        {
            var parameter = query[key].FirstOrDefault();
            return bool.TryParse(parameter, out var result) ? result : alternative;
        }

        public static FSharpOption<string> GetStringOption(this IQueryCollection query, string key)
            => Util.Option.ofObject(query[key].FirstOrDefault());

        public static FSharpOption<JsonElement> GetPropertyOption(this JsonElement element, string key)
        {
            if (element.TryGetProperty(key, out var result))
            {
                return FSharpOption<JsonElement>.Some(result);
            }
            
            return FSharpOption<JsonElement>.None;
        }

        public static FSharpOption<string> GetStringOption(this JsonElement element, string key) =>
            element.GetPropertyOption(key).Map(x => x.GetString());

        public static FSharpOption<int> GetIntOption(this JsonElement element) =>
            element.TryGetInt32(out var value) ? FSharpOption<int>.Some(value) : null;
    }

    public static class FSharpExtensions
    {
        public static bool TryUnwrap<TValue>(this FSharpOption<TValue> option, out TValue result)
        {
            if (option is null)
            {
                result = default;
                return false;
            }

            result = option.Value;
            return true;
        }

        public static FSharpOption<U> FlatMap<T, U>(this FSharpOption<T> option, Func<T, FSharpOption<U>> mapper)
        {
            if (option is null) return null;
            return mapper(option.Value);
        }
        
        public static async Task<FSharpOption<U>> FlatMapAsync<T, U>(this FSharpOption<T> option, Func<T, Task<FSharpOption<U>>> mapper)
        {
            if (option is null) return null;
            return await mapper(option.Value);
        }
        
        public static async Task<FSharpOption<U>> FlatMapAsync<T, U>(this Task<FSharpOption<T>> option, Func<T, Task<FSharpOption<U>>> mapper)
        {
            return await (await option).FlatMapAsync(mapper);
        }

        public static FSharpOption<U> Map<T, U>(this FSharpOption<T> option, Func<T, U> mapper) =>
            option.FlatMap(x => new FSharpOption<U>(mapper(x)));

        public static Task<FSharpOption<U>> MapAsync<T, U>(this FSharpOption<T> option, Func<T, Task<U>> mapper) =>
            option.FlatMapAsync(async x => new FSharpOption<U>(await mapper(x)));
        
        public static async Task<FSharpOption<U>> MapAsync<T, U>(this Task<FSharpOption<T>> option, Func<T, Task<U>> mapper) =>
            await (await option).MapAsync(mapper);
        
        public static FSharpOption<T> Filter<T>(this FSharpOption<T> option, Predicate<T> predicate)
        {
            if (option is not null && predicate(option.Value)) return option;
            return FSharpOption<T>.None;
        }

        public static async Task<FSharpOption<T>> FilterAsync<T>(
            this FSharpOption<T> option, Func<T, Task<bool>> predicate)
        {
            if (option is not null && await predicate(option.Value)) return option;
                        return FSharpOption<T>.None;
        }

        public static FSharpOption<T> Some<T>(T value) => FSharpOption<T>.Some(value);

        public static FSharpOption<int> ToIntOption(this string value)
        {
            if (int.TryParse(value, out var result))
            {
                return Some(result);
            }

            return null;
        }
    }

    public static class ControllerExtensions
    {
        public static RoseliaUserPrincipal GetUser(this Controller controller) =>
            controller.HttpContext.User as RoseliaUserPrincipal;
    }

    public static class Expando
    {
        public static ExpandoObject FromObject(object obj)
        {
            var expando = new ExpandoObject();
            var dict = (IDictionary<string, object>) expando;

            foreach (var property in obj.GetType().GetProperties())
            {
                dict.Add(property.Name, property.GetValue(obj));
            }

            return expando;
        }
    }
}
