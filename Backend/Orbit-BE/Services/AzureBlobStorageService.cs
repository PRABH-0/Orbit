using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Options;
using Orbit_BE.Interfaces;
using Orbit_BE.Options;
namespace Orbit_BE.Services
{
    public class AzureBlobStorageService : IFileStorageService
    {

        private readonly BlobContainerClient _containerClient;

        public AzureBlobStorageService(
            IOptions<AzureBlobOptions> options)
        {
            var cfg = options.Value;

            var blobServiceClient =
                new BlobServiceClient(cfg.ConnectionString);

            _containerClient =
                blobServiceClient.GetBlobContainerClient(
                    cfg.ContainerName);
        }

        public async Task<string> UploadAsync(
            Stream fileStream,
            string fileName,
            string contentType,
            Guid userId,
            Guid nodeId)
        {
            var safeFileName =
                $"{Guid.NewGuid()}_{fileName}";

            var storagePath =
                $"users/{userId}/{nodeId}/{safeFileName}";

            var blobClient =
                _containerClient.GetBlobClient(storagePath);

            var blobHttpHeaders = new BlobHttpHeaders
            {
                ContentType = contentType
            };

            await blobClient.UploadAsync(
                fileStream,
                new BlobUploadOptions
                {
                    HttpHeaders = blobHttpHeaders
                });

            return storagePath;
        }

        public async Task<(byte[] FileBytes, string ContentType)>
            DownloadAsync(string storagePath)
        {
            var blobClient =
                _containerClient.GetBlobClient(storagePath);

            if (!await blobClient.ExistsAsync())
                throw new FileNotFoundException();

            var download =
                await blobClient.DownloadContentAsync();

            var bytes =
                download.Value.Content.ToArray();

            var contentType =
                download.Value.Details.ContentType
                ?? "application/octet-stream";

            return (bytes, contentType);
        }

        public async Task DeleteAsync(string storagePath)
        {
            var blobClient =
                _containerClient.GetBlobClient(storagePath);

            await blobClient.DeleteIfExistsAsync();
        }
    }
}