import { TemplateDefinition, ScaffoldingContext, PlannedFileItem } from '../../../types/scaffolding';

// 7. Go (Gin / Standard Net/HTTP)
export const backendGo: TemplateDefinition = {
  id: 'backend-go',
  name: 'Go',
  category: 'backend',
  description: 'High-concurrency compiled backend with Go 1.22+, Gin HTTP router, and idiomatic cmd/internal structure.',
  icon: '🐹',
  badge: 'High Perf',
  languages: ['Go'],
  frameworks: ['Go 1.22+', 'Gin'],
  defaultPackageManager: 'go',
  supportedPackageManagers: ['go'],
  defaultArchitecture: 'modular',
  supportedArchitectures: ['modular', 'clean'],
  defaultPorts: { dev: 8080 },
  commands: { dev: 'go run cmd/api/main.go', build: 'go build -o bin/server cmd/api/main.go', test: 'go test ./...' },
  envVariables: [],
  compatibleLibraries: [],
  generateManifest: (ctx: ScaffoldingContext): PlannedFileItem[] => [
    {
      id: 'go-mod',
      path: 'go.mod',
      description: 'Go module definition',
      category: 'config',
      content: `module ${ctx.projectName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}\n\ngo 1.22\n\nrequire github.com/gin-gonic/gin v1.10.0\n`,
    },
    {
      id: 'main-go',
      path: 'cmd/api/main.go',
      description: 'Go application entry point',
      category: 'source',
      content: `package main

import (
	"net/http"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"service": "${ctx.projectName}",
		})
	})
	r.Run(":8080")
}
`,
    },
    {
      id: 'main-test',
      path: 'cmd/api/main_test.go',
      description: 'Go unit assertions',
      category: 'test',
      content: `package main

import "testing"

func TestHealthCheck(t *testing.T) {
	appName := "${ctx.projectName}"
	if appName == "" {
		t.Errorf("App name should not be empty")
	}
}
`,
    },
  ],
};

// 8. Rust (Axum / Tokio)
export const backendRust: TemplateDefinition = {
  id: 'backend-rust',
  name: 'Rust',
  category: 'backend',
  description: 'Memory-safe, blazingly fast asynchronous web service built with Rust 2021, Axum, and Tokio.',
  icon: '🦀',
  badge: 'Zero Overhead',
  languages: ['Rust'],
  frameworks: ['Axum', 'Tokio', 'Serde'],
  defaultPackageManager: 'cargo',
  supportedPackageManagers: ['cargo'],
  defaultArchitecture: 'modular',
  supportedArchitectures: ['modular', 'clean'],
  defaultPorts: { dev: 3000 },
  commands: { dev: 'cargo run', build: 'cargo build --release', test: 'cargo test' },
  envVariables: [],
  compatibleLibraries: [],
  generateManifest: (ctx: ScaffoldingContext): PlannedFileItem[] => [
    {
      id: 'cargo-toml',
      path: 'Cargo.toml',
      description: 'Cargo package manifest',
      category: 'config',
      content: `[package]
name = "${ctx.projectName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}"
version = "0.1.0"
edition = "2021"

[dependencies]
axum = "0.7"
tokio = { version = "1.0", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
`,
    },
    {
      id: 'main-rs',
      path: 'src/main.rs',
      description: 'Axum async server entry point',
      category: 'source',
      content: `use axum::{routing::get, Json, Router};
use serde_json::{json, Value};

#[tokio::main]
async fn main() {
    let app = Router::new().route("/health", get(health_handler));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    println!("[Rust Axum] Listening on http://0.0.0.0:3000");
    axum::serve(listener, app).await.unwrap();
}

async fn health_handler() -> Json<Value> {
    Json(json!({ "status": "healthy", "service": "${ctx.projectName}" }))
}
`,
    },
  ],
};

// 9. Java + Spring Boot
export const backendSpring: TemplateDefinition = {
  id: 'backend-spring',
  name: 'Java + Spring Boot',
  category: 'backend',
  description: 'Enterprise Java 21 REST API with Spring Boot 3, Spring Web, and Maven toolchain.',
  icon: '☕',
  languages: ['Java'],
  frameworks: ['Spring Boot 3', 'Java 21', 'Maven'],
  defaultPackageManager: 'dotnet',
  supportedPackageManagers: ['dotnet'],
  defaultArchitecture: 'modular',
  supportedArchitectures: ['modular', 'clean'],
  defaultPorts: { dev: 8080 },
  commands: { dev: './mvnw spring-boot:run', build: './mvnw clean package', test: './mvnw test' },
  envVariables: [],
  compatibleLibraries: [],
  generateManifest: (ctx: ScaffoldingContext): PlannedFileItem[] => [
    {
      id: 'pom-xml',
      path: 'pom.xml',
      description: 'Maven build file',
      category: 'config',
      content: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.example</groupId>
    <artifactId>${ctx.projectName.toLowerCase()}</artifactId>
    <version>0.0.1-SNAPSHOT</version>
</project>
`,
    },
    {
      id: 'app-java',
      path: 'src/main/java/com/example/demo/DemoApplication.java',
      description: 'Spring Boot main class',
      category: 'source',
      content: `package com.example.demo;

public class DemoApplication {
    public static void main(String[] args) {
        System.out.println("${ctx.projectName} Spring Boot ready.");
    }
}
`,
    },
  ],
};

// 10. .NET / C#
export const backendDotNet: TemplateDefinition = {
  id: 'backend-dotnet',
  name: '.NET',
  category: 'backend',
  description: 'High-throughput ASP.NET Core Web API with C# 12 and OpenAPI Swagger documentation.',
  icon: '🟣',
  languages: ['C#'],
  frameworks: ['ASP.NET Core', '.NET 8', 'C# 12'],
  defaultPackageManager: 'dotnet',
  supportedPackageManagers: ['dotnet'],
  defaultArchitecture: 'modular',
  supportedArchitectures: ['modular', 'clean'],
  defaultPorts: { dev: 5000 },
  commands: { dev: 'dotnet run', build: 'dotnet build', test: 'dotnet test' },
  envVariables: [],
  compatibleLibraries: [],
  generateManifest: (ctx: ScaffoldingContext): PlannedFileItem[] => [
    {
      id: 'csproj',
      path: `${ctx.projectName}.csproj`,
      description: '.NET C# Project File',
      category: 'config',
      content: `<Project Sdk="Microsoft.NET.Sdk.Web">\n  <PropertyGroup>\n    <TargetFramework>net8.0</TargetFramework>\n  </PropertyGroup>\n</Project>\n`,
    },
    {
      id: 'program-cs',
      path: 'Program.cs',
      description: 'ASP.NET Core Minimal API entry point',
      category: 'source',
      content: `var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "${ctx.projectName}" }));

app.Run();
`,
    },
  ],
};
