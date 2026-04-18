#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
"""
Extrae y limpia las páginas HTML del proyecto Lulo Bank PSE.
- Extrae el HTML del body (contenido real)
- Filtra el CSS a solo las reglas usadas
- Genera un styles.css compartido + 3 páginas HTML limpias
"""
import re
import os

PAGES = {
    'login.html':           'login',
    'registrationOTP.html': 'otp',
    'confirmation.html':    'confirmation',
}

OUT_DIR = os.path.dirname(os.path.abspath(__file__))


#  helpers 

def read_file(path):
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        return f.read()

def get_used_classes(html):
    """Devuelve el conjunto de todos los nombres de clase usados en el HTML."""
    classes = set()
    for m in re.finditer(r'class="([^"]*)"', html):
        for c in m.group(1).split():
            if c:
                classes.add(c)
    return classes

def extract_style_blocks(raw):
    """
    Extrae el texto de todos los <style> del <head> (no dentro de iframes/srcdoc).
    Excluye bloques de savepage y recaptcha que están anidados.
    """
    blocks = []
    # Solo buscamos los <style> del nivel superior (no dentro de atributos srcdoc)
    # Los <style> dentro de srcdoc tienen comillas escapadas: &quot;
    for m in re.finditer(r'<style(?:[^>]*)>([\s\S]*?)</style>', raw):
        start = m.start()
        # Si el match está dentro de un atributo (srcdoc) el texto antes tendrá
        # una cantidad impar de comillas después de un =  simplificamos:
        # si el contenido tiene &quot; es que está dentro de un atributo
        content = m.group(1)
        if '&quot;' in content:
            continue
        # Ignorar bloques de savepage-cssvariables (muy pequeños, no usados)
        full_tag = m.group(0)
        if 'savepage-cssvariables' in full_tag:
            continue
        if content.strip():
            blocks.append(content)
    return '\n'.join(blocks)

def extract_body_html(raw):
    """
    Extrae el contenido dentro de <div id="__next"> ... </div> del body.
    """
    # El cuerpo real está en el div#__next
    m = re.search(r'<div id="__next">([\s\S]*?)</div>\s*<script', raw)
    if m:
        return m.group(1)

    # Fallback: extraer todo el body
    m = re.search(r'<body[^>]*>([\s\S]*?)</body>', raw)
    if m:
        body = m.group(1)
        # Remover scripts, iframes, grecaptcha
        body = re.sub(r'<script[\s\S]*?</script>', '', body)
        body = re.sub(r'<iframe[\s\S]*?</iframe>', '', body)
        body = re.sub(r'<div[^>]*class="grecaptcha[\s\S]*?</div>\s*</div>', '', body)
        return body
    return ''

def clean_body(html):
    """Limpia el body HTML de artefactos de savepage."""
    # Eliminar scripts desactivados
    html = re.sub(r'<script[^>]*type="text/plain"[^>]*>[\s\S]*?</script>', '', html)
    html = re.sub(r'<script[^>]*data-savepage[^>]*>[\s\S]*?</script>', '', html)
    # Eliminar iframes (recaptcha, etc.)
    html = re.sub(r'<iframe[\s\S]*?</iframe>', '', html)
    # Eliminar divs de grecaptcha
    html = re.sub(r'<div[^>]*class="grecaptcha[^"]*"[\s\S]*?(?=</div></div>)</div></div>', '', html)
    # Eliminar next-route-announcer
    html = re.sub(r'<next-route-announcer>[\s\S]*?</next-route-announcer>', '', html)
    # Eliminar atributos de savepage
    html = re.sub(r'\s*data-savepage-\w+="[^"]*"', '', html)
    html = re.sub(r'\s*data-s=""', '', html)
    html = re.sub(r'\s*data-emotion="[^"]*"', '', html)
    # Eliminar scripts vacíos
    html = re.sub(r'<script[^>]*></script>', '', html)
    # Limpiar atributos de MUI que no son necesarios para el estilo visual
    # (pero conservar los class, style, type, etc.)
    return html.strip()

def filter_css(css_text, used_classes):
    """
    Filtra el CSS para quedarse solo con las reglas cuyo selector
    hace referencia a alguna de las clases usadas en el HTML,
    más los selectores de elementos base y @rules relevantes.
    """
    # Clases que queremos conservar (incluye prefijos comunes)
    cls_set = used_classes.copy()
    # Añadir prefijos MUI que pueden tener variantes no explícitas en el HTML
    extra_prefixes = ('Mui', 'css-', 'Header_', 'Login_', 'Footer_',
                      'Password_', 'Email_', 'Button_', 'Icons_',
                      'OTP_', 'Otp_', 'Confirmation_', 'grecaptcha',
                      'rc-anchor')
    # También conservar selectores de elementos/pseudo
    base_selectors = {
        '*', 'body', 'html', ':root', '::before', '::after',
        'input', 'button', 'form', 'label', 'a', 'p', 'span',
        'div', 'h1', 'h2', 'h3', 'footer', 'nav', 'ul', 'li',
    }

    output_rules = []
    i = 0
    n = len(css_text)

    while i < n:
        # Saltar whitespace
        while i < n and css_text[i] in ' \t\n\r':
            i += 1
        if i >= n:
            break

        # Saltar comentarios
        if css_text[i:i+2] == '/*':
            end = css_text.find('*/', i + 2)
            i = (end + 2) if end != -1 else n
            continue

        # Buscar el selector (hasta el primer '{')
        j = i
        while j < n and css_text[j] != '{':
            j += 1
        if j >= n:
            break

        selector = css_text[i:j].strip()

        # Buscar la llave de cierre correspondiente (maneja anidamiento)
        depth = 0
        k = j
        while k < n:
            if css_text[k] == '{':
                depth += 1
            elif css_text[k] == '}':
                depth -= 1
                if depth == 0:
                    break
            k += 1

        full_rule = css_text[i:k + 1]

        #  Decidir si conservar la regla 
        keep = False

        if selector.startswith('@font-face'):
            keep = True  # Conservar fuentes
        elif selector.startswith('@keyframes'):
            keep = True  # Conservar animaciones
        elif selector.startswith('@media') or selector.startswith('@supports'):
            # Solo conservar si el bloque interno contiene clases usadas
            inner = css_text[j + 1:k]
            for cls in cls_set:
                if ('.' + cls) in inner:
                    keep = True
                    break
            if not keep:
                for pfx in extra_prefixes:
                    if ('.' + pfx) in inner:
                        keep = True
                        break
        elif selector.startswith('@'):
            keep = True  # Otros @ rules
        else:
            # Regla normal: verificar si el selector usa alguna clase/elemento conocido
            for cls in cls_set:
                if ('.' + cls) in selector or cls in selector:
                    keep = True
                    break
            if not keep:
                for pfx in extra_prefixes:
                    if ('.' + pfx) in selector:
                        keep = True
                        break
            if not keep:
                # Verificar selectores de elementos base
                sel_clean = selector.lstrip('.#:*[')
                for base in base_selectors:
                    if base in selector:
                        keep = True
                        break

        if keep:
            output_rules.append(full_rule)

        i = k + 1

    return '\n'.join(output_rules)


#  plantilla HTML 

HTML_TEMPLATE = """\
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
<div id="__next">
{body}
</div>
</body>
</html>
"""

PAGE_TITLES = {
    'login':        'Lulo Bank  Ingresar',
    'otp':          'Lulo Bank  Verificación',
    'confirmation': 'Lulo Bank  Confirmación de pago',
}


#  main 

def process_file(filename, key):
    path = os.path.join(OUT_DIR, filename)
    print(f'\nProcesando {filename} ...')
    raw = read_file(path)

    # CSS
    css_text = extract_style_blocks(raw)
    print(f'   CSS extraído: {len(css_text):,} chars')

    # Body
    body_raw = extract_body_html(raw)
    body_clean = clean_body(body_raw)
    print(f'   HTML body:    {len(body_clean):,} chars')

    # Clases usadas
    used = get_used_classes(body_clean)
    print(f'   Clases usadas: {len(used)}')

    return css_text, body_clean, used


def main():
    all_css_blocks = []
    pages = {}

    for filename, key in PAGES.items():
        css_text, body, used = process_file(filename, key)
        all_css_blocks.append(css_text)
        pages[key] = (body, used)

    # Unir todo el CSS y obtener todas las clases de todas las páginas
    combined_css_raw = '\n'.join(all_css_blocks)
    all_classes = set()
    for _, (_, used) in pages.items():
        all_classes |= used

    print(f'\n Total clases a conservar: {len(all_classes)}')
    print(' Filtrando CSS ...')
    filtered_css = filter_css(combined_css_raw, all_classes)
    print(f'   CSS original:  {len(combined_css_raw):,} chars')
    print(f'   CSS filtrado:  {len(filtered_css):,} chars')
    reduction = (1 - len(filtered_css) / max(len(combined_css_raw), 1)) * 100
    print(f'   Reducción:     {reduction:.1f}%')

    # Escribir styles.css compartido
    css_out = os.path.join(OUT_DIR, 'styles.css')
    with open(css_out, 'w', encoding='utf-8') as f:
        # Encabezado + Google Fonts
        f.write("/* Roboto font */\n")
        f.write("@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');\n\n")
        f.write(filtered_css)
    print(f'\n styles.css guardado ({os.path.getsize(css_out):,} bytes)')

    # Escribir páginas HTML limpias
    out_files = {
        'login':        'login_clean.html',
        'otp':          'registrationOTP_clean.html',
        'confirmation': 'confirmation_clean.html',
    }

    for key, out_name in out_files.items():
        body, _ = pages[key]
        html = HTML_TEMPLATE.format(
            title=PAGE_TITLES[key],
            body=body,
        )
        out_path = os.path.join(OUT_DIR, out_name)
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(html)
        size = os.path.getsize(out_path)
        print(f' {out_name} guardado ({size:,} bytes)')

    print('\n Listo! Archivos generados:')
    print('   styles.css')
    for v in out_files.values():
        print(f'   {v}')


if __name__ == '__main__':
    main()
