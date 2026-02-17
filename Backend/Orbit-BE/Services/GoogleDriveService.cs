using Google.Apis.Auth.OAuth2;
using Google.Apis.Drive.v3;
using Google.Apis.Services;
using Orbit_BE.Interfaces;
using System.Net.Http.Headers;

public class GoogleDriveService : IGoogleDriveService
{
    private readonly IHttpClientFactory _httpClientFactory;

    public GoogleDriveService(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    // ==============================
    // LIST FILES
    // ==============================
    public async Task<List<object>> GetFilesAsync(string accessToken)
    {
        var credential = GoogleCredential.FromAccessToken(accessToken);

        var service = new DriveService(new BaseClientService.Initializer()
        {
            HttpClientInitializer = credential,
            ApplicationName = "Orbit"
        });

        var request = service.Files.List();
        request.PageSize = 20;
        request.Fields = "files(id, name, mimeType)";

        var result = await request.ExecuteAsync();

        return result.Files.Select(f => new
        {
            id = f.Id,
            name = f.Name,
            mimeType = f.MimeType
        }).Cast<object>().ToList();
    }

    // ==============================
    // STREAM FILE
    // ==============================
    public async Task<(Stream Stream, string ContentType)>
    GetFileStreamAsync(string accessToken, string fileId)
    {
        var client = _httpClientFactory.CreateClient();

        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", accessToken);

        // 🔍 First get file metadata
        var metadataResponse = await client.GetAsync(
            $"https://www.googleapis.com/drive/v3/files/{fileId}?fields=mimeType");

        if (!metadataResponse.IsSuccessStatusCode)
            throw new Exception($"Metadata Error: {metadataResponse.StatusCode}");

        var metadataJson = await metadataResponse.Content.ReadAsStringAsync();

        var mimeType = System.Text.Json.JsonDocument
            .Parse(metadataJson)
            .RootElement
            .GetProperty("mimeType")
            .GetString();

        HttpResponseMessage response;

        // 🚀 If Google Docs type → export
        if (mimeType != null && mimeType.StartsWith("application/vnd.google-apps"))
        {
            response = await client.GetAsync(
                $"https://www.googleapis.com/drive/v3/files/{fileId}/export?mimeType=application/pdf",
                HttpCompletionOption.ResponseHeadersRead);
        }
        else
        {
            // Normal file
            response = await client.GetAsync(
                $"https://www.googleapis.com/drive/v3/files/{fileId}?alt=media",
                HttpCompletionOption.ResponseHeadersRead);
        }

        if (!response.IsSuccessStatusCode)
            throw new Exception($"Google API Error: {response.StatusCode}");

        var stream = await response.Content.ReadAsStreamAsync();

        var contentType =
            response.Content.Headers.ContentType?.ToString()
            ?? "application/octet-stream";

        return (stream, contentType);
    }

}
