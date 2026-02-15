using Google.Apis.Auth.OAuth2;
using Google.Apis.Drive.v3;
using Google.Apis.Services;
using Orbit_BE.Interfaces;

public class GoogleDriveService : IGoogleDriveService
{
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
}
