#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Filtra styles.css para quedarse solo con las reglas usadas en los HTML limpios.
Genera styles_min.css.
"""
import sys, io, re, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE = os.path.dirname(os.path.abspath(__file__))

CLEAN_PAGES = ['login_clean.html', 'registrationOTP_clean.html', 'confirmation_clean.html']

# Selectores de elementos base que siempre se conservan
BASE_ELEMENTS = {
    '*', 'body', 'html', ':root', 'input', 'button', 'form',
    'label', 'a', 'p', 'span', 'div', 'svg', 'path', 'footer',
    'nav', 'ul', 'li', 'h1','h2','h3','h4','h5','h6',
}


def read(path):
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        return f.read()


def get_used_classes(html):
    classes = set()
    for m in re.finditer(r'class="([^"]*)"', html):
        for c in m.group(1).split():
            if c and c != 'undefined':
                classes.add(c)
    return classes


def selector_matches(selector, used_classes):
    """
    True si el selector hace referencia a alguna clase usada o elemento base.
    Usa matching exacto de nombre de clase (no prefijos).
    """
    # Elementos base simples
    s = selector.strip()
    for el in BASE_ELEMENTS:
        # el selector ES el elemento, o empieza con el o lo contiene como token
        if re.search(r'(?:^|[\s,>+~])' + re.escape(el) + r'(?:$|[\s,>+~:{[])', s):
            return True
        if s == el:
            return True

    # Clases exactas: .ClassName o .ClassName:hover etc.
    for cls in used_classes:
        # Buscar .ClassName seguido de fin, pseudo, espacio, coma, >+~ o [
        pattern = r'\.' + re.escape(cls) + r'(?:[^-\w]|$)'
        if re.search(pattern, s):
            return True
    return False


def filter_css(css_text, used_classes):
    output = []
    i = 0
    n = len(css_text)

    while i < n:
        # Saltar whitespace
        while i < n and css_text[i] in ' \t\n\r':
            i += 1
        if i >= n:
            break

        # Saltar comentarios block
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

        # Encontrar la llave de cierre correspondiente
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

        # Decidir si conservar
        keep = False

        if selector.startswith('@font-face'):
            keep = True
        elif selector.startswith('@keyframes'):
            keep = True
        elif selector.startswith('@media') or selector.startswith('@supports'):
            # Filtrar el bloque interno recursivamente
            inner_start = css_text.find('{', i) + 1
            inner = css_text[inner_start:k]
            filtered_inner = filter_css(inner, used_classes)
            if filtered_inner.strip():
                keep = True
                full_rule = selector + ' {\n' + filtered_inner + '\n}'
        elif selector.startswith('@'):
            keep = True
        else:
            # Puede ser múltiples selectores separados por coma
            parts = [p.strip() for p in selector.split(',')]
            matching = [p for p in parts if selector_matches(p, used_classes)]
            if matching:
                keep = True
                # Reconstruir rule solo con los selectores que hacen match
                if len(matching) < len(parts):
                    body_start = css_text.find('{', i)
                    rule_body = css_text[body_start:k+1]
                    full_rule = ', '.join(matching) + ' ' + rule_body

        if keep:
            output.append(full_rule)

        i = k + 1

    return '\n'.join(output)


def main():
    # Recolectar todas las clases usadas
    all_classes = set()
    for fn in CLEAN_PAGES:
        path = os.path.join(BASE, fn)
        all_classes |= get_used_classes(read(path))

    print(f'Clases usadas: {len(all_classes)}')

    # Leer CSS completo
    css_path = os.path.join(BASE, 'styles.css')
    css_raw = read(css_path)
    print(f'CSS original: {len(css_raw):,} chars')

    filtered = filter_css(css_raw, all_classes)
    print(f'CSS filtrado: {len(filtered):,} chars')
    reduction = (1 - len(filtered) / max(len(css_raw), 1)) * 100
    print(f'Reduccion:   {reduction:.1f}%')

    out_path = os.path.join(BASE, 'styles_min.css')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(filtered)
    print(f'Guardado: styles_min.css ({os.path.getsize(out_path):,} bytes)')


if __name__ == '__main__':
    main()
