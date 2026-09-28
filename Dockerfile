FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ConstruApp.Core/ConstruApp.Core.csproj ConstruApp.Core/
COPY ConstruApp.Infrastructure/ConstruApp.Infrastructure.csproj ConstruApp.Infrastructure/
COPY ConstruApp.API/ConstruApp.API.csproj ConstruApp.API/
RUN dotnet restore ConstruApp.API/ConstruApp.API.csproj

COPY ConstruApp.Core/ ConstruApp.Core/
COPY ConstruApp.Infrastructure/ ConstruApp.Infrastructure/
COPY ConstruApp.API/ ConstruApp.API/
RUN dotnet publish ConstruApp.API/ConstruApp.API.csproj -c Release -o /app/out

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/out .
EXPOSE 8080
ENTRYPOINT ["dotnet", "ConstruApp.API.dll"]
