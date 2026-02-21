public interface IGooglePhotosService
{
    Task<List<object>> GetPhotosAsync(string accessToken);
}