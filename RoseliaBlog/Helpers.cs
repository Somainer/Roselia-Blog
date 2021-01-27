using System.Linq;
using Microsoft.AspNetCore.Http;
using Microsoft.FSharp.Core;
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

        public static FSharpOption<string> GetStringOption(this IQueryCollection query, string key)
            => Util.Option.ofObject(query[key].FirstOrDefault());
    }
}
