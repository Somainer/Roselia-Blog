using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using RoseliaBlog.RoseliaCore.Database;

namespace RoseliaBlog
{
    public class Program
    {
        public static void Main(string[] args)
        {
            EnsureDatabaseCreated();
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureLogging(logging =>
                {
                    logging.AddConsole();
                })
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                });

        private static void EnsureDatabaseCreated()
        {
            using var context = RoseliaBlogDbContext.OpenSqlConnection;
            context.Database.EnsureCreated();
        }
    }
}
