using Microsoft.Extensions.Logging;

namespace RoseliaBlog
{
    public static class Loggers
    {
        private static ILoggerFactory Factory = LoggerFactory.Create(configure =>
        {
            configure.AddConsole();
        });

        public static ILogger<T> GetLogger<T>(this T _)
        {
            return Factory.CreateLogger<T>();
        }
    }
}
