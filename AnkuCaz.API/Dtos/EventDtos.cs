namespace AnkuCaz.API.Dtos
{
    public record CreateEventDto(
        string Title,
        string Description,
        DateTime StartDate,
        DateTime EndDate,
        string? ImageUrl,
        int? CategoryId,
        int? VenueId
    );

    public record UpdateEventDto(
        int Id,
        string Title,
        string Description,
        DateTime StartDate,
        DateTime EndDate,
        string? ImageUrl,
        int? CategoryId,
        int? VenueId
    );

    public record EventListDto(
        int Id,
        string Title,
        DateTime StartDate,
        DateTime EndDate,
        string? ImageUrl,
        int? CategoryId,
        string? CategoryName,
        int? VenueId,
        string? VenueName
    );

    public record EventDetailDto(
        int Id,
        string Title,
        string Description,
        DateTime StartDate,
        DateTime EndDate,
        string? ImageUrl,
        int? CategoryId,
        string? CategoryName,
        int? VenueId,
        string? VenueName
    );
}
