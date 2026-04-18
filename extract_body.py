#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys, io, re, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE = os.path.dirname(os.path.abspath(__file__))

def read(path):
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        return f.read()

def clean_html(html):
    # Eliminar scripts desactivados
    html = re.sub(r'<script[^>]*type="text/plain"[^>]*>[\s\S]*?</script>', '', html)
    html = re.sub(r'<script[^>]*type="application/json"[^>]*>[\s\S]*?</script>', '', html)
    # Eliminar iframes (recaptcha etc)
    html = re.sub(r'<iframe[\s\S]*?</iframe>', '', html)
    # Eliminar divs de grecaptcha
    html = re.sub(r'<div[^>]*class="grecaptcha[^"]*"[\s\S]*', '', html)
    # Eliminar next-route-announcer
    html = re.sub(r'<next-route-announcer>[\s\S]*?</next-route-announcer>', '', html)
    # Eliminar atributos data-savepage-*
    html = re.sub(r'\s+data-savepage-\w+="[^"]*"', '', html)
    # Eliminar data-s y data-emotion
    html = re.sub(r'\s+data-s=""', '', html)
    html = re.sub(r'\s+data-emotion="[^"]*"', '', html)
    # Eliminar scripts vacios
    html = re.sub(r'<script[^>]*></script>', '', html)
    return html.strip()

FILES = [
    ('login.html', 'login_body.txt'),
    ('registrationOTP.html', 'otp_body.txt'),
    ('confirmation.html', 'conf_body.txt'),
]

for src, out in FILES:
    raw = read(os.path.join(BASE, src))
    # Extraer contenido del div#__next
    m = re.search(r'<div id="__next">([\s\S]*?)</div>\s*<script', raw)
    if m:
        body = clean_html(m.group(1))
    else:
        # Fallback: buscar en el body real
        m2 = re.search(r'savepage-comments[^>]*>\s*</head>([\s\S]*?)(?:<script[^>]*data-savepage)', raw)
        if m2:
            body = clean_html(m2.group(1))
        else:
            body = '[ERROR: no encontrado]'
    out_path = os.path.join(BASE, out)
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(body)
    print(f'{src}: {len(body):,} chars guardados en {out}')
