FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

COPY . .

RUN dotnet restore RepoLens.slnx

RUN dotnet publish src/RepoLens.API/RepoLens.API.csproj \
-c Release \
-o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0

WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet","RepoLens.API.dll"]