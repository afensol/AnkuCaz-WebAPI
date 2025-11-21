using AnkuCaz.API.Data;
using AnkuCaz.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnkuCaz.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ContactMessagesController : ControllerBase
    {
        private readonly AnkuCazContext _context;

        public ContactMessagesController(AnkuCazContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> Submit(ContactMessage msg)
        {
            _context.ContactMessages.Add(msg);
            await _context.SaveChangesAsync();
            return Ok(msg);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var messages = await _context.ContactMessages
                                         .OrderByDescending(m => m.CreatedAt)
                                         .ToListAsync();
            return Ok(messages);
        }
    }
}
