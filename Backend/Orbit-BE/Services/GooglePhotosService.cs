using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace Orbit_BE.Services
{
    public class GooglePhotosService : IGooglePhotosService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        public GooglePhotosService(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }
        public async Task<List<object>> GetPhotosAsync(string accessToken)
        {
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", accessToken);

            var response = await client.PostAsync(
                "https://photoslibrary.googleapis.com/v1/mediaItems:search",
                new StringContent("{}", Encoding.UTF8, "application/json")
            );

            if (!response.IsSuccessStatusCode)
                throw new Exception("Google Photos API error");

            var json = await response.Content.ReadAsStringAsync();

            var doc = JsonDocument.Parse(json);

            var items = new List<object>();

            foreach (var media in doc.RootElement.GetProperty("mediaItems").EnumerateArray())
            {
                var id = media.GetProperty("id").GetString();
                var filename = media.GetProperty("filename").GetString();
                var baseUrl = media.GetProperty("baseUrl").GetString();
                var mimeType = media.GetProperty("mimeType").GetString();

                items.Add(new
                {
                    id,
                    name = filename,
                    mimeType,
                    thumbnail = baseUrl + "=w200-h200",
                    fullUrl = baseUrl + "=d"
                });
            }

            return items;
        }
    }
}
