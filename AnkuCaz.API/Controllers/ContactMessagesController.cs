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

        // GET: api/ContactMessages
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ContactMessage>>> GetAll()
        {
            var messages = await _context.ContactMessages.ToListAsync();
            return Ok(messages);
        }

        // POST: api/ContactMessages
        [HttpPost]
        public async Task<ActionResult<ContactMessage>> Create(ContactMessage message)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _context.ContactMessages.Add(message);
            await _context.SaveChangesAsync();   

            return CreatedAtAction(nameof(GetById), new { id = message.Id }, message);
        }

        // GET: api/ContactMessages/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ContactMessage>> GetById(int id)
        {
            var message = await _context.ContactMessages.FindAsync(id);
            if (message == null)
                return NotFound();

            return Ok(message);
        }
    }
}
