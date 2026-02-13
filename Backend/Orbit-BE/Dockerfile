# Use official .NET runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

# Copy published files
COPY . .

# Expose port
EXPOSE 8080

# Run the app
ENTRYPOINT ["dotnet", "Orbit-BE.dll"]
