@echo off
title Cloudflare Tunnel - WhatsApp Gateway
echo ===================================================
echo   Starting Cloudflare Tunnel for Phone Gateway
echo   Forwarding to: http://192.168.1.4:8088
echo ===================================================
"d:\mashro3\mashroh\tools\cloudflared.exe" tunnel --url http://192.168.1.4:8088
pause
