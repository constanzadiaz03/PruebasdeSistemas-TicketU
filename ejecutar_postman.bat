@echo off
chcp 65001 >nul
cd /d "%~dp0"
rem Uso:  ejecutar_integracion.bat [id_evento_solo_lectura] [id_evento_para_pruebas_de_escritura]
rem   1.er parametro: evento con varias resenas (carpeta M2, SOLO LECTURA). Ej.: la Fiesta de generacion 2026.
rem   2.o parametro : evento propio para la carpeta M (CREA y ELIMINA resenas). No usar con el evento de la Fiesta.
set COL=TicketU_Resenas_Integracion_G6.postman_collection.json
set EXTRA=
if not "%~1"=="" set EXTRA=%EXTRA% --env-var "eventIdFiesta=%~1"
if not "%~2"=="" set EXTRA=%EXTRA% --env-var "eventIdMultiple=%~2"
if not exist "%COL%" (
  echo No se encuentra %COL% en esta carpeta:
  echo %cd%
  echo Archivos .json que si hay aqui:
  dir /b *.json
  pause
  exit /b 1
)
echo Fecha y hora de ejecucion: %date% %time% > reporte_integracion.txt
call newman run "%COL%" %EXTRA% --color off >> reporte_integracion.txt 2>&1
type reporte_integracion.txt
echo.
echo Listo: reporte_integracion.txt
pause
