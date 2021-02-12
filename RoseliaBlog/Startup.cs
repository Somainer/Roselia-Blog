using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using RoseliaBlog.Models;
using RoseliaBlog.RoseliaCore;
using RoseliaBlog.RoseliaCore.Database;
using VueCliMiddleware;

namespace RoseliaBlog
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services
                .AddControllers()
                .AddJsonOptions(option =>
                {
                    option.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
                    option.JsonSerializerOptions.Converters.Add(new DateTimeConverter());
                });
            services.AddSpaStaticFiles(configuration =>
            {
                configuration.RootPath = "Frontend/dist";
                CompiledAssetsManager.Read(configuration.RootPath);
            });
            services.AddRazorPages();
            // services.AddDbContext<RoseliaBlogDbContext>();
            // services.AddDatabaseDeveloperPageExceptionFilter();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                CompiledAssetsManager.UseDebug();
            }

            app.UseRouting();
            app.UseSpaStaticFiles();
            app.UseAuthorization();

            if (!env.IsDevelopment())
            {
                app.UsePathBase(Config.Config.UrlPrefix);
            }

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });

            app.UseSpa(spa =>
            {
                if (env.IsDevelopment())
                    spa.Options.SourcePath = "Frontend/";
                else
                    spa.Options.SourcePath = "Frontend/dist";

                if (env.IsDevelopment())
                {
                    spa.UseVueCli(npmScript: "serve", runner: ScriptRunnerType.Yarn);
                }

            });
        }
    }
}
