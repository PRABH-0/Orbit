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
    public async Task<List<object>> GetFilesAsync(string accessToken)
    {
        var credential = GoogleCredential.FromAccessToken(accessToken);

        var service = new DriveService(new BaseClientService.Initializer()
        {
            HttpClientInitializer = credential,
            ApplicationName = "Orbit"
        });

        var allFiles = new List<Google.Apis.Drive.v3.Data.File>();
        string? nextPageToken = null;

        do
        {
            var request = service.Files.List();
            request.PageSize = 100;
            request.Fields = "nextPageToken, files(id, name, mimeType, thumbnailLink)";
            request.PageToken = nextPageToken;

            var result = await request.ExecuteAsync();

            if (result.Files != null)
                allFiles.AddRange(result.Files);

            nextPageToken = result.NextPageToken;

        } while (!string.IsNullOrEmpty(nextPageToken));

        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", accessToken);

        var finalList = new List<object>();

        foreach (var f in allFiles)
        {
            string? base64Thumbnail = null;

            if (!string.IsNullOrEmpty(f.ThumbnailLink))
            {
                try
                {
                    var thumbResponse = await client.GetAsync(f.ThumbnailLink);
                    var bytes = await thumbResponse.Content.ReadAsByteArrayAsync();
                    var base64 = Convert.ToBase64String(bytes);
                    base64Thumbnail = $"data:image/jpeg;base64,{base64}";
                }
                catch
                {
                    base64Thumbnail = null;
                }
            }

            finalList.Add(new
            {
                id = f.Id,
                name = f.Name,
                mimeType = f.MimeType,
                thumbnail = base64Thumbnail,
                streamUrl = $"/api/google-drive/file/{f.Id}"
            });
        }

        return finalList;
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
