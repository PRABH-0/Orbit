using Microsoft.Extensions.Options;
using Orbit_BE.Interfaces;
using Orbit_BE.Options;
using System.Net.Http.Headers;

namespace Orbit_BE.Services
{
    public class SupabaseFileStorageService : IFileStorageService
    {
        private readonly HttpClient _http;
        private readonly string _projectUrl;
        private readonly string _bucket;

        public SupabaseFileStorageService(IOptions<SupabaseOptions> options)
        {
            var cfg = options.Value;

            _projectUrl = cfg.ProjectUrl.TrimEnd('/');
            _bucket = cfg.Bucket;

            _http = new HttpClient
            {
                Timeout = TimeSpan.FromMinutes(5)
            };

            _http.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", cfg.ServiceRoleKey);

            _http.DefaultRequestHeaders.Add("apikey", cfg.ServiceRoleKey);
        }

        public async Task<string> UploadAsync(
            Stream fileStream,
            string fileName,
            string contentType,
            Guid userId,
            Guid nodeId)
        {
            var safeFileName = $"{Guid.NewGuid()}_{fileName}";
            var storagePath = $"users/{userId}/{nodeId}/{safeFileName}";

            var url =
                $"{_projectUrl}/storage/v1/object/{_bucket}/{storagePath}";

            using var content = new StreamContent(fileStream);
            content.Headers.ContentType =
                new MediaTypeHeaderValue(contentType);

            using var request = new HttpRequestMessage(HttpMethod.Put, url)
            {
                Content = content
            };

            var response = await _http.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync();
                throw new Exception($"Supabase upload failed: {err}");
            }

            return storagePath;
        }

        public async Task<(byte[] FileBytes, string ContentType)> DownloadAsync(string storagePath)
        {
            var url =
                $"{_projectUrl}/storage/v1/object/{_bucket}/{storagePath}";

            var response = await _http.GetAsync(url);

            if (!response.IsSuccessStatusCode)
                throw new FileNotFoundException();

            var bytes = await response.Content.ReadAsByteArrayAsync();
            var contentType =
                response.Content.Headers.ContentType?.MediaType
                ?? "application/octet-stream";

            return (bytes, contentType);
        }

        public async Task DeleteAsync(string storagePath)
        {
            var url =
                $"{_projectUrl}/storage/v1/object/{_bucket}/{storagePath}";

            var response = await _http.DeleteAsync(url);

            if (!response.IsSuccessStatusCode)
                throw new Exception("Supabase delete failed");
        }
    }
}
