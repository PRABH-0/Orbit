# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["Orbit-BE.csproj", "./"]
RUN dotnet restore "Orbit-BE.csproj"

COPY . .
RUN dotnet publish "Orbit-BE.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "Orbit-BE.dll"]
