namespace ZabdyTech.Dtos
{
    public class UpdateProfileDto
    {

        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Password { get; set; }

        public IFormFile? ProfileImage { get; set; }
    }

}