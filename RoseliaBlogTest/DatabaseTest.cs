using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using RoseliaBlog.RoseliaCore.Database.Models;
using RoseliaBlog.RoseliaCore.Database;
using RoseliaBlog.RoseliaCore.Managements;

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

        [TestMethod]
        public async Task TestUserMutation()
        {
            await using var context = RoseliaBlogDbContext.OpenSqlConnection;
            var userName = Guid.NewGuid().ToString("N");
            _ = await context.Users.AddAsync(new User()
            {
                UserId = 0,
                UserName = userName,
                Role = 0
            });
            await context.SaveChangesAsync();
            context.ChangeTracker.Clear();

            await UserManagement.MutateUserWithException(userName, user =>
            {
                Assert.IsTrue(user.UserId > 0);
                user.Role = 2;
            });

            var user = await UserManagement.FindUserByUsername(userName);
            Assert.AreEqual(2, user.Value.Role);
            context.Users.Remove(user.Value);
            await context.SaveChangesAsync();
        }
    }
}