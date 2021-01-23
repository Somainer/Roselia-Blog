using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using RoseliaBlog.RoseliaCore.Database.Models;
using RoseliaCore.Database;

namespace RoseliaBlogTest
{
    [TestClass]
    public class DatabaseTest
    {
        [TestMethod]
        public void TestInMemoryDatabase()
        {
            using var context = RoseliaBlogDbContext.OpenInMemoryConnection;
            Assert.IsTrue(context.Database.IsInMemory());

            Assert.IsTrue(context.Database.EnsureCreated());
        }

        [TestMethod]
        public void TestSqlDatabase()
        {
            using var context = RoseliaBlogDbContext.OpenSqlConnection;
            Assert.IsTrue(context.Database.IsRelational());
            Assert.IsTrue(context.Database.IsSqlite());

            context.Database.EnsureDeleted();
            context.Database.EnsureCreated();
            Assert.IsNotNull(context.Posts);
            Assert.IsNotNull(context.OAuth);
            Assert.IsNotNull(context.Tags);
        }
        
        [TestMethod]
        public void TestCommentCascade()
        {
            using var context = RoseliaBlogDbContext.OpenSqlConnection;
            context.Users.Add(new User()
            {
                UserName = "T",
                Role = 0
            });
            context.SaveChanges();
            context.Posts.Add(new Post()
            {
                Title = "Test",
                Content = "",
                MarkdownContent = "",
                Owner = context.Users.First().UserId
            });
            context.SaveChanges();
            context.Comments.Add(new Comment()
            {
                PostId = 1,
                Content = "Test",
                FromUser = 1
            });
            context.SaveChanges();
            
            Assert.IsTrue(context.Comments.Any());

            context.Posts.Remove(context.Posts.First());
            context.SaveChanges();
            
            Assert.IsFalse(context.Comments.Any());
        }
    }
}