# Use the official .NET 10.0 SDK image to build the app
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["visualizer_demo/visualizer_demo.csproj", "visualizer_demo/"]
RUN dotnet restore "visualizer_demo/visualizer_demo.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/visualizer_demo"
RUN dotnet build "visualizer_demo.csproj" -c Release -o /app/build

# Publish the app
FROM build AS publish
RUN dotnet publish "visualizer_demo.csproj" -c Release -o /app/publish

# Use the official ASP.NET Core runtime image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Expose port 80
EXPOSE 80

# Set the entry point
ENTRYPOINT ["dotnet", "visualizer_demo.dll"]
