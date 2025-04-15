# Create the entire folder structure for the coffee-shop-system

# Frontend structure
New-Item -ItemType Directory -Path "frontend\assets" -Force
New-Item -ItemType Directory -Path "frontend\components" -Force
New-Item -ItemType Directory -Path "frontend\customer" -Force
New-Item -ItemType Directory -Path "frontend\staff" -Force
New-Item -ItemType Directory -Path "frontend\admin" -Force
New-Item -ItemType File -Path "frontend\index.html" -Force

# Backend structure
New-Item -ItemType Directory -Path "backend\src\main\java\com\cafeapp\controller" -Force
New-Item -ItemType Directory -Path "backend\src\main\java\com\cafeapp\service" -Force
New-Item -ItemType Directory -Path "backend\src\main\java\com\cafeapp\repository" -Force
New-Item -ItemType Directory -Path "backend\src\main\java\com\cafeapp\model" -Force
New-Item -ItemType Directory -Path "backend\src\main\java\com\cafeapp\config" -Force
New-Item -ItemType Directory -Path "backend\src\main\resources\static" -Force
New-Item -ItemType Directory -Path "backend\src\test" -Force
New-Item -ItemType File -Path "backend\pom.xml" -Force
New-Item -ItemType File -Path "backend\README.md" -Force
New-Item -ItemType File -Path "backend\src\main\resources\application.properties" -Force

# Database structure
New-Item -ItemType Directory -Path "database\migration" -Force
New-Item -ItemType File -Path "database\DATABASE_V1.sql" -Force
New-Item -ItemType File -Path "database\diagram.png" -Force

# Documentation structure
New-Item -ItemType Directory -Path "docs\diagrams" -Force
New-Item -ItemType File -Path "docs\user-story.md" -Force
New-Item -ItemType File -Path "docs\api-spec.yaml" -Force

# Root files
New-Item -ItemType File -Path ".gitignore" -Force

Write-Host "Coffee shop system structure created successfully!" -ForegroundColor Green