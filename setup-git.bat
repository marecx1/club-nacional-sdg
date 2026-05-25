@echo off
title Configurar Git - Club Nacional SDG
chcp 65001 > nul
cls
echo =======================================================================
echo     CONFIGURACIÓN DE GIT AUTOMATIZADA - CLUB NACIONAL SDG 🇵🇾⚽
echo =======================================================================
echo.
echo [1/4] Inicializando repositorio Git local...
git init
echo.
echo [2/4] Agregando archivos del proyecto...
git add .
echo.
echo [3/4] Creando el primer commit contable...
git commit -m "feat: initial commit - Club Nacional SDG"
echo.
echo =======================================================================
echo   REPOSITORIO LOCAL CONFIGURADO CON ÉXITO
echo =======================================================================
echo.
echo Sigue estos dos sencillos pasos:
echo 1. Ingresa a tu navegador a: https://github.com/new
echo 2. Crea un repositorio llamado "club-nacional-sdg" (Público o Privado)
echo    *NO agregues README, .gitignore ni licencias en la web*
echo.
set /p REPO_URL="-> Pega la URL del repositorio creado (ej. https://github.com/usuario/club-nacional-sdg.git): "
echo.
echo [4/4] Estableciendo rama principal y subiendo código a GitHub...
git branch -M main
git remote add origin %REPO_URL%
git push -u origin main
echo.
echo =======================================================================
echo   ¡PROYECTO SUBIDO A GITHUB CON ÉXITO!
echo =======================================================================
echo.
echo Próximos pasos para conectar con Netlify en la web:
echo 1. Entra a https://app.netlify.com
echo 2. Haz clic en "Add new site" -> "Import an existing project".
echo 3. Selecciona "GitHub" y elige tu repositorio "club-nacional-sdg".
echo 4. Deja la configuración de construcción por defecto (sin comando y carpeta ".").
echo 5. ¡Listo! Tu app se desplegará online automáticamente y se actualizará
echo    con cada push que realices a GitHub.
echo.
pause
